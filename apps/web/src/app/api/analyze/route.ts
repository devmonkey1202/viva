import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { analyzeUnderstanding } from "@/lib/ai/service";
import { AnalyzeUnderstandingRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = AnalyzeUnderstandingRequestSchema.parse(body);
    const report = await analyzeUnderstanding(input);

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "분석 입력 형식이 올바르지 않습니다."
        : "이해 분석 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        message,
        details: error instanceof ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}
