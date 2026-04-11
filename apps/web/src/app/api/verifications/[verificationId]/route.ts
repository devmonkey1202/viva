import { NextResponse } from "next/server";

import { GetVerificationResponseSchema } from "@/lib/schemas";
import { getVerificationRecord } from "@/lib/verification-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    verificationId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
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
}
