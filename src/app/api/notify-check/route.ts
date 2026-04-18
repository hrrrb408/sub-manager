import { checkAndNotify } from "@/lib/notify";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await checkAndNotify();
  return NextResponse.json(result);
}
