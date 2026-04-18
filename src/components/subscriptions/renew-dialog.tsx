"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard } from "lucide-react";
import { BILLING_CYCLE_MAP, formatAmount, type Subscription } from "@/lib/types";
import { addMonths, addYears, addWeeks, format } from "date-fns";

interface RenewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onConfirm: () => void;
  loading: boolean;
}

export function RenewDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
  loading,
}: RenewDialogProps) {
  if (!subscription) return null;

  const baseDate = subscription.endDate ? new Date(subscription.endDate) : new Date();
  let newEndDate: Date;
  switch (subscription.billingCycle) {
    case "yearly":
      newEndDate = addYears(baseDate, 1);
      break;
    case "weekly":
      newEndDate = addWeeks(baseDate, 1);
      break;
    default:
      newEndDate = addMonths(baseDate, 1);
  }

  const daysLeft = subscription.endDate
    ? Math.ceil(
        (new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: subscription.color || "hsl(var(--primary))" }}
            >
              {subscription.name.charAt(0).toUpperCase()}
            </div>
            确认续费
          </DialogTitle>
          <DialogDescription>
            确认已为该订阅完成续费，系统将自动更新到期日
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Subscription info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">服务</span>
              <span className="text-sm font-medium">{subscription.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">计划</span>
              <span className="text-sm">{subscription.plan || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 inline mr-1" />
                费用
              </span>
              <span className="text-sm font-semibold">
                {formatAmount(subscription.amount, subscription.currency)}
                <span className="text-muted-foreground font-normal">
                  {" "}/ {BILLING_CYCLE_MAP[subscription.billingCycle]}
                </span>
              </span>
            </div>
          </div>

          {/* Date change */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-3 text-center">
              <div className="text-xs text-red-600 dark:text-red-400 mb-1">当前到期日</div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">
                {subscription.endDate
                  ? format(new Date(subscription.endDate), "yyyy-MM-dd")
                  : "-"}
              </div>
              {isExpired && (
                <div className="text-xs text-red-500 mt-1">已过期</div>
              )}
              {!isExpired && daysLeft !== null && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  还剩 {daysLeft} 天
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="flex-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                续费后到期日
              </div>
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {format(newEndDate, "yyyy-MM-dd")}
              </div>
              <div className="text-xs text-emerald-500 mt-1">
                +{BILLING_CYCLE_MAP[subscription.billingCycle]}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "处理中..." : "确认续费"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
