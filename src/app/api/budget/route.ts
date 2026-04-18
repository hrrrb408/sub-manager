import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.budgetConfig.findUnique({
    where: { id: "default" },
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
  const body = await request.json();

  const data = {
    monthlyBudget: body.monthlyBudget ?? 0,
    yearlyBudget: body.yearlyBudget ?? 0,
    currency: body.currency || "USD",
  };

  const config = await prisma.budgetConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json(config);
}
