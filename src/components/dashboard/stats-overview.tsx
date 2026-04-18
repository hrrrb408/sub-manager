"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { formatAmount } from "@/lib/types";

interface StatsData {
  totalSubscriptions: number;
  activeCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingRenewals: { id: string; name: string; amount: number; currency: string; endDate: string }[];
}

interface StatsOverviewProps {
  stats: StatsData | null;
  currency: string;
}

export function StatsOverview({ stats, currency }: StatsOverviewProps) {
  if (!stats) return null;

  const cards = [
    {
      title: "月度支出",
      value: formatAmount(stats.monthlyTotal, currency),
      icon: DollarSign,
      description: `${stats.activeCount} 个活跃订阅`,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "年度预算",
      value: formatAmount(stats.yearlyTotal, currency),
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
