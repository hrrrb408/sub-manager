"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { formatAmount, getCurrencySymbol } from "@/lib/types";

interface StatsData {
  totalSubscriptions: number;
  activeCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingRenewals: { id: string; name: string; amount: number; currency: string; endDate: string }[];
  currencyBreakdown?: Record<string, number>;
}

interface StatsOverviewProps {
  stats: StatsData | null;
  currency: string;
}

export function StatsOverview({ stats, currency }: StatsOverviewProps) {
  const [convertedMonthly, setConvertedMonthly] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Convert multi-currency totals
  const breakdown = stats?.currencyBreakdown || {};
  const hasMultiCurrency = Object.keys(breakdown).length > 1;

  useEffect(() => {
    if (!hasMultiCurrency || !stats?.currencyBreakdown) {
      setConvertedMonthly(null);
      return;
    }
    setLoading(true);
    fetch(`/api/exchange-rate?base=USD`)
      .then((r) => r.json())
      .then((data) => {
        const rates: Record<string, number> = data.rates || {};
        const targetSymbol = currency;
        let total = 0;
        for (const [cur, amount] of Object.entries(stats.currencyBreakdown!)) {
          const rate = rates[cur] || 1;
          const targetRate = rates[targetSymbol] || 1;
          total += (amount / rate) * targetRate;
        }
        setConvertedMonthly(Math.round(total * 100) / 100);
      })
      .catch(() => setConvertedMonthly(null))
      .finally(() => setLoading(false));
  }, [hasMultiCurrency, stats?.currencyBreakdown, currency]);

  if (!stats) return null;

  const displayMonthly = hasMultiCurrency && convertedMonthly !== null
    ? convertedMonthly
    : stats.monthlyTotal;

  const cards = [
    {
      title: "月度支出",
      value: formatAmount(displayMonthly, currency),
      icon: DollarSign,
      description: hasMultiCurrency ? `${Object.keys(breakdown).length} 种币种已换算` : `${stats.activeCount} 个活跃订阅`,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "年度预算",
      value: formatAmount(displayMonthly * 12, currency),
      icon: TrendingUp,
      description: "预计全年支出",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "订阅总数",
      value: stats.totalSubscriptions.toString(),
      icon: Package,
      description: `${stats.activeCount} 个活跃`,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      title: "即将续费",
      value: stats.upcomingRenewals.length.toString(),
      icon: CalendarClock,
      description: "7天内到期",
      color:
        stats.upcomingRenewals.length > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground",
      bg:
        stats.upcomingRenewals.length > 0
          ? "bg-amber-500/10"
          : "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1 tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
