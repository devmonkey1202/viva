import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { analyzeUnderstanding } from "@/lib/ai/service";
import {
  AnalyzeUnderstandingResponseSchema,
  AnalyzeSubmissionRequestSchema,
} from "@/lib/schemas";
import {
  getVerificationRecord,
  saveAnalysisForVerification,
} from "@/lib/verification-store";
import { readOptionalApiSession } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = createRequestTrace(request, "/api/analyze");

  try {
    const session = await readOptionalApiSession();
    const body = await request.json();
    const input = AnalyzeSubmissionRequestSchema.parse(body);

    if (session && session.role !== "teacher") {
      logServerEvent("warn", "analysis.forbidden_role", {
        requestId: trace.requestId,
        actorRole: session.role,
        durationMs: getTraceDurationMs(trace),
      });

      return NextResponse.json(
        { message: "현재 역할로는 분석을 실행할 수 없습니다." },
        { status: 403, headers: buildTraceHeaders(trace) },
      );
    }

    const verification = await getVerificationRecord(input.verificationId);

    if (!verification) {
      logServerEvent("warn", "analysis.verification_missing", {
        requestId: trace.requestId,
        actorRole: session?.role ?? "student_link",
        durationMs: getTraceDurationMs(trace),
        verificationId: input.verificationId,
      });

      return NextResponse.json(
        { message: "해당 검증 세션을 찾을 수 없습니다." },
        { status: 404, headers: buildTraceHeaders(trace) },
      );
    }

    if (!session && verification.studentAccessState !== "open") {
      logServerEvent("warn", "analysis.student_access_locked", {
        requestId: trace.requestId,
        actorRole: "student_link",
        durationMs: getTraceDurationMs(trace),
        verificationId: verification.verificationId,
      });

      return NextResponse.json(
        { message: "현재 학생 응답을 더 이상 받을 수 없는 세션입니다." },
        { status: 403, headers: buildTraceHeaders(trace) },
      );
    }

    if (!session && verification.analysisReport) {
      logServerEvent("warn", "analysis.student_resubmit_blocked", {
        requestId: trace.requestId,
        actorRole: "student_link",
        durationMs: getTraceDurationMs(trace),
        verificationId: verification.verificationId,
      });

      return NextResponse.json(
        { message: "이미 제출이 완료된 세션입니다." },
        { status: 409, headers: buildTraceHeaders(trace) },
      );
    }

    const hydratedInput = {
      verificationId: verification.verificationId,
      assignmentTitle: verification.assignmentTitle,
      assignmentDescription: verification.assignmentDescription,
      rubricCoreConcepts: verification.rubricCoreConcepts,
      rubricRiskPoints: verification.rubricRiskPoints,
      submissionText: verification.submissionText,
      sessionPreferences: verification.sessionPreferences,
      questionSet: input.questionSet,
      studentAnswers: input.studentAnswers,
    };
    const report = await analyzeUnderstanding(hydratedInput, {
      requestId: trace.requestId,
      route: trace.path,
      actorRole: session?.role ?? "student_link",
      verificationId: verification.verificationId,
    });
    const savedVerification = await saveAnalysisForVerification(input, report);
    const response = AnalyzeUnderstandingResponseSchema.parse({
      verificationId: savedVerification.verificationId,
      analysisReport: savedVerification.analysisReport,
    });

    logServerEvent("info", "analysis.saved", {
      requestId: trace.requestId,
      actorRole: session?.role ?? "student_link",
      durationMs: getTraceDurationMs(trace),
      verificationId: savedVerification.verificationId,
      classification: savedVerification.analysisReport?.classification,
      modelVersion: savedVerification.analysisReport?.modelVersion,
    });

    return NextResponse.json(response, { headers: buildTraceHeaders(trace) });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "분석 입력 형식이 올바르지 않습니다.",
      fallbackMessage: "이해 분석 중 오류가 발생했습니다.",
      trace,
    });
  }
}
