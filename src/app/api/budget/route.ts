import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const config = await prisma.budgetConfig.findUnique({
    where: { userId },
  });

  if (!config) {
    return NextResponse.json({
      id: "default",
      monthlyBudget: 0,
      yearlyBudget: 0,
      currency: "USD",
    });
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();

  const data = {
    monthlyBudget: body.monthlyBudget ?? 0,
    yearlyBudget: body.yearlyBudget ?? 0,
    currency: body.currency || "USD",
  };

  const config = await prisma.budgetConfig.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json(config);
}
