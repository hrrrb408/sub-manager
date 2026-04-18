import { NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user";
import { scanEmailsForUser } from "@/lib/email-scanner";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const result = await scanEmailsForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Email scan failed:", error);
    return NextResponse.json({ error: "扫描失败，请检查邮箱连接配置" }, { status: 500 });
  }
}
