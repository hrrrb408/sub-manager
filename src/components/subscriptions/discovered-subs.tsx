"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES, type Subscription } from "@/lib/types";
import { Check, X, Loader2, Sparkles } from "lucide-react";

interface DiscoveredItem {
  id: string;
  emailSubject: string;
  emailFrom: string | null;
  emailDate: string;
  serviceName: string;
  amount: number | null;
  currency: string | null;
  billingCycle: string | null;
  confidence: number;
}

interface DiscoveredSubsProps {
  onImport?: (sub: Subscription) => void;
}

export function DiscoveredSubs({ onImport }: DiscoveredSubsProps) {
  const [items, setItems] = useState<DiscoveredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<DiscoveredItem | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/email-scan/discovered?status=pending");
      if (res.ok) setItems(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImport = async (item: DiscoveredItem, overrides?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/email-scan/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoveredId: item.id, overrides }),
      });

      if (res.ok) {
        const sub = await res.json();
        toast.success(`已导入「${item.serviceName}」`);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setEditingItem(null);
        onImport?.(sub);
      } else {
        toast.error("导入失败");
      }
    } catch {
      toast.error("导入请求失败");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await fetch("/api/email-scan/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoveredId: id }),
      });
      if (res.ok) {
        toast.success("已忽略");
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      toast.error("操作失败");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">加载中...</div>;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium">发现 {items.length} 条待确认订阅</h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.serviceName}</p>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {Math.round(item.confidence * 100)}% 匹配
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {item.amount != null && (
                      <span>{item.currency || "USD"} {item.amount}</span>
                    )}
                    {item.billingCycle && (
                      <span>{item.billingCycle === "monthly" ? "月付" : item.billingCycle === "yearly" ? "年付" : "周付"}</span>
                    )}
                    <span>·</span>
                    <span className="truncate">{item.emailSubject}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setEditingItem(item)}
                    title="编辑并导入"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => handleDismiss(item.id)}
                    title="忽略"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <EditImportDialog
          item={editingItem}
          onImport={(overrides) => handleImport(editingItem, overrides)}
          onDismiss={() => handleDismiss(editingItem.id)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function EditImportDialog({
  item,
  onImport,
  onDismiss,
  onClose,
}: {
  item: DiscoveredItem;
  onImport: (overrides: Record<string, unknown>) => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [overrides, setOverrides] = useState({
    name: item.serviceName,
    platform: "",
    amount: item.amount || 0,
    currency: item.currency || "USD",
    billingCycle: item.billingCycle || "monthly",
    category: "other",
  });

  const handleImport = async () => {
    setLoading(true);
    onImport(overrides);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>确认导入订阅</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            邮件: {item.emailSubject}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">服务名称</Label>
              <Input
                value={overrides.name}
                onChange={(e) => setOverrides((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">平台</Label>
              <Input
                value={overrides.platform}
                onChange={(e) => setOverrides((p) => ({ ...p, platform: e.target.value }))}
                placeholder="e.g. OpenAI"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">金额</Label>
              <Input
                type="number"
                step="0.01"
                value={overrides.amount || ""}
                onChange={(e) => setOverrides((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">币种</Label>
              <Select
                value={overrides.currency}
                onValueChange={(v) => v && setOverrides((p) => ({ ...p, currency: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">计费周期</Label>
              <Select
                value={overrides.billingCycle}
                onValueChange={(v) => v && setOverrides((p) => ({ ...p, billingCycle: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月付</SelectItem>
                  <SelectItem value="yearly">年付</SelectItem>
                  <SelectItem value="weekly">周付</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">分类</Label>
              <Select
                value={overrides.category}
                onValueChange={(v) => v && setOverrides((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              忽略
            </Button>
            <Button size="sm" onClick={handleImport} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              导入
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
