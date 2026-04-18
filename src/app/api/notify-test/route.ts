import { NextRequest, NextResponse } from "next/server";
import { sendWebhook } from "@/lib/notify";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, config } = body;

  try {
    if (type === "email") {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: { user: config.smtpUser, pass: config.smtpPass },
      });
      await transporter.sendMail({
        from: `"SubManager" <${config.emailFrom || config.smtpUser}>`,
        to: config.emailTo,
        subject: "SubManager 测试邮件",
        html: "<p>如果你收到了这封邮件，说明邮件通知配置成功！</p>",
      });
    } else if (type === "webhook") {
      await sendWebhook(
        config.webhookUrl,
        config.webhookType,
        "SubManager 测试通知",
        "如果你看到了这条消息，说明 Webhook 通知配置成功！"
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "测试失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
