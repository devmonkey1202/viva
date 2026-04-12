import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import {
  SaveTeacherDecisionRequestSchema,
  SaveTeacherDecisionResponseSchema,
} from "@/lib/schemas";
import { saveTeacherDecisionForVerification } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "교사 판단 입력 형식이 올바르지 않습니다.",
      fallbackMessage: "교사 판단 저장 중 오류가 발생했습니다.",
    });
  }
}
