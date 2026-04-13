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
  UpdateStudentAccessRequestSchema,
  UpdateStudentAccessResponseSchema,
} from "@/lib/schemas";
import {
  getVerificationRecord,
  setStudentAccessForVerification,
} from "@/lib/verification-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    verificationId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const trace = createRequestTrace(
    request,
    "/api/verifications/[verificationId]/student-access",
  );

  try {
    const session = await requireApiRole("teacher");
    const { verificationId } = await context.params;
    const current = await getVerificationRecord(verificationId);

    if (!current) {
      return NextResponse.json(
        { message: "해당 검증 세션을 찾을 수 없습니다." },
        { status: 404, headers: buildTraceHeaders(trace) },
      );
    }

    const body = await request.json();
    const input = UpdateStudentAccessRequestSchema.parse(body);
    const verification = await setStudentAccessForVerification(
      verificationId,
      input.state,
    );

    const response = UpdateStudentAccessResponseSchema.parse({
      verificationId: verification.verificationId,
      studentAccessState: verification.studentAccessState,
      updatedAt: verification.updatedAt,
    });

    logServerEvent("info", "student-access.updated", {
      requestId: trace.requestId,
      actorRole: session.role,
      durationMs: getTraceDurationMs(trace),
      verificationId,
      studentAccessState: verification.studentAccessState,
    });

    return NextResponse.json(response, { headers: buildTraceHeaders(trace) });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "학생 링크 상태 변경 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "학생 링크 상태 변경 중 오류가 발생했습니다.",
      trace,
    });
  }
}
