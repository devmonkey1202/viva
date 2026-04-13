import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api-error-response";
import {
  parseVivaRole,
  sanitizeNextPath,
  vivaRoleCookieName,
} from "@/lib/auth";

const LoginRequestSchema = z.object({
  role: z.string().min(1),
  nextPath: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = LoginRequestSchema.parse(await request.json());
    const role = parseVivaRole(payload.role);

    if (!role) {
      return NextResponse.json(
        { message: "지원하지 않는 접근 역할입니다." },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      role,
      nextPath: sanitizeNextPath(payload.nextPath),
    });

    response.cookies.set(vivaRoleCookieName, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return createApiErrorResponse(error, {
      validationMessage: "로그인 요청 형식이 올바르지 않습니다.",
      fallbackMessage: "로그인 처리 중 오류가 발생했습니다.",
    });
  }
}

