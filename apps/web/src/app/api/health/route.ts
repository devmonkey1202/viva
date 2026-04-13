import { NextResponse } from "next/server";
import { createRequestTrace, buildTraceHeaders } from "@/lib/server-observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const trace = createRequestTrace(request, "/api/health");

  return NextResponse.json({
    status: "ok",
    checkedAt: new Date().toISOString(),
    service: "viva",
  }, {
    headers: buildTraceHeaders(trace),
  });
}
