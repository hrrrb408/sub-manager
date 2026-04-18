import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";
import { sendWebhook } from "@/lib/notify";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  // Read user's own notification config
  const config = await prisma.notificationConfig.findUnique({
    where: { userId },
  });

  if (!config) {
    return NextResponse.json({ error: "通知配置不存在，请先配置通知设置" }, { status: 404 });
  }

  const body = await request.json();
  const { type } = body;

  try {
    if (type === "email") {
      if (!config.emailEnabled || !config.smtpHost || !config.smtpUser || !config.emailTo) {
        return NextResponse.json({ error: "邮件通知未完整配置" }, { status: 400 });
      }
      const transporter = nodemailer.createTransport({
        host: config.smtpHost!,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: { user: config.smtpUser!, pass: config.smtpPass! },
      } as nodemailer.TransportOptions);
      await transporter.sendMail({
        from: `"SubManager" <${config.emailFrom || config.smtpUser}>`,
        to: config.emailTo,
        subject: "SubManager 测试邮件",
        html: "<p>如果你收到了这封邮件，说明邮件通知配置成功！</p>",
      });
    } else if (type === "webhook") {
      if (!config.webhookEnabled || !config.webhookUrl || !config.webhookType) {
        return NextResponse.json({ error: "Webhook 通知未完整配置" }, { status: 400 });
      }
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
