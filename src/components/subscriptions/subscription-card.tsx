"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RenewDialog } from "@/components/subscriptions/renew-dialog";
import { CredentialBadge, CredentialDropdownItem } from "@/components/subscriptions/credential-viewer";
import {
  Pencil,
  Trash2,
  MoreVertical,
  ExternalLink,
  Calendar,
  CreditCard,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  STATUS_MAP,
  BILLING_CYCLE_MAP,
  formatAmount,
  CATEGORIES,
  getNextRenewalDate,
  type Subscription,
} from "@/lib/types";
import { differenceInDays, format, startOfDay } from "date-fns";

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onRenew: (id: string) => void;
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onRenew,
}: SubscriptionCardProps) {
  const [renewing, setRenewing] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const statusInfo = STATUS_MAP[subscription.status];
  const categoryInfo = CATEGORIES.find((c) => c.value === subscription.category);

  // 自动推算续费日期（没有 endDate 时根据 startDate + billingCycle 计算）
  const nextRenewalDate = getNextRenewalDate(
    subscription.startDate,
    subscription.billingCycle,
    subscription.endDate
  );
  const daysUntilRenewal = nextRenewalDate
    ? differenceInDays(startOfDay(nextRenewalDate), startOfDay(new Date()))
    : null;

  const isUrgent =
    daysUntilRenewal !== null &&
    daysUntilRenewal >= 0 &&
    daysUntilRenewal <= subscription.remindDays &&
    subscription.status === "active";

  const isExpired =
    daysUntilRenewal !== null && daysUntilRenewal < 0;

  const showRenewButton = (isUrgent || isExpired) && subscription.status !== "cancelled";

  const handleRenewConfirm = async () => {
    setRenewing(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/renew`, {
        method: "POST",
      });
      if (res.ok) {
        onRenew(subscription.id);
        setRenewDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to renew:", error);
    } finally {
      setRenewing(false);
    }
  };

  return (
    <>
      <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-md hover:border-border">
        {/* Urgent indicator */}
        {isUrgent && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 to-red-500" />
        )}
        {isExpired && subscription.status === "active" && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-red-400 to-red-600" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: subscription.color || "hsl(var(--primary))",
              }}
            >
              {subscription.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {subscription.name}
                </h3>
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {subscription.platform}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {subscription.plan && <span>{subscription.plan}</span>}
                {categoryInfo && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {categoryInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent"
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenewDialogOpen(true)} disabled={renewing}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  已续费
                </DropdownMenuItem>
                {subscription.url && (
                  <DropdownMenuItem
                    onClick={() => window.open(subscription.url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    访问网站
                  </DropdownMenuItem>
                )}
                <CredentialDropdownItem
                  account={subscription.account}
                  encryptedPassword={subscription.encryptedPassword}
                />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(subscription.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Renew banner for urgent/expired */}
        {showRenewButton && (
          <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            isExpired
              ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"
              : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
          }`}>
            <span className={`text-xs font-medium ${
              isExpired
                ? "text-red-700 dark:text-red-400"
                : "text-amber-700 dark:text-amber-400"
            }`}>
              {isExpired ? "已到期，请续费" : `${daysUntilRenewal} 天后到期`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => onEdit(subscription)}
              >
                <Pencil className="h-3 w-3" />
                编辑
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setRenewDialogOpen(true)}
                disabled={renewing}
              >
                <RefreshCw className={`h-3 w-3 ${renewing ? "animate-spin" : ""}`} />
                {renewing ? "处理中" : "已续费"}
              </Button>
            </div>
          </div>
        )}

        {/* Bottom info row */}
        <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">
                {formatAmount(subscription.amount, subscription.currency)}
              </span>
              <span>/ {BILLING_CYCLE_MAP[subscription.billingCycle]}</span>
            </div>

            {subscription.startDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(subscription.startDate), "yyyy/MM/dd")}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {(subscription.endDate || nextRenewalDate) && (
              <Tooltip>
                <TooltipTrigger
                  className={`flex items-center gap-1.5 ${isUrgent ? "text-amber-600 dark:text-amber-400" : isExpired ? "text-red-600 dark:text-red-400" : ""}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {daysUntilRenewal !== null && daysUntilRenewal >= 0
                      ? `${daysUntilRenewal} 天后续费`
                      : "已过期"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  续费日: {format(nextRenewalDate || new Date(subscription.endDate!), "yyyy-MM-dd")}
                </TooltipContent>
              </Tooltip>
            )}

            <CredentialBadge
              account={subscription.account}
              encryptedPassword={subscription.encryptedPassword}
            />
          </div>
        </div>
      </div>

      <RenewDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        subscription={subscription}
        onConfirm={handleRenewConfirm}
        loading={renewing}
      />
    </>
  );
}
