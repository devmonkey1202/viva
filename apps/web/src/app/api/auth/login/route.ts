import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api-error-response";
import {
  parseVivaRole,
  sanitizeNextPath,
} from "@/lib/auth";
import {
  attachSessionCookies,
  validateAccessCode,
} from "@/lib/server-auth";
import {
  buildTraceHeaders,
  createRequestTrace,
  getTraceDurationMs,
  logServerEvent,
} from "@/lib/server-observability";

const LoginRequestSchema = z.object({
  role: z.string().min(1),
  nextPath: z.string().optional(),
  accessCode: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = createRequestTrace(request, "/api/auth/login");

  try {
    const payload = LoginRequestSchema.parse(await request.json());
    const role = parseVivaRole(payload.role);

    if (!role) {
      return NextResponse.json(
        { message: "지원하지 않는 접근 역할입니다." },
        { status: 400, headers: buildTraceHeaders(trace) },
      );
    }

    const access = validateAccessCode(role, payload.accessCode);

    if (!access.valid) {
      logServerEvent("warn", "auth.login_denied", {
        requestId: trace.requestId,
        durationMs: getTraceDurationMs(trace),
        role,
      });

      return NextResponse.json(
        { message: "접속 코드가 올바르지 않습니다." },
        { status: 401, headers: buildTraceHeaders(trace) },
      );
    }

    const response = NextResponse.json({
      ok: true,
      role,
      nextPath: sanitizeNextPath(payload.nextPath),
      authMode: access.authMode,
    }, {
      headers: buildTraceHeaders(trace),
    });

    attachSessionCookies(response, role, access.authMode);

    logServerEvent("info", "auth.login_completed", {
      requestId: trace.requestId,
      durationMs: getTraceDurationMs(trace),
      role,
      authMode: access.authMode,
    });

    return response;
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "로그인 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "로그인 처리 중 오류가 발생했습니다.",
      trace,
    });
  }
}
