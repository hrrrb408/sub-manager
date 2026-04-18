"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Key, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  hasMasterKey,
  setMasterKey,
  getMasterKey,
  encrypt,
  decrypt,
} from "@/lib/crypto";

interface MasterKeySetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MasterKeySetup({ open, onOpenChange }: MasterKeySetupProps) {
  const isSetup = hasMasterKey();
  const [key, setKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = () => {
    if (!key.trim()) {
      toast.error("请输入主密钥");
      return;
    }
    if (key.length < 6) {
      toast.error("主密钥至少 6 个字符");
      return;
    }
    if (!isSetup && key !== confirmKey) {
      toast.error("两次输入的密钥不一致");
      return;
    }

    setMasterKey(key);
    toast.success("主密钥已保存");
    setKey("");
    setConfirmKey("");
    onOpenChange(false);
  };

  const handleVerify = () => {
    if (!key.trim()) {
      toast.error("请输入主密钥");
      return;
    }

    // Try to verify by encrypting and decrypting a test string
    try {
      const test = encrypt("test", key);
      decrypt(test, key);
      setMasterKey(key);
      toast.success("主密钥已更新");
      setKey("");
      onOpenChange(false);
    } catch {
      toast.error("验证失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            {isSetup ? "主密钥已配置" : "设置主密钥"}
          </DialogTitle>
          <DialogDescription>
            主密钥用于加密和解密存储的密码。请妥善保管，丢失后无法恢复已加密的密码。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-700 dark:text-blue-400">
            主密钥存储在浏览器本地，不会上传到服务器。请记住你的主密钥，清除浏览器数据后需重新输入。
          </div>

          <div className="space-y-2">
            <Label htmlFor="masterKey">
              {isSetup ? "更新主密钥" : "设置主密钥"}
            </Label>
            <Input
              id="masterKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="至少 6 个字符"
            />
          </div>

          {!isSetup && (
            <div className="space-y-2">
              <Label htmlFor="confirmKey">确认主密钥</Label>
              <Input
                id="confirmKey"
                type="password"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="再次输入"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={isSetup ? handleVerify : handleSetup}>
            <Key className="h-4 w-4 mr-1.5" />
            {isSetup ? "更新" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MasterKeyBadge() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Key className="h-4 w-4 text-muted-foreground" />;
  const configured = hasMasterKey();
  return configured ? (
    <ShieldCheck className="h-4 w-4 text-emerald-500" />
  ) : (
    <Key className="h-4 w-4 text-amber-500" />
  );
}
