import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { getNextRenewalDate, type BillingCycle } from "./types";

// ============ Email ============

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
}

async function sendEmail(config: EmailConfig, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  } as nodemailer.TransportOptions);

  const recipients = config.to.split(",").map((s) => s.trim()).filter(Boolean);

  await transporter.sendMail({
    from: `"SubManager 订阅提醒" <${config.from}>`,
    to: recipients.join(", "),
    subject,
    html,
  });
}

// ============ Webhook: 钉钉 ============

async function sendDingTalk(url: string, title: string, text: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: { title, text },
    }),
  });
  if (!res.ok) throw new Error(`钉钉推送失败: ${res.status}`);
}

// ============ Webhook: 企业微信 ============

async function sendWeCom(url: string, title: string, text: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: { content: `## ${title}\n\n${text}` },
    }),
  });
  if (!res.ok) throw new Error(`企业微信推送失败: ${res.status}`);
}

// ============ Webhook: 飞书 ============

async function sendFeishu(url: string, title: string, text: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg_type: "interactive",
      card: {
        header: { title: { tag: "plain_text", content: title } },
        elements: [{ tag: "markdown", content: text }],
      },
    }),
  });
  if (!res.ok) throw new Error(`飞书推送失败: ${res.status}`);
}

// ============ Main notification sender ============

export async function sendWebhook(
  url: string,
  type: string,
  title: string,
  text: string
) {
  switch (type) {
    case "dingtalk":
      return sendDingTalk(url, title, text);
    case "wecom":
      return sendWeCom(url, title, text);
    case "feishu":
      return sendFeishu(url, title, text);
    default:
      // Generic webhook POST
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
      });
      if (!res.ok) throw new Error(`Webhook 推送失败: ${res.status}`);
  }
}

export async function checkAndNotify(userId: string) {
  const config = await prisma.notificationConfig.findUnique({
    where: { userId },
  });

  if (!config) return { sent: 0, errors: [] };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "active" },
  });

  // Find subscriptions expiring within remindDays (auto-calculate renewal date)
  const expiring = subscriptions
    .map((s) => {
      const nextDate = getNextRenewalDate(s.startDate, s.billingCycle as BillingCycle, s.endDate);
      if (!nextDate) return null;
      const days = Math.ceil(
        (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days < 0 || days > s.remindDays) return null;
      return { ...s, _nextRenewal: nextDate, _daysUntil: days };
    })
    .filter(Boolean) as (typeof subscriptions[number] & {
      _nextRenewal: Date;
      _daysUntil: number;
    })[];

  if (expiring.length === 0) return { sent: 0, errors: [] };

  const results: { sent: number; errors: string[] } = { sent: 0, errors: [] };

  const title = `订阅到期提醒 (${expiring.length}个)`;
  const lines = expiring
    .sort((a, b) => a._daysUntil - b._daysUntil)
    .map(
      (s) =>
        `- **${s.name}** (${s.platform}) - 续费日: ${s._nextRenewal.toLocaleDateString("zh-CN")}（${s._daysUntil}天后） - $${s.amount}/${s.billingCycle === "monthly" ? "月" : s.billingCycle === "yearly" ? "年" : "周"}`
    );
  const text = lines.join("\n");

  // Send email
  if (
    config.emailEnabled &&
    config.smtpHost &&
    config.smtpUser &&
    config.emailTo
  ) {
    try {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">订阅到期提醒</h2>
          <p>以下 ${expiring.length} 个订阅即将到期：</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">服务</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">平台</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">到期日</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">费用</th>
              </tr>
            </thead>
            <tbody>
              ${expiring
                .sort((a, b) => a._daysUntil - b._daysUntil)
                .map(
                  (s) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.name}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.platform}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${s._nextRenewal.toLocaleDateString("zh-CN")}（${s._daysUntil}天后）</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">$${s.amount}/${s.billingCycle === "monthly" ? "月" : s.billingCycle === "yearly" ? "年" : "周"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">此邮件由 SubManager 自动发送</p>
        </div>
      `;

      await sendEmail(
        {
          host: config.smtpHost,
          port: config.smtpPort,
          user: config.smtpUser,
          pass: config.smtpPass || "",
          from: config.emailFrom || config.smtpUser,
          to: config.emailTo,
        },
        title,
        html
      );

      await prisma.notificationLog.create({
        data: { userId, type: "email", status: "success", title, content: text },
      });
      results.sent++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "邮件发送失败";
      results.errors.push(`邮件: ${msg}`);
      await prisma.notificationLog.create({
        data: { userId, type: "email", status: "failed", title, error: msg },
      });
    }
  }

  // Send webhook
  if (config.webhookEnabled && config.webhookUrl && config.webhookType) {
    try {
      await sendWebhook(config.webhookUrl, config.webhookType, title, text);
      await prisma.notificationLog.create({
        data: { userId, type: "webhook", status: "success", title, content: text },
      });
      results.sent++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Webhook 发送失败";
      results.errors.push(`Webhook: ${msg}`);
      await prisma.notificationLog.create({
        data: { userId, type: "webhook", status: "failed", title, error: msg },
      });
    }
  }

  return results;
}
