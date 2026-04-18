import { prisma } from "@/lib/prisma";
import { getNextRenewalDate, type BillingCycle } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");

    // 月度总支出
    const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
      if (s.billingCycle === "monthly") return sum + s.amount;
      if (s.billingCycle === "yearly") return sum + s.amount / 12;
      if (s.billingCycle === "weekly") return sum + s.amount * 4.33;
      return sum;
    }, 0);

    // 年度总支出
    const yearlyTotal = activeSubscriptions.reduce((sum, s) => {
      if (s.billingCycle === "yearly") return sum + s.amount;
      if (s.billingCycle === "monthly") return sum + s.amount * 12;
      if (s.billingCycle === "weekly") return sum + s.amount * 52;
      return sum;
    }, 0);

    // 按分类统计
    const byCategory: Record<string, number> = {};
    activeSubscriptions.forEach((s) => {
      const monthly =
        s.billingCycle === "monthly"
          ? s.amount
          : s.billingCycle === "yearly"
            ? s.amount / 12
            : s.amount * 4.33;
      byCategory[s.category] = (byCategory[s.category] || 0) + monthly;
    });

    // 按平台统计
    const byPlatform: Record<string, number> = {};
    activeSubscriptions.forEach((s) => {
      const monthly =
        s.billingCycle === "monthly"
          ? s.amount
          : s.billingCycle === "yearly"
            ? s.amount / 12
            : s.amount * 4.33;
      byPlatform[s.platform] = (byPlatform[s.platform] || 0) + monthly;
    });

    // 即将续费（根据每个订阅的 remindDays 设置，自动推算续费日期）
    const upcomingRenewals = subscriptions
      .map((s) => {
        if (s.status !== "active") return null;
        const nextDate = getNextRenewalDate(s.startDate, s.billingCycle as BillingCycle, s.endDate);
        if (!nextDate) return null;
        const daysUntil = Math.ceil(
          (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil < 0 || daysUntil > s.remindDays) return null;
        return { ...s, _nextRenewal: nextDate.toISOString(), _daysUntil: daysUntil };
      })
      .filter(Boolean)
      .sort((a, b) => a!._daysUntil - b!._daysUntil);

    // 状态分布
    const byStatus: Record<string, number> = {};
    subscriptions.forEach((s) => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });

    // 最近6个月支出趋势
    const monthlyTrend: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      // 按当月仍在活跃的订阅计算
      const monthTotal = activeSubscriptions.reduce((sum, s) => {
        const start = new Date(s.startDate);
        if (start > date) return sum;
        if (s.billingCycle === "monthly") return sum + s.amount;
        if (s.billingCycle === "yearly") return sum + s.amount / 12;
        return sum + s.amount * 4.33;
      }, 0);
      monthlyTrend.push({ month: monthLabel, amount: Math.round(monthTotal * 100) / 100 });
    }

    return NextResponse.json({
      totalSubscriptions: subscriptions.length,
      activeCount: activeSubscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      byCategory,
      byPlatform,
      upcomingRenewals,
      byStatus,
      monthlyTrend,
      currencyBreakdown: activeSubscriptions.reduce<Record<string, number>>((acc, s) => {
        const monthly = s.billingCycle === "monthly" ? s.amount : s.billingCycle === "yearly" ? s.amount / 12 : s.amount * 4.33;
        acc[s.currency] = (acc[s.currency] || 0) + monthly;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
