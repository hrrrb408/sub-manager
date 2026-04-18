"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  type Subscription,
  type Category,
  getNextRenewalDate,
  formatAmount,
} from "@/lib/types";

interface CalendarViewProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onRenew?: () => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  development: "bg-blue-500",
  ai: "bg-purple-500",
  design: "bg-pink-500",
  marketing: "bg-orange-500",
  productivity: "bg-yellow-500",
  infrastructure: "bg-green-500",
  other: "bg-gray-400",
};

const CATEGORY_TEXT_COLORS: Record<Category, string> = {
  development: "text-blue-700 dark:text-blue-300",
  ai: "text-purple-700 dark:text-purple-300",
  design: "text-pink-700 dark:text-pink-300",
  marketing: "text-orange-700 dark:text-orange-300",
  productivity: "text-yellow-700 dark:text-yellow-300",
  infrastructure: "text-green-700 dark:text-green-300",
  other: "text-gray-600 dark:text-gray-400",
};

const CATEGORY_BG_COLORS: Record<Category, string> = {
  development: "bg-blue-500/15 hover:bg-blue-500/25",
  ai: "bg-purple-500/15 hover:bg-purple-500/25",
  design: "bg-pink-500/15 hover:bg-pink-500/25",
  marketing: "bg-orange-500/15 hover:bg-orange-500/25",
  productivity: "bg-yellow-500/15 hover:bg-yellow-500/25",
  infrastructure: "bg-green-500/15 hover:bg-green-500/25",
  other: "bg-gray-500/15 hover:bg-gray-500/25",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function CalendarView({
  subscriptions,
  onEdit,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalMap = useMemo(() => {
    const map = new Map<string, Subscription[]>();

    for (const sub of subscriptions) {
      if (sub.status === "cancelled" || sub.status === "expired") continue;

      const nextRenewal = getNextRenewalDate(
        sub.startDate,
        sub.billingCycle,
        sub.endDate
      );
      if (!nextRenewal) continue;

      const key = format(nextRenewal, "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push(sub);
      map.set(key, existing);
    }

    return map;
  }, [subscriptions]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            续费日历
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="xs" onClick={handleToday}>
            今天
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handlePrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">
            {format(currentMonth, "yyyy年 M月")}
          </span>
          <Button variant="ghost" size="icon-xs" onClick={handleNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border/50 p-px">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-background px-1 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const renewals = renewalMap.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={dateKey}
              className={`min-h-[80px] bg-background p-1 ${
                !isCurrentMonth ? "opacity-30" : ""
              }`}
            >
              <div className="flex items-center justify-center">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {renewals.slice(0, 3).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onEdit(sub)}
                    className={`flex w-full items-center gap-1 rounded px-1 py-px text-left ${
                      CATEGORY_BG_COLORS[sub.category]
                    } transition-colors`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        CATEGORY_COLORS[sub.category]
                      }`}
                    />
                    <span
                      className={`truncate text-[10px] leading-tight ${
                        CATEGORY_TEXT_COLORS[sub.category]
                      }`}
                    >
                      {sub.name}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-[10px] opacity-70 ${
                        CATEGORY_TEXT_COLORS[sub.category]
                      }`}
                    >
                      {formatAmount(sub.amount, sub.currency)}
                    </span>
                  </button>
                ))}
                {renewals.length > 3 && (
                  <span className="block px-1 text-[10px] text-muted-foreground">
                    +{renewals.length - 3} 更多
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(Object.keys(CATEGORY_COLORS) as Category[]).map((cat) => (
          <div key={cat} className="flex items-center gap-1">
            <span
              className={`size-2 rounded-full ${CATEGORY_COLORS[cat]}`}
            />
            <span>
              {cat === "development"
                ? "开发"
                : cat === "ai"
                  ? "AI"
                  : cat === "design"
                    ? "设计"
                    : cat === "marketing"
                      ? "营销"
                      : cat === "productivity"
                        ? "效率"
                        : cat === "infrastructure"
                          ? "基础设施"
                          : "其他"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
