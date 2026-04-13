export type VivaRole = "teacher" | "operator";

export const vivaRoleCookieName = "viva_role";

export const vivaRoleMeta: Record<
  VivaRole,
  {
    label: string;
    description: string;
    defaultPath: string;
  }
> = {
  teacher: {
    label: "교사",
    description: "과제 입력, 질문 생성, 학생 답변 검토, 최종 판단",
    defaultPath: "/teacher",
  },
  operator: {
    label: "운영자",
    description: "분포 확인, 반복 오개념 점검, 최근 세션 모니터링",
    defaultPath: "/operator",
  },
};

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export const parseVivaRole = (
  value: string | undefined | null,
): VivaRole | null =>
  value === "teacher" || value === "operator" ? value : null;

export const readVivaRoleFromCookies = (cookies: CookieReader) =>
  parseVivaRole(cookies.get(vivaRoleCookieName)?.value);

export const isProtectedAppPath = (pathname: string) =>
  pathname.startsWith("/teacher") ||
  pathname.startsWith("/operator") ||
  pathname.startsWith("/settings");

export const isRoleAllowedForPath = (
  pathname: string,
  role: VivaRole | null,
) => {
  if (!role) {
    return false;
  }

  if (pathname.startsWith("/operator")) {
    return role === "operator";
  }

  if (pathname.startsWith("/teacher")) {
    return role === "teacher" || role === "operator";
  }

  if (pathname.startsWith("/settings")) {
    return role === "teacher" || role === "operator";
  }

  return true;
};

export const sanitizeNextPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/")) {
    return "/teacher";
  }

  if (value.startsWith("//")) {
    return "/teacher";
  }

  return value;
};
