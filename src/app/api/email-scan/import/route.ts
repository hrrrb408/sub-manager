import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { discoveredId, overrides } = body;

  if (!discoveredId) {
    return NextResponse.json({ error: "缺少 discoveredId" }, { status: 400 });
  }

  const discovered = await prisma.discoveredSubscription.findFirst({
    where: { id: discoveredId, userId, status: "pending" },
  });

  if (!discovered) {
    return NextResponse.json({ error: "未找到该记录" }, { status: 404 });
  }

  // Create subscription from discovered data, with optional overrides
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      name: overrides?.name || discovered.serviceName,
      platform: overrides?.platform || "Other",
      plan: overrides?.plan || "",
      amount: overrides?.amount || discovered.amount || 0,
      currency: overrides?.currency || discovered.currency || "USD",
      billingCycle: overrides?.billingCycle || discovered.billingCycle || "monthly",
      status: "active",
      category: overrides?.category || "other",
      startDate: discovered.parsedDate || discovered.emailDate || new Date(),
      ...(overrides?.endDate && { endDate: new Date(overrides.endDate) }),
    },
  });

  // Mark as imported
  await prisma.discoveredSubscription.update({
    where: { id: discoveredId },
    data: {
      status: "imported",
      importedSubId: subscription.id,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
