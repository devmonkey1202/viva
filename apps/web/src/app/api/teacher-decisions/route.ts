import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
    const message =
      error instanceof ZodError
        ? "교사 판단 입력 형식이 올바르지 않습니다."
        : "교사 판단 저장 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        message,
        details: error instanceof ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}
