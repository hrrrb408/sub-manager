import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { discoveredId } = body;

  if (!discoveredId) {
    return NextResponse.json({ error: "缺少 discoveredId" }, { status: 400 });
  }

  const discovered = await prisma.discoveredSubscription.findFirst({
    where: { id: discoveredId, userId, status: "pending" },
  });

  if (!discovered) {
    return NextResponse.json({ error: "未找到该记录" }, { status: 404 });
  }

  await prisma.discoveredSubscription.update({
    where: { id: discoveredId },
    data: { status: "dismissed" },
  });

  return NextResponse.json({ success: true });
}
