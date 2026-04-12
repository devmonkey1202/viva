import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { analyzeUnderstanding } from "@/lib/ai/service";
import {
  AnalyzeUnderstandingResponseSchema,
  AnalyzeUnderstandingStoredRequestSchema,
} from "@/lib/schemas";
import { saveAnalysisForVerification } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = AnalyzeUnderstandingStoredRequestSchema.parse(body);
    const report = await analyzeUnderstanding(input);
    const verification = await saveAnalysisForVerification(input, report);
    const response = AnalyzeUnderstandingResponseSchema.parse({
      verificationId: verification.verificationId,
      analysisReport: verification.analysisReport,
    });

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "분석 입력 형식이 올바르지 않습니다.",
      fallbackMessage: "이해 분석 중 오류가 발생했습니다.",
    });
  }
}
