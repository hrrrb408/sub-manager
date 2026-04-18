import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year)) {
      return NextResponse.json({ error: "Invalid year parameter" }, { status: 400 });
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const subscriptions = await prisma.subscription.findMany();

    // Filter subscriptions relevant to the given year
    const relevantSubscriptions = subscriptions.filter((s) => {
      const start = new Date(s.startDate);
      // Subscription is relevant if it started before the year ended
      // and (has no end date or end date is after the year started)
      return start < yearEnd && (!s.endDate || new Date(s.endDate) >= yearStart);
    });

    // Calculate total spent for the year
    let totalSpent = 0;
    const byCategory: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    const currencyBreakdown: Record<string, number> = {};
    const annualCosts: { id: string; name: string; amount: number; currency: string; annualCost: number }[] = [];

    relevantSubscriptions.forEach((s) => {
      const start = new Date(s.startDate);
      const end = s.endDate ? new Date(s.endDate) : yearEnd;

      // Calculate how many months this subscription was active in the given year
      const effectiveStart = start > yearStart ? start : yearStart;
      const effectiveEnd = end < yearEnd ? end : yearEnd;

      const monthsActive =
        (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 +
        (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1;

      const clampedMonths = Math.max(0, Math.min(monthsActive, 12));

      let monthlyEquivalent: number;
      if (s.billingCycle === "monthly") {
        monthlyEquivalent = s.amount;
      } else if (s.billingCycle === "yearly") {
        monthlyEquivalent = s.amount / 12;
      } else {
        // weekly
        monthlyEquivalent = s.amount * 4.33;
      }

      const annualCost = monthlyEquivalent * clampedMonths;
      totalSpent += annualCost;

      byCategory[s.category] = (byCategory[s.category] || 0) + annualCost;
      byPlatform[s.platform] = (byPlatform[s.platform] || 0) + annualCost;
      currencyBreakdown[s.currency] = (currencyBreakdown[s.currency] || 0) + annualCost;

      annualCosts.push({
        id: s.id,
        name: s.name,
        amount: s.amount,
        currency: s.currency,
        annualCost,
      });
    });

    // Subscriptions added in this year
    const subscriptionsAdded = subscriptions.filter((s) => {
      const created = new Date(s.createdAt);
      return created >= yearStart && created < yearEnd;
    }).length;

    // Subscriptions cancelled (status cancelled, with relevant activity in this year)
    const subscriptionsCancelled = relevantSubscriptions.filter(
      (s) => s.status === "cancelled"
    ).length;

    // Monthly breakdown
    const monthlyBreakdown: { month: string; total: number; count: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 1);
      const monthLabel = `${year}-${String(m + 1).padStart(2, "0")}`;

      let monthTotal = 0;
      let monthCount = 0;

      relevantSubscriptions.forEach((s) => {
        const start = new Date(s.startDate);
        const end = s.endDate ? new Date(s.endDate) : yearEnd;

        // Active during this month if started before month end and (no end or end >= month start)
        if (start < monthEnd && (!s.endDate || end >= monthStart)) {
          monthCount++;
          let monthlyAmount: number;
          if (s.billingCycle === "monthly") {
            monthlyAmount = s.amount;
          } else if (s.billingCycle === "yearly") {
            monthlyAmount = s.amount / 12;
          } else {
            monthlyAmount = s.amount * 4.33;
          }
          monthTotal += monthlyAmount;
        }
      });

      monthlyBreakdown.push({
        month: monthLabel,
        total: Math.round(monthTotal * 100) / 100,
        count: monthCount,
      });
    }

    // Top 5 expenses by annual cost
    const topExpenses = annualCosts
      .sort((a, b) => b.annualCost - a.annualCost)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        currency: item.currency,
        annualCost: Math.round(item.annualCost * 100) / 100,
      }));

    return NextResponse.json({
      year,
      totalSpent: Math.round(totalSpent * 100) / 100,
      subscriptionsAdded,
      subscriptionsCancelled,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
      byPlatform: Object.fromEntries(
        Object.entries(byPlatform).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
      monthlyBreakdown,
      topExpenses,
      currencyBreakdown: Object.fromEntries(
        Object.entries(currencyBreakdown).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
    });
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
