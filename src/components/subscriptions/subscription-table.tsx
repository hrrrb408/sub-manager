"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash,
  X,
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
import { toast } from "sonner";

const PAGE_SIZE = 20;

type SortKey = "name" | "platform" | "amount" | "status" | "renewal";
type SortDir = "asc" | "desc";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onRenew: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export function SubscriptionTable({
  subscriptions,
  onEdit,
  onDelete,
  onRenew,
  onBatchDelete,
}: SubscriptionTableProps) {
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewDialogSub, setRenewDialogSub] = useState<Subscription | null>(null);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const sorted = useMemo(() => {
    const arr = [...subscriptions];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "platform": return a.platform.localeCompare(b.platform) * dir;
        case "amount": return (a.amount - b.amount) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        case "renewal": {
          const aDate = getNextRenewalDate(a.startDate, a.billingCycle, a.endDate);
          const bDate = getNextRenewalDate(b.startDate, b.billingCycle, b.endDate);
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return (aDate.getTime() - bDate.getTime()) * dir;
        }
        default: return 0;
      }
    });
    return arr;
  }, [subscriptions, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const allSelected = paged.length > 0 && paged.every((s) => selected.has(s.id));
  const someSelected = paged.some((s) => selected.has(s.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (!onBatchDelete || selected.size === 0) return;
    const count = selected.size;
    onBatchDelete(Array.from(selected));
    setSelected(new Set());
    toast.success(`已删除 ${count} 条订阅`);
  };

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

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown
      className={`h-3 w-3 ml-1 inline ${sortKey === col ? "text-foreground" : "text-muted-foreground/40"}`}
    />
  );

  return (
    <>
      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <span className="text-sm text-muted-foreground">
            已选择 {selected.size} 项
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={handleBatchDelete}
          >
            <Trash className="h-3.5 w-3.5" />
            批量删除
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelected(new Set())}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            取消选择
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.dataset.state = someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked";
                  }}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>
                <button className="flex items-center" onClick={() => toggleSort("name")}>
                  服务 <SortIcon col="name" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center" onClick={() => toggleSort("platform")}>
                  平台 <SortIcon col="platform" />
                </button>
              </TableHead>
              <TableHead>计划</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>
                <button className="flex items-center" onClick={() => toggleSort("amount")}>
                  金额 <SortIcon col="amount" />
                </button>
              </TableHead>
              <TableHead>周期</TableHead>
              <TableHead>
                <button className="flex items-center" onClick={() => toggleSort("status")}>
                  状态 <SortIcon col="status" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center" onClick={() => toggleSort("renewal")}>
                  到期日 <SortIcon col="renewal" />
                </button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((sub) => {
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
                <TableRow key={sub.id} className={`group ${selected.has(sub.id) ? "bg-muted/30" : ""}`}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(sub.id)}
                      onCheckedChange={() => toggleOne(sub.id)}
                    />
                  </TableCell>
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
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  暂无订阅数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {subscriptions.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            共 {subscriptions.length} 条，第 {page + 1}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

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
