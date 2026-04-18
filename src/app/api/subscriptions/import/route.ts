import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

const BILLING_CYCLE_MAP: Record<string, string> = {
  月付: "monthly",
  年付: "yearly",
  周付: "weekly",
  monthly: "monthly",
  yearly: "yearly",
  weekly: "weekly",
};

const STATUS_MAP: Record<string, string> = {
  活跃: "active",
  试用中: "trialing",
  已取消: "cancelled",
  已过期: "expired",
  active: "active",
  trialing: "trialing",
  cancelled: "cancelled",
  expired: "expired",
};

const CATEGORY_MAP: Record<string, string> = {
  开发工具: "development",
  "AI 服务": "ai",
  设计工具: "design",
  营销工具: "marketing",
  效率工具: "productivity",
  基础设施: "infrastructure",
  其他: "other",
  development: "development",
  ai: "ai",
  design: "design",
  marketing: "marketing",
  productivity: "productivity",
  infrastructure: "infrastructure",
  other: "other",
};

function mapValue(
  raw: unknown,
  map: Record<string, string>,
  fallback: string
): string {
  if (raw == null) return fallback;
  const key = String(raw).trim();
  return map[key] ?? fallback;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an array of subscription objects" },
        { status: 400 }
      );
    }

    const errors: { row: number; message: string }[] = [];
    const validRows: Record<string, unknown>[] = [];

    for (let i = 0; i < body.length; i++) {
      const row = body[i];

      // Validate required fields
      if (!row.name) {
        errors.push({ row: i + 1, message: "Missing required field: name" });
        continue;
      }
      if (!row.platform) {
        errors.push({
          row: i + 1,
          message: "Missing required field: platform",
        });
        continue;
      }
      if (row.amount == null || isNaN(Number(row.amount))) {
        errors.push({ row: i + 1, message: "Missing or invalid field: amount" });
        continue;
      }
      if (!row.startDate) {
        errors.push({
          row: i + 1,
          message: "Missing required field: startDate",
        });
        continue;
      }

      const startDate = new Date(row.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push({
          row: i + 1,
          message: "Invalid startDate format",
        });
        continue;
      }

      const endDate = row.endDate ? new Date(row.endDate) : null;
      if (row.endDate && endDate && isNaN(endDate.getTime())) {
        errors.push({
          row: i + 1,
          message: "Invalid endDate format",
        });
        continue;
      }

      validRows.push({
        userId,
        name: String(row.name).trim(),
        platform: String(row.platform).trim(),
        plan: row.plan ? String(row.plan).trim() : "",
        amount: parseFloat(row.amount),
        currency: row.currency ? String(row.currency).trim() : "USD",
        billingCycle: mapValue(row.billingCycle, BILLING_CYCLE_MAP, "monthly"),
        status: mapValue(row.status, STATUS_MAP, "active"),
        category: mapValue(row.category, CATEGORY_MAP, "other"),
        startDate,
        endDate,
        paymentMethod: row.paymentMethod ? String(row.paymentMethod).trim() : null,
        account: row.account ? String(row.account).trim() : null,
        encryptedPassword: row.encryptedPassword
          ? String(row.encryptedPassword).trim()
          : null,
        description: row.description ? String(row.description).trim() : null,
        url: row.url ? String(row.url).trim() : null,
        remindDays: row.remindDays != null ? parseInt(row.remindDays, 10) || 7 : 7,
      });
    }

    let imported = 0;

    if (validRows.length > 0) {
      const result = await prisma.subscription.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: validRows as any,
      });
      imported = result.count;
    }

    return NextResponse.json({ imported, errors }, { status: 201 });
  } catch (error) {
    console.error("Failed to import subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to import subscriptions" },
      { status: 500 }
    );
  }
}
