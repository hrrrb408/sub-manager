"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PROVIDER_OPTIONS } from "@/lib/email-providers";
import { Mail, Trash2, RefreshCw, Plus, Loader2 } from "lucide-react";

interface EmailConnection {
  id: string;
  provider: string;
  email: string;
  scanEnabled: boolean;
  lastScanAt: string | null;
}

interface EmailScanSettingsProps {
  onScanComplete?: () => void;
}

export function EmailScanSettings({ onScanComplete }: EmailScanSettingsProps) {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/email-connection");
      if (res.ok) {
        setConnections(await res.json());
      } else {
        const err = await res.text();
        console.error("[email-connection] GET failed:", res.status, err);
      }
    } catch (e) {
      console.error("[email-connection] fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/email-scan", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`扫描完成：检查 ${data.scanned} 封邮件，发现 ${data.found} 条订阅`);
        fetchConnections();
        onScanComplete?.();
      } else {
        toast.error("扫描失败，请检查邮箱配置");
      }
    } catch {
      toast.error("扫描请求失败");
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/email-connection/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("已删除邮箱连接");
        fetchConnections();
      }
    } catch {
      toast.error("删除失败");
    }
  };

  const handleToggleScan = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/email-connection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanEnabled: enabled }),
      });
      fetchConnections();
    } catch {
      toast.error("更新失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">邮箱扫描</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            连接邮箱，自动扫描并识别订阅扣费邮件
          </p>
        </div>
        <div className="flex gap-2">
          {connections.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleScan} disabled={scanning}>
              {scanning ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              {scanning ? "扫描中..." : "立即扫描"}
            </Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            添加邮箱
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">加载中...</div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无邮箱连接</p>
            <p className="text-xs text-muted-foreground mt-1">添加邮箱后可自动扫描订阅扣费邮件</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{conn.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {conn.provider.toUpperCase()}
                      {conn.lastScanAt && ` · 上次扫描: ${new Date(conn.lastScanAt).toLocaleString("zh-CN")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={conn.scanEnabled}
                      onCheckedChange={(v) => handleToggleScan(conn.id, v)}
                    />
                    <span className="text-xs text-muted-foreground">自动扫描</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(conn.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddEmailDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={fetchConnections} />
    </div>
  );
}

function AddEmailDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !email || !password) {
      toast.error("请填写所有字段");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/email-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("邮箱连接已添加");
        onOpenChange(false);
        setProvider("");
        setEmail("");
        setPassword("");
        onSuccess();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch {
      toast.error("请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加邮箱连接</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>邮箱提供商</Label>
            <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择邮箱提供商" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>邮箱地址</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label>授权码 / 密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="QQ/163 需使用授权码"
            />
            <p className="text-xs text-muted-foreground">
              QQ 邮箱和 163 邮箱需要在邮箱设置中开启 IMAP 并获取授权码（非登录密码）
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "添加中..." : "添加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
