"use client"

import { useEffect, useCallback } from "react"
import {
  Plus,
  Upload,
  Download,
  LayoutDashboard,
  BarChart3,
  Settings,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { formatAmount } from "@/lib/types"
import type { Subscription } from "@/lib/types"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptions: Subscription[]
  onEdit: (sub: Subscription) => void
  onRenew?: () => void
  onAddNew: () => void
  onImport: () => void
  onExport: () => void
  onNavigate: (tab: string) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  subscriptions,
  onEdit,
  onAddNew,
  onImport,
  onExport,
  onNavigate,
}: CommandPaletteProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    },
    [open, onOpenChange]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleAction = useCallback(
    (action: () => void) => {
      onOpenChange(false)
      action()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="命令面板"
      description="搜索订阅或执行快捷操作"
      className="sm:max-w-lg"
      showCloseButton={false}
    >
      <CommandInput placeholder="搜索订阅、操作..." />
      <CommandList>
        <CommandEmpty>没有找到匹配的结果</CommandEmpty>

        <CommandGroup heading="快捷操作">
          <CommandItem onSelect={() => handleAction(onAddNew)}>
            <Plus />
            <span>添加新订阅</span>
          </CommandItem>
          <CommandItem onSelect={() => handleAction(onImport)}>
            <Upload />
            <span>导入数据</span>
          </CommandItem>
          <CommandItem onSelect={() => handleAction(onExport)}>
            <Download />
            <span>导出 CSV</span>
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onNavigate("dashboard"))}>
            <LayoutDashboard />
            <span>切换到仪表盘</span>
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onNavigate("analytics"))}>
            <BarChart3 />
            <span>切换到数据分析</span>
          </CommandItem>
          <CommandItem onSelect={() => handleAction(() => onNavigate("settings"))}>
            <Settings />
            <span>切换到设置</span>
          </CommandItem>
        </CommandGroup>

        {subscriptions.length > 0 && (
          <CommandGroup heading="订阅列表">
            {subscriptions.map((sub) => (
              <CommandItem
                key={sub.id}
                value={`${sub.name} ${sub.platform}`}
                onSelect={() => handleAction(() => onEdit(sub))}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-medium text-white"
                    style={{
                      backgroundColor: sub.color || "#6366f1",
                    }}
                  >
                    {sub.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {sub.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sub.platform}
                      {sub.amount != null && (
                        <> &middot; {formatAmount(sub.amount, sub.currency)}</>
                      )}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
