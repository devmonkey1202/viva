import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { GetVerificationResponseSchema } from "@/lib/schemas";
import { getVerificationRecord } from "@/lib/verification-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    verificationId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { verificationId } = await context.params;
    const verification = await getVerificationRecord(verificationId);

    if (!verification) {
      return NextResponse.json(
        { message: "해당 검증 세션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const response = GetVerificationResponseSchema.parse({ verification });

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "검증 세션 조회 요청이 올바르지 않습니다.",
      fallbackMessage: "검증 세션 조회 중 오류가 발생했습니다.",
    });
  }
}
