"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenewDialog } from "@/components/subscriptions/renew-dialog";
import { CredentialDropdownItem } from "@/components/subscriptions/credential-viewer";
import {
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
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

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onRenew: (id: string) => void;
}

export function SubscriptionTable({
  subscriptions,
  onEdit,
  onDelete,
  onRenew,
}: SubscriptionTableProps) {
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewDialogSub, setRenewDialogSub] = useState<Subscription | null>(null);

  const handleRenewConfirm = async () => {
    if (!renewDialogSub) return;
    setRenewingId(renewDialogSub.id);
    try {
      const res = await fetch(`/api/subscriptions/${renewDialogSub.id}/renew`, {
        method: "POST",
      });
      if (res.ok) {
        onRenew(renewDialogSub.id);
        setRenewDialogSub(null);
      }
    } catch (error) {
      console.error("Failed to renew:", error);
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>服务</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>计划</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>周期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>到期日</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => {
              const statusInfo = STATUS_MAP[sub.status];
              const categoryInfo = CATEGORIES.find((c) => c.value === sub.category);
              const nextRenewal = getNextRenewalDate(sub.startDate, sub.billingCycle, sub.endDate);
              const daysLeft = nextRenewal
                ? differenceInDays(startOfDay(nextRenewal), startOfDay(new Date()))
                : null;
              const isUrgent =
                daysLeft !== null &&
                daysLeft >= 0 &&
                daysLeft <= sub.remindDays &&
                sub.status === "active";
              const isExpired =
                daysLeft !== null && daysLeft < 0 && sub.status === "active";

              return (
                <TableRow key={sub.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{
                          background: sub.color || "hsl(var(--primary))",
                        }}
                      >
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{sub.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.platform}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.plan}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {categoryInfo?.label || sub.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatAmount(sub.amount, sub.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {BILLING_CYCLE_MAP[sub.billingCycle]}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={isUrgent ? "text-amber-600 dark:text-amber-400 font-medium" : isExpired ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                        {nextRenewal
                          ? format(nextRenewal, "yyyy-MM-dd")
                          : "-"}
                        {isUrgent && daysLeft !== null && (
                          <span className="text-xs ml-1">({daysLeft}天)</span>
                        )}
                        {isExpired && (
                          <span className="text-xs ml-1">(已过期)</span>
                        )}
                      </span>
                      {(isUrgent || isExpired) && sub.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] gap-1 ml-1"
                          onClick={() => setRenewDialogSub(sub)}
                          disabled={renewingId === sub.id}
                        >
                          <RefreshCw className={`h-3 w-3 ${renewingId === sub.id ? "animate-spin" : ""}`} />
                          {renewingId === sub.id ? "处理中" : "已续费"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(sub)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRenewDialogSub(sub)} disabled={renewingId === sub.id}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {renewingId === sub.id ? "续费中..." : "已续费"}
                        </DropdownMenuItem>
                        {sub.url && (
                          <DropdownMenuItem
                            onClick={() => window.open(sub.url!, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            访问网站
                          </DropdownMenuItem>
                        )}
                        <CredentialDropdownItem
                          account={sub.account}
                          encryptedPassword={sub.encryptedPassword}
                        />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(sub.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  暂无订阅数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RenewDialog
        open={!!renewDialogSub}
        onOpenChange={(open) => { if (!open) setRenewDialogSub(null); }}
        subscription={renewDialogSub}
        onConfirm={handleRenewConfirm}
        loading={!!renewingId}
      />
    </>
  );
}
