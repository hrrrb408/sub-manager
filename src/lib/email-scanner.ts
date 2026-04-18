import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { decryptServer } from "@/lib/server-crypto";
import { parseEmailWithLLM } from "@/lib/llm-parser";

const PAYMENT_KEYWORDS = [
  "payment", "subscription", "receipt", "invoice", "charge", "billing",
  "renew", "renewal", "trial", "upgrade", "plan",
  "订阅", "付款", "扣费", "账单", "续费", "充值", "会员", "自动续费",
  "收据", "发票", "账单",
];

function matchesKeywords(subject: string, text: string): boolean {
  const lower = (subject + " " + text).toLowerCase();
  return PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function scanEmailsForUser(userId: string) {
  const connections = await prisma.emailConnection.findMany({
    where: { userId, scanEnabled: true },
  });

  if (connections.length === 0) return { scanned: 0, found: 0 };

  let totalScanned = 0;
  let totalFound = 0;

  for (const conn of connections) {
    try {
      const result = await scanConnection(conn);
      totalScanned += result.scanned;
      totalFound += result.found;
    } catch (error) {
      console.error(`[EmailScan] Error for connection ${conn.id}:`, error);
    }
  }

  return { scanned: totalScanned, found: totalFound };
}

async function scanConnection(conn: {
  id: string;
  userId: string;
  imapHost: string;
  imapPort: number;
  email: string;
  encryptedPassword: string;
  lastScanAt: Date | null;
  scanFolder: string;
}) {
  const password = decryptServer(conn.encryptedPassword);

  const client = new ImapFlow({
    host: conn.imapHost,
    port: conn.imapPort,
    secure: true,
    auth: {
      user: conn.email,
      pass: password,
    },
    logger: false as unknown as undefined,
  });

  let scanned = 0;
  let found = 0;

  try {
    await client.connect();

    const lock = await client.getMailboxLock(conn.scanFolder);
    try {
      const since = conn.lastScanAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const searchCriteria = {
        since,
        header: { "Content-Type": "text/" },
      };

      for await (const message of client.fetch(searchCriteria, {
        source: true,
        envelope: true,
      })) {
        scanned++;

        try {
          if (!message.source) continue;
          const parsed = await simpleParser(message.source as Parameters<typeof simpleParser>[0]);
          const subject = parsed.subject || "";
          const text = parsed.text || (typeof parsed.html === "string" ? parsed.html.replace(/<[^>]+>/g, " ") : "") || "";

          if (!matchesKeywords(subject, text)) continue;

          const result = await parseEmailWithLLM(subject, text);
          if (!result || result.confidence < 0.6) continue;

          // Check if we already discovered this email
          const existing = await prisma.discoveredSubscription.findFirst({
            where: {
              userId: conn.userId,
              emailSubject: subject,
              emailDate: parsed.date || new Date(),
            },
          });

          if (existing) continue;

          await prisma.discoveredSubscription.create({
            data: {
              userId: conn.userId,
              emailConnectionId: conn.id,
              emailSubject: subject,
              emailFrom: parsed.from?.text || null,
              emailDate: parsed.date || new Date(),
              emailBodySnippet: text.slice(0, 500),
              serviceName: result.serviceName,
              amount: result.amount,
              currency: result.currency,
              billingCycle: result.billingCycle,
              parsedDate: result.parsedDate ? new Date(result.parsedDate) : null,
              confidence: result.confidence,
            },
          });

          found++;
        } catch (parseError) {
          console.error("[EmailScan] Message parse error:", parseError);
        }
      }
    } finally {
      lock.release();
    }

    // Update lastScanAt
    await prisma.emailConnection.update({
      where: { id: conn.id },
      data: { lastScanAt: new Date() },
    });
  } finally {
    await client.logout().catch(() => {});
  }

  return { scanned, found };
}
