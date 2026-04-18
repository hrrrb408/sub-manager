"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { encrypt, getMasterKey } from "@/lib/crypto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PLATFORMS,
  CURRENCIES,
  CATEGORIES,
  type SubscriptionFormData,
  type Subscription,
} from "@/lib/types";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  onSuccess: () => void;
}

const defaultForm: SubscriptionFormData = {
  name: "",
  platform: "",
  plan: "",
  amount: 0,
  currency: "USD",
  billingCycle: "monthly",
  status: "active",
  category: "other",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  paymentMethod: "",
  account: "",
  password: "",
  description: "",
  url: "",
  remindDays: 7,
};

export function SubscriptionForm({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: SubscriptionFormProps) {
  const [form, setForm] = useState<SubscriptionFormData>(defaultForm);
  const [loading, setLoading] = useState(false);

  // Sync form when subscription prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (subscription) {
        setForm({
          name: subscription.name,
          platform: subscription.platform,
          plan: subscription.plan,
          amount: subscription.amount,
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          category: subscription.category,
          startDate: subscription.startDate?.split("T")[0] || "",
          endDate: subscription.endDate ? subscription.endDate.split("T")[0] : "",
          paymentMethod: subscription.paymentMethod || "",
          account: subscription.account || "",
          password: "",
          description: subscription.description || "",
          url: subscription.url || "",
          remindDays: subscription.remindDays,
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [open, subscription]);

  const isEdit = !!subscription;

  const validate = (): string | null => {
    if (!form.name.trim()) return "请输入服务名称";
    if (!form.platform) return "请选择平台";
    if (!form.amount || form.amount <= 0) return "金额必须大于 0";
    if (!form.startDate) return "请选择开始日期";
    if (form.endDate && new Date(form.endDate) < new Date(form.startDate))
      return "到期日期不能早于开始日期";
    if (form.url && !/^https?:\/\/.+/.test(form.url)) return "网址格式不正确，需以 http(s):// 开头";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) { toast.error(error); return; }
    setLoading(true);
    try {
      const encryptedPassword =
        form.password && form.password.trim()
          ? (() => {
              const key = getMasterKey();
              if (!key) { toast.error("请先在设置中配置主密钥"); setLoading(false); return null; }
              return encrypt(form.password, key);
            })()
          : isEdit ? undefined : null;
      if (encryptedPassword === null && form.password?.trim()) return;
      const payload = { ...form };
      delete (payload as Record<string, unknown>).password;
      if (encryptedPassword !== undefined) {
        (payload as Record<string, unknown>).encryptedPassword = encryptedPassword;
      }
      const url = isEdit ? `/api/subscriptions/${subscription.id}` : "/api/subscriptions";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { onSuccess(); onOpenChange(false); if (!isEdit) setForm(defaultForm); }
    } catch (error) { console.error("Failed to save subscription:", error); }
    finally { setLoading(false); }
  };

  const updateField = <K extends keyof SubscriptionFormData>(key: K, value: SubscriptionFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? "编辑订阅" : "添加新订阅"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Row 1: Name + Platform + Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">服务名称 *</Label>
              <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. ChatGPT Plus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">平台 *</Label>
              <Select value={form.platform} onValueChange={(v) => v && updateField("platform", v)}>
                <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">订阅计划</Label>
              <Input id="plan" value={form.plan} onChange={(e) => updateField("plan", e.target.value)} placeholder="Pro, Team..." />
            </div>
          </div>

          {/* Row 2: Category + Amount + Currency + Billing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select value={form.category} onValueChange={(v) => v && updateField("category", v as SubscriptionFormData["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">金额 *</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">币种</Label>
              <Select value={form.currency} onValueChange={(v) => v && updateField("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCycle">计费周期</Label>
              <Select value={form.billingCycle} onValueChange={(v) => v && updateField("billingCycle", v as SubscriptionFormData["billingCycle"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月付</SelectItem>
                  <SelectItem value="yearly">年付</SelectItem>
                  <SelectItem value="weekly">周付</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: StartDate + EndDate + Status + RemindDays */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期 *</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">到期日期</Label>
              <Input id="endDate" type="date" value={form.endDate || ""} onChange={(e) => updateField("endDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={form.status} onValueChange={(v) => v && updateField("status", v as SubscriptionFormData["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="trialing">试用中</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remindDays">提前提醒天数</Label>
              <Input id="remindDays" type="number" min="1" max="30" value={form.remindDays} onChange={(e) => updateField("remindDays", parseInt(e.target.value) || 7)} />
            </div>
          </div>

          {/* Row 4: URL + PaymentMethod */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">服务网址</Label>
              <Input id="url" type="url" value={form.url || ""} onChange={(e) => updateField("url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">支付方式</Label>
              <Input id="paymentMethod" value={form.paymentMethod || ""} onChange={(e) => updateField("paymentMethod", e.target.value)} placeholder="Visa ****1234, PayPal..." />
            </div>
          </div>

          {/* Row 5: Credentials */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              账号凭证（可选，密码将加密存储）
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account">登录账号</Label>
                <Input id="account" value={form.account || ""} onChange={(e) => updateField("account", e.target.value)} placeholder="邮箱 / 用户名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{isEdit ? "新密码（留空不变）" : "密码"}</Label>
                <Input id="password" type="password" value={form.password || ""} onChange={(e) => updateField("password", e.target.value)} placeholder={isEdit ? "留空则不修改" : "AES 加密存储"} />
              </div>
            </div>
          </div>

          {/* Row 6: Description */}
          <div className="space-y-2">
            <Label htmlFor="description">备注</Label>
            <Textarea id="description" value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="添加备注..." rows={3} />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={loading}>{loading ? "保存中..." : isEdit ? "更新" : "添加"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
