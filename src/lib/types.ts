export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trialing";
export type BillingCycle = "monthly" | "yearly" | "weekly";
export type Category =
  | "development"
  | "design"
  | "marketing"
  | "productivity"
  | "ai"
  | "infrastructure"
  | "other";

export interface Subscription {
  id: string;
  name: string;
  platform: string;
  plan: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  category: Category;
  startDate: string;
  endDate?: string;
  paymentMethod?: string;
  account?: string;
  encryptedPassword?: string;
  description?: string;
  url?: string;
  logoUrl?: string;
  color?: string;
  remindDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFormData {
  name: string;
  platform: string;
  plan: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  category: Category;
  startDate: string;
  endDate?: string;
  paymentMethod?: string;
  account?: string;
  password?: string;
  description?: string;
  url?: string;
  logoUrl?: string;
  color?: string;
  remindDays: number;
}

export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "JPY", label: "JPY (¥)" },
] as const;

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "development", label: "开发工具", icon: "Code" },
  { value: "ai", label: "AI 服务", icon: "Brain" },
  { value: "design", label: "设计工具", icon: "Palette" },
  { value: "marketing", label: "营销工具", icon: "Megaphone" },
  { value: "productivity", label: "效率工具", icon: "Zap" },
  { value: "infrastructure", label: "基础设施", icon: "Server" },
  { value: "other", label: "其他", icon: "MoreHorizontal" },
];

export const STATUS_MAP: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: "活跃", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  trialing: { label: "试用中", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  cancelled: { label: "已取消", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  expired: { label: "已过期", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export const BILLING_CYCLE_MAP: Record<BillingCycle, string> = {
  monthly: "月付",
  yearly: "年付",
  weekly: "周付",
};

export const PLATFORMS = [
  "Stripe",
  "LangSmith",
  "Supabase",
  "Vercel",
  "OpenAI",
  "Anthropic",
  "GitHub",
  "Figma",
  "Notion",
  "Slack",
  "AWS",
  "Google Cloud",
  "Azure",
  "Cloudflare",
  "Linear",
  "Postman",
  "JetBrains",
  "Other",
] as const;

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
    JPY: "¥",
  };
  return symbols[currency] || currency;
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 根据开始日期和计费周期，推算下一次续费日期。
 * 如果已有 endDate 且在未来，直接返回；
 * 否则从 startDate 开始按周期往后推，找到最近的一个未来日期。
 */
export function getNextRenewalDate(
  startDate: string | Date,
  billingCycle: BillingCycle,
  endDate?: string | Date | null
): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 如果有 endDate 且在未来，直接用
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (end >= now) return end;
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime())) return null;

  const addCycle = (d: Date): Date => {
    const next = new Date(d);
    if (billingCycle === "monthly") {
      next.setMonth(next.getMonth() + 1);
    } else if (billingCycle === "yearly") {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    return next;
  };

  // 从 startDate 开始按周期推，直到找到一个 >= now 的日期
  let next = new Date(start);
  next.setHours(0, 0, 0, 0);
  // 安全阈值：最多推 120 次（10 年），防止无限循环
  let iterations = 0;
  while (next < now && iterations < 120) {
    next = addCycle(next);
    next.setHours(0, 0, 0, 0);
    iterations++;
  }

  return next;
}
