"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  name: string;
  platform: string;
  amount: number;
  currency: string;
  billingCycle: string;
  status: string;
  [key: string]: string | number;
}

const CSV_HEADER_MAP: Record<string, string> = {
  名称: "name",
  name: "name",
  平台: "platform",
  platform: "platform",
  金额: "amount",
  amount: "amount",
  币种: "currency",
  currency: "currency",
  计费周期: "billingCycle",
  "billing cycle": "billingCycle",
  billingcycle: "billingCycle",
  状态: "status",
  status: "status",
  计划: "plan",
  plan: "plan",
  分类: "category",
  category: "category",
  开始日期: "startDate",
  "start date": "startDate",
  startdate: "startDate",
  结束日期: "endDate",
  "end date": "endDate",
  enddate: "endDate",
  支付方式: "paymentMethod",
  "payment method": "paymentMethod",
  paymentmethod: "paymentMethod",
  账号: "account",
  account: "account",
  描述: "description",
  description: "description",
  网址: "url",
  url: "url",
  提醒天数: "remindDays",
  reminddays: "remindDays",
};

function parseCSV(text: string): ParsedRow[] {
  // Remove BOM
  let clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const fieldKeys = headers.map((h) => {
    const lower = h.toLowerCase();
    return CSV_HEADER_MAP[lower] || CSV_HEADER_MAP[h] || lower;
  });

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string | number> = {};
    fieldKeys.forEach((key, idx) => {
      const val = values[idx] || "";
      row[key] = key === "amount" || key === "remindDays" ? parseFloat(val) || 0 : val;
    });
    rows.push(row as ParsedRow);
  }
  return rows;
}

function parseJSON(text: string): ParsedRow[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON must be an array");
  return data.map((item: Record<string, unknown>) => {
    const row: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(item)) {
      const mappedKey = CSV_HEADER_MAP[key.toLowerCase()] || CSV_HEADER_MAP[key] || key;
      row[mappedKey] =
        mappedKey === "amount" || mappedKey === "remindDays"
          ? parseFloat(String(value)) || 0
          : String(value ?? "");
    }
    return row as ParsedRow;
  });
}

const BILLING_CYCLE_MAP: Record<string, string> = {
  monthly: "月付",
  yearly: "年付",
  weekly: "周付",
  月付: "月付",
  年付: "年付",
  周付: "周付",
};

const STATUS_MAP: Record<string, string> = {
  active: "活跃",
  trialing: "试用中",
  cancelled: "已取消",
  expired: "已过期",
  活跃: "活跃",
  试用中: "试用中",
  已取消: "已取消",
  已过期: "已过期",
};

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState("csv");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setParsedData([]);
    setError(null);
    setFileName(null);
    setImportResult(null);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      reset();
      const isCSV =
        file.name.endsWith(".csv") ||
        file.type === "text/csv" ||
        activeTab === "csv";
      const isJSON =
        file.name.endsWith(".json") ||
        file.type === "application/json" ||
        activeTab === "json";

      if (!isCSV && !isJSON) {
        setError("不支持的文件格式，请上传 CSV 或 JSON 文件");
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = isCSV ? parseCSV(text) : parseJSON(text);
          if (rows.length === 0) {
            setError("文件中没有有效数据");
            return;
          }
          setParsedData(rows);
        } catch (err) {
          setError(`解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
        }
      };
      reader.readAsText(file);
    },
    [activeTab, reset]
  );

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
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  const handleImport = useCallback(async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/subscriptions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptions: parsedData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "导入失败");
      }

      const data = await res.json();
      setImportResult({
        success: data.success ?? data.count ?? parsedData.length,
        errors: data.errors ?? [],
      });
      toast.success(`成功导入 ${data.success ?? data.count ?? parsedData.length} 条订阅`);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "导入失败";
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }, [parsedData, onSuccess]);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  const previewRows = parsedData.slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            导入订阅数据
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value ?? "csv");
            reset();
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="csv" className="flex-1">
              CSV 文件
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              JSON 文件
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-4">
            <DropZone
              dropRef={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              fileName={fileName}
              accept=".csv,text/csv"
            />
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <DropZone
              dropRef={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              fileName={fileName}
              accept=".json,application/json"
            />
          </TabsContent>
        </Tabs>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={activeTab === "csv" ? ".csv,text/csv" : ".json,application/json"}
          onChange={handleInputChange}
        />

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <span>成功导入 {importResult.success} 条</span>
              {importResult.errors.length > 0 && (
                <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Preview table */}
        {parsedData.length > 0 && !importResult && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              共解析{" "}
              <span className="font-medium text-foreground">
                {parsedData.length}
              </span>{" "}
              条数据
            </div>
            <div className="overflow-auto max-h-[240px] rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      名称
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      平台
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      金额
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      币种
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      计费周期
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-2 truncate max-w-[120px]">
                        {row.name || "-"}
                      </td>
                      <td className="px-3 py-2 truncate max-w-[100px]">
                        {row.platform || "-"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.amount || "-"}
                      </td>
                      <td className="px-3 py-2">{row.currency || "-"}</td>
                      <td className="px-3 py-2">
                        {BILLING_CYCLE_MAP[row.billingCycle] || row.billingCycle || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {STATUS_MAP[row.status] || row.status || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 10 && (
              <div className="text-xs text-muted-foreground text-center">
                仅显示前 10 条，共 {parsedData.length} 条
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || importing || !!importResult}
            className="gap-1.5"
          >
            {importing ? (
              "导入中..."
            ) : (
              <>
                <Upload className="h-4 w-4" />
                确认导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- DropZone sub-component ---- */

interface DropZoneProps {
  dropRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClick: () => void;
  fileName: string | null;
  accept: string;
}

function DropZone({
  dropRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  fileName,
}: DropZoneProps) {
  return (
    <div
      ref={dropRef}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
    >
      <div className="rounded-full bg-muted p-3">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          {fileName || "拖拽文件到此处或点击选择"}
        </p>
        {fileName && (
          <p className="text-xs text-muted-foreground mt-1">点击重新选择文件</p>
        )}
      </div>
    </div>
  );
}
