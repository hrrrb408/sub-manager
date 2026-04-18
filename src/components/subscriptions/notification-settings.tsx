"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Webhook,
  Send,
  Check,
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface NotificationConfig {
  id: string;
  emailEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPass: string | null;
  emailFrom: string | null;
  emailTo: string | null;
  webhookEnabled: boolean;
  webhookType: string | null;
  webhookUrl: string | null;
  checkHour: number;
}

interface LogEntry {
  id: string;
  type: string;
  status: string;
  title: string;
  error: string | null;
  createdAt: string;
}

export function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchConfig = async () => {
    const res = await fetch("/api/notify-config");
    if (res.ok) setConfig(await res.json());
  };

  const fetchLogs = async () => {
    const res = await fetch("/api/notify-logs?limit=10");
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  if (!config) return null;

  const updateField = <K extends keyof NotificationConfig>(
    key: K,
    value: NotificationConfig[K]
  ) => {
    setConfig((prev) => prev && { ...prev, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notify-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success("通知设置已保存");
        fetchConfig();
        fetchLogs();
      } else {
        const data = await res.json();
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (type: "email" | "webhook") => {
    setTesting(type);
    try {
      const res = await fetch("/api/notify-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config }),
      });
      if (res.ok) {
        toast.success(`${type === "email" ? "邮件" : "Webhook"} 测试发送成功！`);
      } else {
        const data = await res.json();
        toast.error(data.error || "测试失败");
      }
    } catch {
      toast.error("测试发送失败");
    } finally {
      setTesting(null);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/notify-check", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.sent > 0) {
          toast.success(`已发送 ${data.sent} 条通知`);
        } else {
          toast.info("当前没有需要提醒的订阅");
        }
        fetchLogs();
      }
    } catch {
      toast.error("检查失败");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Email Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              邮件通知
            </CardTitle>
            <Switch
              checked={config.emailEnabled}
              onCheckedChange={(v) => updateField("emailEnabled", v)}
            />
          </div>
        </CardHeader>
        {config.emailEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">SMTP 服务器</Label>
                <Input
                  value={config.smtpHost || ""}
                  onChange={(e) => updateField("smtpHost", e.target.value)}
                  placeholder="smtp.qq.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">端口</Label>
                <Input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) =>
                    updateField("smtpPort", parseInt(e.target.value) || 465)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">SMTP 用户名</Label>
                <Input
                  value={config.smtpUser || ""}
                  onChange={(e) => updateField("smtpUser", e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">SMTP 密码/授权码</Label>
                <Input
                  type="password"
                  value={config.smtpPass || ""}
                  onChange={(e) => updateField("smtpPass", e.target.value)}
                  placeholder="应用专用密码"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">发件人</Label>
                <Input
                  value={config.emailFrom || ""}
                  onChange={(e) => updateField("emailFrom", e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">收件人</Label>
                <Input
                  value={config.emailTo || ""}
                  onChange={(e) => updateField("emailTo", e.target.value)}
                  placeholder="to@email.com (多个用逗号分隔)"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleTest("email")}
              disabled={testing === "email"}
            >
              <Send className="h-3.5 w-3.5" />
              {testing === "email" ? "发送中..." : "发送测试邮件"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Webhook Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook 通知
            </CardTitle>
            <Switch
              checked={config.webhookEnabled}
              onCheckedChange={(v) => updateField("webhookEnabled", v)}
            />
          </div>
        </CardHeader>
        {config.webhookEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">推送平台</Label>
              <Select
                value={config.webhookType || ""}
                onValueChange={(v) => updateField("webhookType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dingtalk">钉钉群机器人</SelectItem>
                  <SelectItem value="wecom">企业微信群机器人</SelectItem>
                  <SelectItem value="feishu">飞书群机器人</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Webhook URL</Label>
              <Input
                value={config.webhookUrl || ""}
                onChange={(e) => updateField("webhookUrl", e.target.value)}
                placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleTest("webhook")}
              disabled={testing === "webhook"}
            >
              <Send className="h-3.5 w-3.5" />
              {testing === "webhook" ? "发送中..." : "发送测试通知"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Schedule */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              定时检查
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">每天</span>
              <Input
                type="number"
                min={0}
                max={23}
                className="w-16 h-8 text-center"
                value={config.checkHour}
                onChange={(e) =>
                  updateField("checkHour", parseInt(e.target.value) || 9)
                }
              />
              <span className="text-sm text-muted-foreground">点检查</span>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p>
              系统会在每天指定时间自动检查即将到期的订阅并发送通知，无需额外配置。
            </p>
            <p>也可以点击下方按钮立即检查并发送通知。</p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </Button>
        <Button variant="outline" onClick={handleCheckNow} disabled={checking}>
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${checking ? "animate-spin" : ""}`}
          />
          {checking ? "检查中..." : "立即检查并发送"}
        </Button>
      </div>

      <Separator />

      {/* Notification Logs */}
      <div>
        <h3 className="text-sm font-medium mb-3">最近通知记录</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            暂无通知记录
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-sm rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      log.status === "success" ? "secondary" : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {log.status === "success" ? (
                      <Check className="h-3 w-3 mr-0.5" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                    )}
                    {log.status === "success" ? "成功" : "失败"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.type === "email" ? "邮件" : "Webhook"}
                  </span>
                  <span className="text-xs truncate max-w-[200px]">
                    {log.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
