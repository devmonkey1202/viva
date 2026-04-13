import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = createRequestTrace(request, "/api/auth/logout");
  const response = NextResponse.json(
    { ok: true },
    { headers: buildTraceHeaders(trace) },
  );

  clearSessionCookies(response);

  logServerEvent("info", "auth.logout_completed", {
    requestId: trace.requestId,
    durationMs: getTraceDurationMs(trace),
  });

  return response;
}
