import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateQuestionSet } from "@/lib/ai/service";
import {
  GenerateQuestionSetRequestSchema,
  GenerateQuestionSetResponseSchema,
} from "@/lib/schemas";
import { createVerificationRecord } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = GenerateQuestionSetRequestSchema.parse(body);
    const questionSet = await generateQuestionSet(input);
    const verification = await createVerificationRecord(input, questionSet);
    const response = GenerateQuestionSetResponseSchema.parse({
      verificationId: verification.verificationId,
      questionSet: verification.questionSet,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "질문 생성 입력 형식이 올바르지 않습니다."
        : "질문 생성 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        message,
        details: error instanceof ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}
