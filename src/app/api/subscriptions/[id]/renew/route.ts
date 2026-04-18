import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addMonths, addYears, addWeeks } from "date-fns";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ error: "订阅不存在" }, { status: 404 });
    }

    // 基于当前到期日（或今天）延长一个计费周期
    const baseDate = subscription.endDate ? new Date(subscription.endDate) : new Date();
    let newEndDate: Date;

    switch (subscription.billingCycle) {
      case "monthly":
        newEndDate = addMonths(baseDate, 1);
        break;
      case "yearly":
        newEndDate = addYears(baseDate, 1);
        break;
      case "weekly":
        newEndDate = addWeeks(baseDate, 1);
        break;
      default:
        newEndDate = addMonths(baseDate, 1);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: "active",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to renew subscription:", error);
    return NextResponse.json({ error: "续费失败" }, { status: 500 });
  }
}
