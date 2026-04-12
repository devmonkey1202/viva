import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import { ListVerificationsResponseSchema } from "@/lib/schemas";
import { filterVerificationList } from "@/lib/verification-list";
import { listVerificationRecords } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";
    const limit = Number(searchParams.get("limit") ?? "8");
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.trunc(limit), 30) : 8;

    const records = await listVerificationRecords();
    const items = filterVerificationList(records, query, safeLimit);
    const response = ListVerificationsResponseSchema.parse({ items });

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "검증 세션 목록 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "검증 세션 목록 조회 중 오류가 발생했습니다.",
    });
  }
}
