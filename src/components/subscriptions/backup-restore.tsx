"use client";

import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Upload, Database, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface BackupData {
  subscriptions: unknown[];
  notificationConfig?: Record<string, unknown> | null;
  budgetConfig?: Record<string, unknown> | null;
  exportedAt?: string;
  version?: string;
}

export function BackupRestore() {
  const [backupFile, setBackupFile] = useState<BackupData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // --- Download backup ---
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "下载失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `submanager-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("备份文件已下载");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "下载失败";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, []);

  // --- File handling ---
  const handleFile = useCallback((file: File) => {
    setError(null);
    setBackupFile(null);
    setFileName(null);

    if (!file.name.endsWith(".json")) {
      setError("请选择 JSON 格式的备份文件");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
          setError("无效的备份文件：缺少 subscriptions 数组");
          return;
        }
        setBackupFile(data as BackupData);
      } catch {
        setError("文件解析失败，请确保是有效的 JSON 文件");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropRef.current?.classList.remove("border-primary", "bg-primary/5");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.add("border-primary", "bg-primary/5");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove("border-primary", "bg-primary/5");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  // --- Restore ---
  const handleRestoreClick = useCallback(() => {
    if (!backupFile) return;
    setConfirmOpen(true);
  }, [backupFile]);

  const handleRestoreConfirm = useCallback(async () => {
    if (!backupFile) return;
    setRestoring(true);
    setConfirmOpen(false);

    try {
      const res = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupFile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "恢复失败");
      }

      const data = await res.json();
      toast.success(`已恢复 ${data.restored} 条订阅数据`);
      setBackupFile(null);
      setFileName(null);
      // Reload to reflect restored data
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "恢复失败";
      toast.error(msg);
    } finally {
      setRestoring(false);
    }
  }, [backupFile]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据备份与恢复
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">数据备份</h3>
            <p className="text-xs text-muted-foreground">
              将所有订阅数据、通知配置和预算配置导出为 JSON 文件，用于备份或迁移。
            </p>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="gap-1.5"
            >
              {downloading ? (
                "下载中..."
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  下载备份文件
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Restore section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">数据恢复</h3>
            <p className="text-xs text-muted-foreground">
              从 JSON 备份文件中恢复数据。恢复操作将覆盖所有现有数据，请谨慎操作。
            </p>

            {/* Drop zone */}
            <div
              ref={dropRef}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-6 transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {fileName || "拖拽备份文件到此处或点击选择"}
                </p>
                {fileName && (
                  <p className="text-xs text-muted-foreground mt-1">点击重新选择文件</p>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".json,application/json"
              onChange={handleInputChange}
            />

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Backup file info */}
            {backupFile && !error && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p>
                    备份文件包含{" "}
                    <span className="font-medium">{backupFile.subscriptions.length}</span>{" "}
                    条订阅数据
                  </p>
                  {backupFile.exportedAt && (
                    <p className="text-xs opacity-80">
                      导出时间：{new Date(backupFile.exportedAt).toLocaleString("zh-CN")}
                    </p>
                  )}
                  {backupFile.version && (
                    <p className="text-xs opacity-80">
                      版本：{backupFile.version}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Restore button */}
            {backupFile && !error && (
              <Button
                onClick={handleRestoreClick}
                disabled={restoring}
                variant="destructive"
                className="gap-1.5"
              >
                {restoring ? (
                  "恢复中..."
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    恢复数据
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认恢复数据
            </DialogTitle>
            <DialogDescription>
              恢复将覆盖所有现有数据，确定继续？
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p>
              将恢复{" "}
              <span className="font-medium">{backupFile?.subscriptions.length}</span>{" "}
              条订阅数据
            </p>
            {backupFile?.exportedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                备份时间：{new Date(backupFile.exportedAt).toLocaleString("zh-CN")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreConfirm}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
