import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;

  const conn = await prisma.emailConnection.findFirst({
    where: { id, userId },
  });

  if (!conn) {
    return NextResponse.json({ error: "连接不存在" }, { status: 404 });
  }

  await prisma.emailConnection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const conn = await prisma.emailConnection.findFirst({
    where: { id, userId },
  });

  if (!conn) {
    return NextResponse.json({ error: "连接不存在" }, { status: 404 });
  }

  const updated = await prisma.emailConnection.update({
    where: { id },
    data: {
      ...(body.scanEnabled !== undefined && { scanEnabled: body.scanEnabled }),
      ...(body.scanFolder !== undefined && { scanFolder: body.scanFolder }),
    },
  });

  return NextResponse.json({ ...updated, encryptedPassword: "••••••" });
}
