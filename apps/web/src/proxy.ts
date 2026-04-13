import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isProtectedAppPath,
  isRoleAllowedForPath,
  parseVivaRole,
  sanitizeNextPath,
  vivaRoleCookieName,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  const role = parseVivaRole(request.cookies.get(vivaRoleCookieName)?.value);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", sanitizeNextPath(`${pathname}${search}`));
    return NextResponse.redirect(loginUrl);
  }

  if (!isRoleAllowedForPath(pathname, role)) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set(
      "next",
      sanitizeNextPath(`${pathname}${search}`),
    );
    unauthorizedUrl.searchParams.set("role", role);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/operator/:path*", "/settings/:path*"],
};
