import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { requireApiRole } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";
import {
  SaveTeacherDecisionRequestSchema,
  SaveTeacherDecisionResponseSchema,
} from "@/lib/schemas";
import { saveTeacherDecisionForVerification } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = createRequestTrace(request, "/api/teacher-decisions");

  try {
    const session = await requireApiRole("teacher");
    const body = await request.json();
    const input = SaveTeacherDecisionRequestSchema.parse(body);
    const verification = await saveTeacherDecisionForVerification(
      input.verificationId,
      input.decision,
    );
    const response = SaveTeacherDecisionResponseSchema.parse({
      verificationId: verification.verificationId,
      teacherDecision: verification.teacherDecision,
    });

    logServerEvent("info", "teacher-decision.saved", {
      requestId: trace.requestId,
      actorRole: session.role,
      durationMs: getTraceDurationMs(trace),
      verificationId: verification.verificationId,
      decision: verification.teacherDecision?.decision,
    });

    return NextResponse.json(response, { headers: buildTraceHeaders(trace) });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "교사 판단 저장 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "교사 판단 저장 중 오류가 발생했습니다.",
      trace,
    });
  }
}
