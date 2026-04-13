import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextResponse } from "next/server";

import {
  isRoleAllowedForPath,
  parseVivaRole,
  sanitizeNextPath,
  type VivaRole,
  vivaRoleCookieName,
} from "@/lib/auth";

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export type VivaAuthMode = "demo" | "passcode";

export type VivaSession = {
  role: VivaRole;
  authMode: VivaAuthMode;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
};

export const vivaSessionCookieName = "viva_session";

const sessionMaxAgeSeconds = 60 * 60 * 12;

const readTrimmedEnv = (value: string | undefined) => value?.trim() ?? "";

const getSessionSecret = () =>
  readTrimmedEnv(process.env.VIVA_SESSION_SECRET) ||
  readTrimmedEnv(process.env.DATABASE_URL) ||
  readTrimmedEnv(process.env.AI_API_KEY) ||
  readTrimmedEnv(process.env.OPENAI_API_KEY) ||
  "viva-local-dev-session-secret";

const getRoleAccessCode = (role: VivaRole) =>
  role === "teacher"
    ? readTrimmedEnv(process.env.VIVA_TEACHER_ACCESS_CODE)
    : readTrimmedEnv(process.env.VIVA_OPERATOR_ACCESS_CODE);

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const base64UrlDecode = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

const signPayload = (payload: string) =>
  createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

const safeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const createSessionPayload = (
  role: VivaRole,
  authMode: VivaAuthMode,
): VivaSession => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + sessionMaxAgeSeconds * 1000);

  return {
    role,
    authMode,
    sessionId: randomUUID(),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

export const createVivaSessionToken = (
  role: VivaRole,
  authMode: VivaAuthMode,
) => {
  const payload = createSessionPayload(role, authMode);
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const parseVivaSessionToken = (token: string | undefined | null) => {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!safeEquals(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<VivaSession>;
    const role = parseVivaRole(parsed.role);

    if (!role) {
      return null;
    }

    if (
      typeof parsed.sessionId !== "string" ||
      typeof parsed.issuedAt !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      (parsed.authMode !== "demo" && parsed.authMode !== "passcode")
    ) {
      return null;
    }

    if (Number.isNaN(new Date(parsed.expiresAt).getTime())) {
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return {
      role,
      authMode: parsed.authMode,
      sessionId: parsed.sessionId,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    } satisfies VivaSession;
  } catch {
    return null;
  }
};

export const readVivaSessionFromCookies = (cookieReader: CookieReader) =>
  parseVivaSessionToken(cookieReader.get(vivaSessionCookieName)?.value);

export const readVivaRoleFromSessionCookies = (cookieReader: CookieReader) =>
  readVivaSessionFromCookies(cookieReader)?.role ?? null;

export const getAccessCodeRequirement = (role: VivaRole) =>
  getRoleAccessCode(role).length > 0;

export const validateAccessCode = (
  role: VivaRole,
  value: string | undefined | null,
): { valid: boolean; authMode: VivaAuthMode } => {
  const expected = getRoleAccessCode(role);

  if (!expected) {
    return { valid: true, authMode: "demo" };
  }

  const candidate = readTrimmedEnv(value ?? undefined);

  return {
    valid: safeEquals(expected, candidate),
    authMode: "passcode",
  };
};

const buildCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export const attachSessionCookies = (
  response: NextResponse,
  role: VivaRole,
  authMode: VivaAuthMode,
) => {
  response.cookies.set(
    vivaSessionCookieName,
    createVivaSessionToken(role, authMode),
    buildCookieOptions(sessionMaxAgeSeconds),
  );
  response.cookies.set(vivaRoleCookieName, role, buildCookieOptions(sessionMaxAgeSeconds));
};

export const clearSessionCookies = (response: NextResponse) => {
  response.cookies.set(vivaSessionCookieName, "", buildCookieOptions(0));
  response.cookies.set(vivaRoleCookieName, "", buildCookieOptions(0));
};

export class ApiAuthorizationError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiAuthorizationError";
    this.status = status;
    this.code = code;
  }
}

export const requireApiRole = async (
  allowedRoles: VivaRole | VivaRole[],
): Promise<VivaSession> => {
  const session = readVivaSessionFromCookies(await cookies());
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!session) {
    throw new ApiAuthorizationError(401, "auth_required", "로그인이 필요합니다.");
  }

  if (!allowed.includes(session.role)) {
    throw new ApiAuthorizationError(
      403,
      "forbidden",
      "현재 역할로는 이 작업을 수행할 수 없습니다.",
    );
  }

  return session;
};

export const readOptionalApiSession = async () =>
  readVivaSessionFromCookies(await cookies());

export const requirePageRole = async (
  pathname: string,
  allowedRoles: VivaRole | VivaRole[],
) => {
  const cookieStore = await cookies();
  const session = readVivaSessionFromCookies(cookieStore);
  const safeNextPath = sanitizeNextPath(pathname);
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(safeNextPath)}`);
  }

  if (!allowed.includes(session.role) || !isRoleAllowedForPath(pathname, session.role)) {
    redirect(
      `/unauthorized?next=${encodeURIComponent(safeNextPath)}&role=${encodeURIComponent(session.role)}`,
    );
  }

  return session;
};
