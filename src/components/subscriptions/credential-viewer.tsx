"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Key, Eye, Copy, Check, Lock } from "lucide-react";
import { decrypt, getMasterKey, hasMasterKey } from "@/lib/crypto";
import { toast } from "sonner";

interface CredentialViewerProps {
  account?: string | null;
  encryptedPassword?: string | null;
  /** When rendered inside dropdown, use compact mode */
  mode?: "badge" | "dropdown" | "dialog";
  onTrigger?: () => void;
}

export function CredentialBadge({
  account,
  encryptedPassword,
}: {
  account?: string | null;
  encryptedPassword?: string | null;
}) {
  if (!account && !encryptedPassword) return null;

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center gap-1 text-xs text-muted-foreground max-w-[160px]">
        <Key className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{account || "有凭证"}</span>
      </TooltipTrigger>
      <TooltipContent>点击菜单查看完整凭证</TooltipContent>
    </Tooltip>
  );
}

export function CredentialDropdownItem({
  account,
  encryptedPassword,
}: CredentialViewerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!account && !encryptedPassword) return null;

  return (
    <>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          setDialogOpen(true);
        }}
      >
        <Key className="h-4 w-4 mr-2" />
        查看凭证
      </DropdownMenuItem>
      <CredentialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={account}
        encryptedPassword={encryptedPassword}
      />
    </>
  );
}

export function CredentialDialog({
  open,
  onOpenChange,
  account,
  encryptedPassword,
}: CredentialViewerProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleReveal = () => {
    if (revealed) {
      setRevealed(false);
      setPassword(null);
      return;
    }

    const key = getMasterKey();
    if (!key) {
      setError("请先在右上角设置主密钥");
      return;
    }

    if (!encryptedPassword) {
      setError("未存储密码");
      return;
    }

    try {
      const decrypted = decrypt(encryptedPassword, key);
      setPassword(decrypted);
      setRevealed(true);
      setError("");
    } catch {
      setError("解密失败，主密钥不正确");
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            账号凭证
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {account && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground mb-1">登录账号</div>
                <div className="text-sm font-mono font-medium truncate">{account}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(account, "account")}
              >
                {copiedField === "account" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {encryptedPassword && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground mb-1">密码</div>
                <div className="text-sm font-mono font-medium">
                  {revealed && password ? (
                    <span>{password}</span>
                  ) : (
                    <span className="text-muted-foreground">••••••••</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {revealed && password && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleReveal}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {!hasMasterKey() && encryptedPassword && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-400">
              请先点击右上角设置图标配置主密钥，才能查看加密密码
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
