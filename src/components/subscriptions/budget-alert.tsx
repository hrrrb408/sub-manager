"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp, Settings2 } from "lucide-react";
import { getCurrencySymbol } from "@/lib/types";

interface BudgetConfig {
  id: string;
  monthlyBudget: number;
  yearlyBudget: number;
  currency: string;
}

interface BudgetAlertProps {
  monthlyTotal: number;
  yearlyTotal: number;
}

export function BudgetAlert({ monthlyTotal, yearlyTotal }: BudgetAlertProps) {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("0");
  const [yearlyBudget, setYearlyBudget] = useState("0");
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMonthlyBudget(String(data.monthlyBudget));
        setYearlyBudget(String(data.yearlyBudget));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    const monthly = parseFloat(monthlyBudget) || 0;
    const yearly = parseFloat(yearlyBudget) || 0;

    if (monthly < 0 || yearly < 0) {
      toast.error("预算不能为负数");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBudget: monthly,
          yearlyBudget: yearly,
          currency: config?.currency || "USD",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setEditing(false);
        toast.success("预算设置已保存");
      } else {
        toast.error("保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // Still loading
  if (!config) return null;

  // No budget set — don't show anything unless editing
  if (config.monthlyBudget <= 0 && config.yearlyBudget <= 0 && !editing) {
    return (
      <Card className="border-dashed border-muted-foreground/25">
        <CardContent className="py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            尚未设置预算目标
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            设置预算
          </Button>
        </CardContent>
      </Card>
    );
  }

  const symbol = getCurrencySymbol(config.currency);
  const monthlyPercent = config.monthlyBudget > 0 ? (monthlyTotal / config.monthlyBudget) * 100 : 0;
  const yearlyPercent = config.yearlyBudget > 0 ? (yearlyTotal / config.yearlyBudget) * 100 : 0;

  const monthlyExceeded = config.monthlyBudget > 0 && monthlyTotal > config.monthlyBudget;
  const yearlyExceeded = config.yearlyBudget > 0 && yearlyTotal > config.yearlyBudget;
  const monthlyWarning = !monthlyExceeded && config.monthlyBudget > 0 && monthlyPercent >= 80;
  const yearlyWarning = !yearlyExceeded && config.yearlyBudget > 0 && yearlyPercent >= 80;

  const hasAlert = monthlyExceeded || yearlyExceeded || monthlyWarning || yearlyWarning;

  // Editing mode
  if (editing) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">预算设置</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">月度预算</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {symbol}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">年度预算</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {symbol}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={yearlyBudget}
                  onChange={(e) => setYearlyBudget(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setMonthlyBudget(String(config.monthlyBudget));
                setYearlyBudget(String(config.yearlyBudget));
              }}
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No alert and no editing — show compact status with edit button
  if (!hasAlert) {
    return (
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {config.monthlyBudget > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                月度 {symbol}{monthlyTotal.toFixed(2)} / {symbol}{config.monthlyBudget.toFixed(2)}
                <span className="text-xs">({monthlyPercent.toFixed(0)}%)</span>
              </span>
            )}
            {config.yearlyBudget > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                年度 {symbol}{yearlyTotal.toFixed(2)} / {symbol}{config.yearlyBudget.toFixed(2)}
                <span className="text-xs">({yearlyPercent.toFixed(0)}%)</span>
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            设置预算
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Alert mode
  return (
    <div className="space-y-2">
      {monthlyExceeded && (
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                月度支出已超出预算！已花费 {symbol}{monthlyTotal.toFixed(2)}，预算 {symbol}{config.monthlyBudget.toFixed(2)}（{monthlyPercent.toFixed(0)}%）
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-600 dark:text-red-400"
              onClick={() => setEditing(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              设置预算
            </Button>
          </CardContent>
        </Card>
      )}

      {yearlyExceeded && (
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                年度支出已超出预算！已花费 {symbol}{yearlyTotal.toFixed(2)}，预算 {symbol}{config.yearlyBudget.toFixed(2)}（{yearlyPercent.toFixed(0)}%）
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-600 dark:text-red-400"
              onClick={() => setEditing(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              设置预算
            </Button>
          </CardContent>
        </Card>
      )}

      {monthlyWarning && (
        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                月度支出接近预算上限！已花费 {symbol}{monthlyTotal.toFixed(2)}，预算 {symbol}{config.monthlyBudget.toFixed(2)}（{monthlyPercent.toFixed(0)}%）
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-yellow-600 dark:text-yellow-400"
              onClick={() => setEditing(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              设置预算
            </Button>
          </CardContent>
        </Card>
      )}

      {yearlyWarning && (
        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                年度支出接近预算上限！已花费 {symbol}{yearlyTotal.toFixed(2)}，预算 {symbol}{config.yearlyBudget.toFixed(2)}（{yearlyPercent.toFixed(0)}%）
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-yellow-600 dark:text-yellow-400"
              onClick={() => setEditing(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              设置预算
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
