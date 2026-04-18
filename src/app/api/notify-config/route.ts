import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.notificationConfig.findUnique({
    where: { id: "default" },
  });
  if (!config) {
    return NextResponse.json({
      id: "default",
      emailEnabled: false,
      smtpHost: null,
      smtpPort: 465,
      smtpUser: null,
      smtpPass: null,
      emailFrom: null,
      emailTo: null,
      webhookEnabled: false,
      webhookType: null,
      webhookUrl: null,
      webhookSecret: null,
      checkHour: 9,
    });
  }
  // Don't expose password in GET
  return NextResponse.json({
    ...config,
    smtpPass: config.smtpPass ? "••••••" : null,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const data = {
    emailEnabled: body.emailEnabled ?? false,
    smtpHost: body.smtpHost || null,
    smtpPort: body.smtpPort || 465,
    smtpUser: body.smtpUser || null,
    emailFrom: body.emailFrom || null,
    emailTo: body.emailTo || null,
    webhookEnabled: body.webhookEnabled ?? false,
    webhookType: body.webhookType || null,
    webhookUrl: body.webhookUrl || null,
    webhookSecret: body.webhookSecret || null,
    checkHour: body.checkHour ?? 9,
  };

  // Only update password if it's not the mask
  if (body.smtpPass && body.smtpPass !== "••••••") {
    (data as Record<string, unknown>).smtpPass = body.smtpPass;
  }

  const config = await prisma.notificationConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json({
    ...config,
    smtpPass: config.smtpPass ? "••••••" : null,
  });
}
