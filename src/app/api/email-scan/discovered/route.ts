import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const items = await prisma.discoveredSubscription.findMany({
    where: { userId, status },
    orderBy: { confidence: "desc" },
  });

  return NextResponse.json(items);
}
