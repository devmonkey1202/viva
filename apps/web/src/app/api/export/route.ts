import { NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-error-response";
import {
  exportVerificationsAsCsv,
  exportVerificationsAsJson,
} from "@/lib/verification-store";
import { requireApiRole } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const trace = createRequestTrace(request, "/api/export");
  try {
    const session = await requireApiRole(["teacher", "operator"]);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const verificationId = searchParams.get("verificationId") ?? undefined;

    if (format === "csv") {
      const csv = await exportVerificationsAsCsv(verificationId);

      logServerEvent("info", "export.csv", {
        requestId: trace.requestId,
        actorRole: session.role,
        durationMs: getTraceDurationMs(trace),
        verificationId: verificationId ?? "all",
      });

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": verificationId
            ? `attachment; filename="viva-${verificationId}.csv"`
            : 'attachment; filename="viva-export.csv"',
          ...buildTraceHeaders(trace),
        },
      });
    }

    logServerEvent("info", "export.json", {
      requestId: trace.requestId,
      actorRole: session.role,
      durationMs: getTraceDurationMs(trace),
      verificationId: verificationId ?? "all",
    });

    return NextResponse.json(await exportVerificationsAsJson(verificationId), {
      headers: {
        "Content-Disposition": verificationId
          ? `attachment; filename="viva-${verificationId}.json"`
          : 'attachment; filename="viva-export.json"',
        ...buildTraceHeaders(trace),
      },
    });
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "내보내기 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "검증 내보내기 중 오류가 발생했습니다.",
      trace,
    });
  }
}
