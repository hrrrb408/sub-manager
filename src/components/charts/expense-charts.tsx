"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { formatAmount } from "@/lib/types";

const CATEGORY_COLORS = [
  "hsl(142, 76%, 36%)",   // emerald - development
  "hsl(221, 83%, 53%)",   // blue - ai
  "hsl(262, 83%, 58%)",   // violet - design
  "hsl(24, 95%, 53%)",    // orange - marketing
  "hsl(47, 96%, 53%)",    // yellow - productivity
  "hsl(173, 58%, 39%)",   // teal - infrastructure
  "hsl(215, 14%, 34%)",   // slate - other
];

const CATEGORY_LABELS: Record<string, string> = {
  development: "开发工具",
  ai: "AI 服务",
  design: "设计工具",
  marketing: "营销工具",
  productivity: "效率工具",
  infrastructure: "基础设施",
  other: "其他",
};

interface StatsData {
  byCategory: Record<string, number>;
  byPlatform: Record<string, number>;
  monthlyTrend: { month: string; amount: number }[];
  monthlyTotal: number;
}

interface ExpenseChartsProps {
  stats: StatsData | null;
  currency: string;
}

export function ExpenseCharts({ stats, currency }: ExpenseChartsProps) {
  if (!stats) return null;

  const categoryData = Object.entries(stats.byCategory).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value: Math.round(value * 100) / 100,
  }));

  const platformData = Object.entries(stats.byPlatform)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([key, value]) => ({
      name: key,
      amount: Math.round(value * 100) / 100,
    }));

  const trendData = stats.monthlyTrend.map((item) => ({
    ...item,
    label: item.month.split("-").slice(1).join("/"),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 支出趋势 */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">月度支出趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${currency === "CNY" ? "¥" : "$"}${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatAmount(Number(value), currency),
                    "月度支出",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 分类占比 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">分类支出占比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatAmount(Number(value), currency) + "/月",
                    "支出",
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 平台费用排行 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">平台费用排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${currency === "CNY" ? "¥" : "$"}${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatAmount(Number(value), currency) + "/月",
                    "支出",
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(221, 83%, 53%)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
