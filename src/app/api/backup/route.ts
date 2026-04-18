import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const [subscriptions, notificationConfig, budgetConfig] = await Promise.all([
      prisma.subscription.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.notificationConfig.findUnique({ where: { id: "default" } }),
      prisma.budgetConfig.findUnique({ where: { id: "default" } }),
    ]);

    const backup = {
      subscriptions,
      notificationConfig,
      budgetConfig,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="submanager-backup-${date}.json"`,
      },
    });
  } catch (error) {
    console.error("Failed to export backup:", error);
    return NextResponse.json(
      { error: "Failed to export backup" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.subscriptions || !Array.isArray(body.subscriptions)) {
      return NextResponse.json(
        { error: "Invalid backup data: missing subscriptions array" },
        { status: 400 }
      );
    }

    const subscriptions = body.subscriptions;
    const notificationConfig = body.notificationConfig;
    const budgetConfig = body.budgetConfig;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing subscriptions
      await tx.subscription.deleteMany();

      // 2. Create all subscriptions from backup
      if (subscriptions.length > 0) {
        const createData = subscriptions.map((sub: Record<string, unknown>) => ({
          id: (sub.id as string) || undefined,
          name: sub.name as string,
          platform: sub.platform as string,
          plan: sub.plan as string,
          amount: typeof sub.amount === "number" ? sub.amount : parseFloat(String(sub.amount)),
          currency: (sub.currency as string) || "USD",
          billingCycle: (sub.billingCycle as string) || "monthly",
          status: (sub.status as string) || "active",
          category: (sub.category as string) || "other",
          startDate: sub.startDate ? new Date(sub.startDate as string) : new Date(),
          endDate: sub.endDate ? new Date(sub.endDate as string) : null,
          paymentMethod: (sub.paymentMethod as string) || null,
          account: (sub.account as string) || null,
          encryptedPassword: (sub.encryptedPassword as string) || null,
          description: (sub.description as string) || null,
          url: (sub.url as string) || null,
          logoUrl: (sub.logoUrl as string) || null,
          color: (sub.color as string) || null,
          remindDays: typeof sub.remindDays === "number" ? sub.remindDays : 7,
        }));
        await tx.subscription.createMany({ data: createData });
      }

      // 3. Upsert notificationConfig if present
      if (notificationConfig && typeof notificationConfig === "object") {
        const nc = notificationConfig as Record<string, unknown>;
        await tx.notificationConfig.upsert({
          where: { id: "default" },
          update: {
            emailEnabled: (nc.emailEnabled as boolean) ?? false,
            smtpHost: (nc.smtpHost as string) || null,
            smtpPort: (nc.smtpPort as number) ?? 465,
            smtpUser: (nc.smtpUser as string) || null,
            smtpPass: (nc.smtpPass as string) || null,
            emailFrom: (nc.emailFrom as string) || null,
            emailTo: (nc.emailTo as string) || null,
            webhookEnabled: (nc.webhookEnabled as boolean) ?? false,
            webhookType: (nc.webhookType as string) || null,
            webhookUrl: (nc.webhookUrl as string) || null,
            webhookSecret: (nc.webhookSecret as string) || null,
            checkHour: (nc.checkHour as number) ?? 9,
          },
          create: {
            id: "default",
            emailEnabled: (nc.emailEnabled as boolean) ?? false,
            smtpHost: (nc.smtpHost as string) || null,
            smtpPort: (nc.smtpPort as number) ?? 465,
            smtpUser: (nc.smtpUser as string) || null,
            smtpPass: (nc.smtpPass as string) || null,
            emailFrom: (nc.emailFrom as string) || null,
            emailTo: (nc.emailTo as string) || null,
            webhookEnabled: (nc.webhookEnabled as boolean) ?? false,
            webhookType: (nc.webhookType as string) || null,
            webhookUrl: (nc.webhookUrl as string) || null,
            webhookSecret: (nc.webhookSecret as string) || null,
            checkHour: (nc.checkHour as number) ?? 9,
          },
        });
      }

      // 4. Upsert budgetConfig if present
      if (budgetConfig && typeof budgetConfig === "object") {
        const bc = budgetConfig as Record<string, unknown>;
        await tx.budgetConfig.upsert({
          where: { id: "default" },
          update: {
            monthlyBudget: typeof bc.monthlyBudget === "number" ? bc.monthlyBudget : 0,
            yearlyBudget: typeof bc.yearlyBudget === "number" ? bc.yearlyBudget : 0,
            currency: (bc.currency as string) || "USD",
          },
          create: {
            id: "default",
            monthlyBudget: typeof bc.monthlyBudget === "number" ? bc.monthlyBudget : 0,
            yearlyBudget: typeof bc.yearlyBudget === "number" ? bc.yearlyBudget : 0,
            currency: (bc.currency as string) || "USD",
          },
        });
      }

      return { restored: subscriptions.length };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return NextResponse.json(
      { error: "Failed to restore backup" },
      { status: 500 }
    );
  }
}
