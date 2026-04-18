"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List, Calendar, X } from "lucide-react";
import { PLATFORMS, CATEGORIES, STATUS_MAP } from "@/lib/types";

interface SubscriptionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
  viewMode: "grid" | "table" | "calendar";
  onViewModeChange: (mode: "grid" | "table" | "calendar") => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function SubscriptionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  platform,
  onPlatformChange,
  viewMode,
  onViewModeChange,
  hasFilters,
  onClearFilters,
}: SubscriptionFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索订阅..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">清除</span>
            </Button>
          )}

          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => onViewModeChange("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => onViewModeChange("calendar")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={status} onValueChange={(v) => v && onStatusChange(v)}>
          <SelectTrigger className="w-[110px] sm:w-[120px] h-8 text-xs">
            <SelectValue placeholder="全部状态">{!status || status === "all" ? "全部状态" : STATUS_MAP[status as keyof typeof STATUS_MAP]?.label ?? status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="trialing">试用中</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => v && onCategoryChange(v)}>
          <SelectTrigger className="w-[110px] sm:w-[120px] h-8 text-xs">
            <SelectValue placeholder="全部分类">{!category || category === "all" ? "全部分类" : CATEGORIES.find(c => c.value === category)?.label ?? category}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platform} onValueChange={(v) => v && onPlatformChange(v)}>
          <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
            <SelectValue placeholder="全部平台">{!platform || platform === "all" ? "全部平台" : platform}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
