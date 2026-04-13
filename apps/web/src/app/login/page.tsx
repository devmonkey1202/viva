import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";
import {
  isRoleAllowedForPath,
  readVivaRoleFromCookies,
  sanitizeNextPath,
  vivaRoleMeta,
} from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const role = readVivaRoleFromCookies(await cookies());
  const next = sanitizeNextPath((await searchParams)?.next);

  if (role) {
    redirect(
      isRoleAllowedForPath(next, role) ? next : vivaRoleMeta[role].defaultPath,
    );
  }

  return (
    <main className="app-shell app-shell--settings">
      <AppHeader current="landing" />
      <div className="page-stack page-stack--settings">
        <div className="empty-page">
          <div className="empty-page__panel">
            <p className="eyebrow">Access Gateway</p>
            <h1 className="intro-title">역할을 고르고 작업 공간으로 들어갑니다.</h1>
            <p className="intro-description">
              공개 소개 화면과 실사용 워크스페이스를 분리했습니다. 교사는 검증 워크벤치로,
              운영자는 요약 대시보드로 진입합니다.
            </p>
            <Suspense fallback={<div className="table-empty">접속 역할을 불러오는 중입니다.</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
