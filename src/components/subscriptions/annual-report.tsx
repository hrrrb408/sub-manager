"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { formatAmount, CATEGORIES } from "@/lib/types";

interface ReportData {
  year: number;
  totalSpent: number;
  subscriptionsAdded: number;
  subscriptionsCancelled: number;
  byCategory: Record<string, number>;
  byPlatform: Record<string, number>;
  monthlyBreakdown: { month: string; total: number; count: number }[];
  topExpenses: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    annualCost: number;
  }[];
  currencyBreakdown: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const CATEGORY_COLORS: Record<string, string> = {
  development: "hsl(142, 76%, 36%)",
  ai: "hsl(221, 83%, 53%)",
  design: "hsl(262, 83%, 58%)",
  marketing: "hsl(24, 95%, 53%)",
  productivity: "hsl(47, 96%, 53%)",
  infrastructure: "hsl(173, 58%, 39%)",
  other: "hsl(215, 14%, 34%)",
};

const DEFAULT_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(24, 95%, 53%)",
  "hsl(47, 96%, 53%)",
  "hsl(173, 58%, 39%)",
  "hsl(215, 14%, 34%)",
];

function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 10; y--) {
    years.push(y);
  }
  return years;
}

export function AnnualReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const yearOptions = getYearOptions();

  // Determine the primary currency for display
  const primaryCurrency =
    report && Object.keys(report.currencyBreakdown).length > 0
      ? Object.entries(report.currencyBreakdown).sort(([, a], [, b]) => b - a)[0][0]
      : "USD";

  return (
    <div className="space-y-6">
      {/* Year Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">年度报告</h2>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => {
              if (value) setSelectedYear(parseInt(value, 10));
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} 年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            刷新
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-8 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      年度总支出
                    </p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">
                      {formatAmount(report.totalSpent, primaryCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.year} 年累计
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      新增订阅
                    </p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">
                      {report.subscriptionsAdded}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.year} 年新增
                    </p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      已取消
                    </p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">
                      {report.subscriptionsCancelled}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.year} 年取消
                    </p>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-xl">
                    <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend & Top Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly Trend Bar Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  月度趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart
                  data={report.monthlyBreakdown}
                  currency={primaryCurrency}
                />
              </CardContent>
            </Card>

            {/* Top 5 Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Top 5 支出
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      暂无数据
                    </p>
                  ) : (
                    report.topExpenses.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                            index === 0
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : index === 1
                                ? "bg-slate-400/15 text-slate-600 dark:text-slate-400"
                                : index === 2
                                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatAmount(item.annualCost, item.currency)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution & Currency Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution - Horizontal Stacked Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  分类占比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBar data={report.byCategory} />
              </CardContent>
            </Card>

            {/* Currency Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  币种分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrencyBreakdownList data={report.currencyBreakdown} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">加载报告失败，请重试</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Sub-components ---

function MonthlyBarChart({
  data,
  currency,
}: {
  data: { month: string; total: number; count: number }[];
  currency: string;
}) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-1.5 h-48">
      {data.map((item) => {
        const heightPercent = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
        const monthLabel = item.month.split("-")[1] + "月";

        return (
          <div
            key={item.month}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <span className="text-[10px] text-muted-foreground tabular-nums truncate w-full text-center">
              {currency === "CNY" || currency === "JPY"
                ? `¥${Math.round(item.total)}`
                : `$${Math.round(item.total)}`}
            </span>
            <div className="w-full relative" style={{ height: "140px" }}>
              <div
                className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300 transition-all duration-300"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {monthLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        暂无数据
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden">
        {entries.map(([category, amount]) => {
          const percent = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div
              key={category}
              className="h-full transition-all duration-300"
              style={{
                width: `${percent}%`,
                backgroundColor:
                  CATEGORY_COLORS[category] || "hsl(215, 14%, 34%)",
              }}
              title={`${CATEGORY_LABELS[category] || category}: ${percent.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {entries
          .sort(([, a], [, b]) => b - a)
          .map(([category, amount]) => {
            const percent = total > 0 ? (amount / total) * 100 : 0;
            return (
              <div key={category} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[category] || "hsl(215, 14%, 34%)",
                  }}
                />
                <span className="truncate flex-1">
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {percent.toFixed(1)}%
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function CurrencyBreakdownList({
  data,
}: {
  data: Record<string, number>;
}) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        暂无数据
      </p>
    );
  }

  // Only one currency - simple display
  if (entries.length === 1) {
    const [currency, amount] = entries[0];
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-sm text-muted-foreground mb-1">全部以 {currency} 计价</p>
        <p className="text-2xl font-bold">{formatAmount(amount, currency)}</p>
      </div>
    );
  }

  // Multiple currencies
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-3">
      {entries
        .sort(([, a], [, b]) => b - a)
        .map(([currency, amount], index) => {
          const percent = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={currency} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{currency}</span>
                <span className="tabular-nums">{formatAmount(amount, currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {percent.toFixed(1)}%
              </p>
            </div>
          );
        })}
    </div>
  );
}
