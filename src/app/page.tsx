"use client";

import "@/lib/register-sw";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Moon,
  Sun,
  BarChart3,
  LayoutDashboard,
  Bell,
  Download,
  Inbox,
  Settings,
  Upload,
  Calendar,
  Keyboard,
  MoreVertical,
  LogOut,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MasterKeySetup, MasterKeyBadge } from "@/components/subscriptions/master-key-dialog";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionTable } from "@/components/subscriptions/subscription-table";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { SubscriptionFilters } from "@/components/subscriptions/subscription-filters";
import { DeleteDialog } from "@/components/subscriptions/delete-dialog";
import { NotificationSettings } from "@/components/subscriptions/notification-settings";
import { ExpenseCharts } from "@/components/charts/expense-charts";
import { StatsSkeleton, CardGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { CalendarView } from "@/components/subscriptions/calendar-view";
import { ImportDialog } from "@/components/subscriptions/import-dialog";
import { BudgetAlert } from "@/components/subscriptions/budget-alert";
import { CommandPalette } from "@/components/subscriptions/command-palette";
import { AnnualReport } from "@/components/subscriptions/annual-report";
import { BackupRestore } from "@/components/subscriptions/backup-restore";
import { EmailScanSettings } from "@/components/subscriptions/email-scan-settings";
import { DiscoveredSubs } from "@/components/subscriptions/discovered-subs";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth-context";
import {
  formatAmount,
  BILLING_CYCLE_MAP,
  CATEGORIES,
  STATUS_MAP,
  type Subscription,
} from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Master key dialog
  const [masterKeyOpen, setMasterKeyOpen] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);

  // Command palette
  const [commandOpen, setCommandOpen] = useState(false);

  // Undo stack for soft delete
  const undoStack = useRef<Subscription[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "calendar">("grid");

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const fetchSubscriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      if (platformFilter && platformFilter !== "all") params.set("platform", platformFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/subscriptions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("加载订阅数据失败");
    }
  }, [statusFilter, categoryFilter, platformFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditingSub(null);
        setFormOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    // Optimistic: remove from UI immediately
    setSubscriptions((prev) => prev.filter((s) => s.id !== target.id));
    undoStack.current.push(target);

    try {
      const res = await fetch(`/api/subscriptions/${target.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchStats();
        toast.success(`已删除「${target.name}」`, {
          action: {
            label: "撤销",
            onClick: async () => {
              const { encryptedPassword, ...rest } = target;
              const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...rest,
                  encryptedPassword: encryptedPassword || undefined,
                }),
              });
              if (res.ok) {
                toast.success("已撤销删除");
                fetchSubscriptions();
                fetchStats();
              }
            },
          },
          duration: 5000,
        });
      } else {
        // Revert on failure
        setSubscriptions((prev) => [...prev, target]);
        toast.error("删除失败，请重试");
      }
    } catch {
      setSubscriptions((prev) => [...prev, target]);
      toast.error("删除失败，请检查网络");
    }
  };

  const handleFormSuccess = () => {
    setEditingSub(null);
    fetchSubscriptions();
    fetchStats();
  };

  const handleFormSubmitted = (newSub: Subscription, isEdit: boolean) => {
    if (isEdit) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === newSub.id ? newSub : s))
      );
      toast.success(`已更新「${newSub.name}」`);
    } else {
      setSubscriptions((prev) => [newSub, ...prev]);
      toast.success("订阅已添加");
    }
    fetchStats();
  };

  const handleRenew = (_id: string) => {
    fetchSubscriptions();
    fetchStats();
    toast.success("续费成功，到期日已更新");
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPlatformFilter("all");
  };

  const hasFilters =
    search ||
    (statusFilter && statusFilter !== "all") ||
    (categoryFilter && categoryFilter !== "all") ||
    (platformFilter && platformFilter !== "all");

  const upcomingRenewals =
    (stats?.upcomingRenewals as {
      id: string;
      name: string;
      amount: number;
      currency: string;
      endDate?: string;
      _nextRenewal: string;
      _daysUntil: number;
    }[]) || [];

  // Export functions
  const exportCSV = () => {
    const headers = [
      "名称",
      "平台",
      "计划",
      "金额",
      "币种",
      "计费周期",
      "状态",
      "分类",
      "开始日期",
      "到期日期",
      "支付方式",
      "备注",
      "网址",
    ];
    const rows = subscriptions.map((s) => [
      s.name,
      s.platform,
      s.plan,
      s.amount,
      s.currency,
      BILLING_CYCLE_MAP[s.billingCycle as keyof typeof BILLING_CYCLE_MAP],
      STATUS_MAP[s.status as keyof typeof STATUS_MAP]?.label || s.status,
      CATEGORIES.find((c) => c.value === s.category)?.label || s.category,
      s.startDate?.split("T")[0] || "",
      s.endDate?.split("T")[0] || "",
      s.paymentMethod || "",
      s.description || "",
      s.url || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    downloadFile(BOM + csv, "subscriptions.csv", "text/csv;charset=utf-8");
    toast.success(`已导出 ${subscriptions.length} 条订阅数据`);
  };

  const exportJSON = () => {
    const data = subscriptions.map((s) => ({
      名称: s.name,
      平台: s.platform,
      计划: s.plan,
      金额: s.amount,
      币种: s.currency,
      计费周期: BILLING_CYCLE_MAP[s.billingCycle as keyof typeof BILLING_CYCLE_MAP],
      状态: STATUS_MAP[s.status as keyof typeof STATUS_MAP]?.label || s.status,
      分类: CATEGORIES.find((c) => c.value === s.category)?.label || s.category,
      开始日期: s.startDate?.split("T")[0] || "",
      到期日期: s.endDate?.split("T")[0] || "",
      支付方式: s.paymentMethod || "",
      备注: s.description || "",
      网址: s.url || "",
    }));
    downloadFile(
      JSON.stringify(data, null, 2),
      "subscriptions.json",
      "application/json"
    );
    toast.success(`已导出 ${subscriptions.length} 条订阅数据`);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <h1 className="text-lg font-bold tracking-tight">SubManager</h1>
              {upcomingRenewals.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {upcomingRenewals.length}
                  </span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop: show all buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:inline-flex"
                onClick={() => setMasterKeyOpen(true)}
                title="主密钥设置"
              >
                <MasterKeyBadge />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 hidden sm:inline-flex"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              {subscriptions.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:inline-flex"
                    onClick={() => setImportOpen(true)}
                    title="导入数据"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:inline-flex"
                    onClick={exportCSV}
                    title="导出 CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Mobile: overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "light" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
                    {theme === "light" ? "深色模式" : "浅色模式"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMasterKeyOpen(true)}>
                    <MasterKeyBadge />
                    <span className="ml-2">主密钥设置</span>
                  </DropdownMenuItem>
                  {subscriptions.length > 0 && (
                    <>
                      <DropdownMenuItem onClick={() => setImportOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        导入数据
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        导出 CSV
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setCommandOpen(true)}>
                    <Keyboard className="h-4 w-4 mr-2" />
                    命令面板
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User avatar + logout (desktop) */}
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20">
                  {user?.name?.[0] || user?.email?.[0] || <User className="h-4 w-4" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">{user?.name || user?.email}</div>
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditingSub(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">添加订阅</span>
                <span className="sm:hidden">添加</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              仪表盘
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              数据分析
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-5 sm:space-y-6">
          <ErrorBoundary>
            {/* Stats Overview */}
            <StatsOverview
              stats={
                stats as {
                  totalSubscriptions: number;
                  activeCount: number;
                  monthlyTotal: number;
                  yearlyTotal: number;
                  upcomingRenewals: {
                    id: string;
                    name: string;
                    amount: number;
                    currency: string;
                    endDate: string;
                  }[];
                } | null
              }
              currency="USD"
            />

            {/* Budget Alert */}
            {!loading && stats && (
              <BudgetAlert
                monthlyTotal={(stats as Record<string, number>).monthlyTotal || 0}
                yearlyTotal={(stats as Record<string, number>).yearlyTotal || 0}
              />
            )}
            {upcomingRenewals.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-sm text-amber-800 dark:text-amber-300">
                    即将续费提醒
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {upcomingRenewals.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 text-xs bg-white dark:bg-amber-900/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300"
                    >
                      {r.name} -{" "}
                      {new Date(r._nextRenewal).toLocaleDateString("zh-CN")}
                      （{r._daysUntil}天后）
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Filters */}
            <SubscriptionFilters
              search={search}
              onSearchChange={handleSearchChange}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              platform={platformFilter}
              onPlatformChange={setPlatformFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              hasFilters={!!hasFilters}
              onClearFilters={clearFilters}
            />

            {/* Subscription list */}
            {loading ? (
              <>
                <StatsSkeleton />
                <Separator />
                <CardGridSkeleton />
              </>
            ) : subscriptions.length === 0 && hasFilters ? (
              /* Empty state for filtered results */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">没有匹配的结果</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  当前筛选条件下没有找到订阅，试试调整筛选条件
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  清除所有筛选
                </Button>
              </div>
            ) : subscriptions.length === 0 ? (
              /* Empty state for no subscriptions */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">还没有订阅</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  点击「添加订阅」开始管理你的订阅服务
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSub(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  添加第一个订阅
                </Button>
              </div>
            ) : viewMode === "calendar" ? (
              <CalendarView
                subscriptions={subscriptions}
                onEdit={handleEdit}
                onRenew={handleRenew}
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={handleEdit}
                    onDelete={(id) => {
                      const sub = subscriptions.find((s) => s.id === id);
                      if (sub) setDeleteTarget(sub);
                    }}
                    onRenew={handleRenew}
                  />
                ))}
              </div>
            ) : (
              <SubscriptionTable
                subscriptions={subscriptions}
                onEdit={handleEdit}
                onDelete={(id) => {
                  const sub = subscriptions.find((s) => s.id === id);
                  if (sub) setDeleteTarget(sub);
                }}
                onRenew={handleRenew}
                onBatchDelete={async (ids) => {
                  setSubscriptions((prev) => prev.filter((s) => !ids.includes(s.id)));
                  await Promise.all(ids.map((id) => fetch(`/api/subscriptions/${id}`, { method: "DELETE" })));
                  fetchStats();
                }}
              />
            )}
          </ErrorBoundary>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <ErrorBoundary>
            <ExpenseCharts
              stats={
                stats as {
                  byCategory: Record<string, number>;
                  byPlatform: Record<string, number>;
                  monthlyTrend: { month: string; amount: number }[];
                  monthlyTotal: number;
                } | null
              }
              currency="USD"
            />

            <Separator />

            <AnnualReport />
            </ErrorBoundary>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 max-w-2xl">
            <ErrorBoundary>
            <DiscoveredSubs onImport={() => fetchSubscriptions()} />
            <NotificationSettings />
            <Separator />
            <EmailScanSettings onScanComplete={() => fetchSubscriptions()} />
            <Separator />
            <BackupRestore />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <SubscriptionForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSub(null);
        }}
        subscription={editingSub}
        existingSubscriptions={subscriptions}
        onSuccess={handleFormSuccess}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        subscription={deleteTarget}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      <MasterKeySetup open={masterKeyOpen} onOpenChange={setMasterKeyOpen} />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          fetchSubscriptions();
          fetchStats();
        }}
      />

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        subscriptions={subscriptions}
        onEdit={handleEdit}
        onRenew={handleRenew}
        onAddNew={() => { setEditingSub(null); setFormOpen(true); }}
        onImport={() => setImportOpen(true)}
        onExport={exportCSV}
        onNavigate={setActiveTab}
      />
    </div>
  );
}
