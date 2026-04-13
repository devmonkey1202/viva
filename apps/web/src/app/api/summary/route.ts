import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { getOperatorSummary } from "@/lib/verification-store";
import { requireApiRole } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const trace = createRequestTrace(request, "/api/summary");

  try {
    const session = await requireApiRole("operator");
    const summary = await getOperatorSummary();

    logServerEvent("info", "summary.loaded", {
      requestId: trace.requestId,
      actorRole: session.role,
      durationMs: getTraceDurationMs(trace),
      totalVerifications: summary.totalVerifications,
    });

    return NextResponse.json(summary, {
      headers: buildTraceHeaders(trace),
    });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "요약 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "운영 요약 조회 중 오류가 발생했습니다.",
      trace,
    });
  }
}
