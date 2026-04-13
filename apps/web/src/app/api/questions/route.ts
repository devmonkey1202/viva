import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { generateQuestionSet } from "@/lib/ai/service";
import { requireApiRole } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";
import {
  GenerateQuestionSetRequestSchema,
  GenerateQuestionSetResponseSchema,
} from "@/lib/schemas";
import { createVerificationRecord } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = createRequestTrace(request, "/api/questions");

  try {
    const session = await requireApiRole("teacher");
    const body = await request.json();
    const input = GenerateQuestionSetRequestSchema.parse(body);
    const questionSet = await generateQuestionSet(input, {
      requestId: trace.requestId,
      route: trace.path,
      actorRole: session.role,
    });
    const verification = await createVerificationRecord(input, questionSet);
    const response = GenerateQuestionSetResponseSchema.parse({
      verificationId: verification.verificationId,
      questionSet: verification.questionSet,
    });

    logServerEvent("info", "questions.created", {
      requestId: trace.requestId,
      actorRole: session.role,
      durationMs: getTraceDurationMs(trace),
      verificationId: verification.verificationId,
      modelVersion: verification.questionSet.modelVersion,
    });

    return NextResponse.json(response, { headers: buildTraceHeaders(trace) });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "질문 생성 입력 형식이 올바르지 않습니다.",
      fallbackMessage: "질문 생성 중 오류가 발생했습니다.",
      trace,
    });
  }
}
