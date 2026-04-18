import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (platform) where.platform = platform;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { platform: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    });

    // Auto-mark expired subscriptions (background, non-blocking)
    const now = new Date();
    const expiredIds = subscriptions
      .filter((s) => s.status === "active" && s.endDate && new Date(s.endDate) < now)
      .map((s) => s.id);

    if (expiredIds.length > 0) {
      // Fire and forget - don't await to avoid slowing response
      prisma.subscription
        .updateMany({
          where: { id: { in: expiredIds } },
          data: { status: "expired" },
        })
        .catch(console.error);

      // Update local data to reflect the change immediately
      for (const sub of subscriptions) {
        if (expiredIds.includes(sub.id)) {
          sub.status = "expired";
        }
      }
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = await prisma.subscription.create({
      data: {
        name: body.name,
        platform: body.platform,
        plan: body.plan,
        amount: parseFloat(body.amount),
        currency: body.currency || "USD",
        billingCycle: body.billingCycle || "monthly",
        status: body.status || "active",
        category: body.category || "other",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        paymentMethod: body.paymentMethod || null,
        account: body.account || null,
        encryptedPassword: body.encryptedPassword || null,
        description: body.description || null,
        url: body.url || null,
        logoUrl: body.logoUrl || null,
        color: body.color || null,
        remindDays: parseInt(body.remindDays) || 7,
      },
    });
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
