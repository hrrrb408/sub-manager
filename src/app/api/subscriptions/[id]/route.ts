import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        name: body.name,
        platform: body.platform,
        plan: body.plan,
        amount: parseFloat(body.amount),
        currency: body.currency,
        billingCycle: body.billingCycle,
        status: body.status,
        category: body.category,
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
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
