import { NextResponse } from "next/server";

import { getRuntimeStatus } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    checkedAt: new Date().toISOString(),
    runtime: getRuntimeStatus(),
  });
}
