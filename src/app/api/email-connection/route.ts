import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";
import { encryptServer } from "@/lib/server-crypto";
import { getImapConfig } from "@/lib/email-providers";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const connections = await prisma.emailConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Mask passwords
  const masked = connections.map((c) => ({
    ...c,
    encryptedPassword: "••••••",
  }));

  return NextResponse.json(masked);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { provider, imapHost, imapPort, email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  // Auto-fill IMAP settings from provider preset
  let host = imapHost;
  let port = imapPort || 993;
  if (provider && getImapConfig(provider)) {
    const config = getImapConfig(provider)!;
    host = config.host;
    port = config.port;
  }

  if (!host) {
    return NextResponse.json({ error: "请选择邮箱提供商或手动填写 IMAP 服务器" }, { status: 400 });
  }

  // Check duplicate
  const existing = await prisma.emailConnection.findUnique({
    where: { userId_email: { userId, email } },
  });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已添加" }, { status: 409 });
  }

  const encryptedPassword = encryptServer(password);

  const connection = await prisma.emailConnection.create({
    data: {
      userId,
      provider: provider || "custom",
      imapHost: host,
      imapPort: port,
      email,
      encryptedPassword,
    },
  });

  return NextResponse.json({
    ...connection,
    encryptedPassword: "••••••",
  }, { status: 201 });
}
