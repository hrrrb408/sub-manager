import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";
import { checkAndNotify } from "@/lib/notify";
import { NextResponse } from "next/server";

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const result = await checkAndNotify(userId);
  return NextResponse.json(result);
}
