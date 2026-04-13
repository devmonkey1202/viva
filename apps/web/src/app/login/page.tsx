import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";
import {
  isRoleAllowedForPath,
  sanitizeNextPath,
  vivaRoleMeta,
} from "@/lib/auth";
import { readVivaRoleFromSessionCookies } from "@/lib/server-auth";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const role = readVivaRoleFromSessionCookies(await cookies());
  const next = sanitizeNextPath((await searchParams)?.next);

  if (role) {
    redirect(
      isRoleAllowedForPath(next, role) ? next : vivaRoleMeta[role].defaultPath,
    );
  }

  return (
    <main className="app-shell app-shell--settings">
      <AppHeader current="landing" />
      <div className="page-stack page-stack--auth">
        <section className="auth-shell">
          <div className="auth-shell__copy">
            <p className="eyebrow">워크스페이스 접속</p>
            <h1 className="auth-shell__title">
              역할을 고르고
              <br />
              바로 작업 화면으로 들어갑니다.
            </h1>
            <p className="auth-shell__description">
              공개 소개 페이지와 실제 워크스페이스는 분리되어 있습니다. 교사는 검증 워크벤치로,
              운영자는 패턴 대시보드로 바로 이동합니다.
            </p>
            <div className="auth-shell__notes">
              <div className="auth-shell__note">
                <strong>교사</strong>
                <span>과제 입력, 질문 생성, 학생 링크 공유, 근거 검토, 최종 판단</span>
              </div>
              <div className="auth-shell__note">
                <strong>운영자</strong>
                <span>분포 확인, 반복 오개념 추적, 최근 세션 모니터링</span>
              </div>
            </div>
          </div>

          <div className="auth-shell__panel">
            <p className="eyebrow">역할 선택</p>
            <h2 className="section-title">어떤 흐름으로 시작할지 선택합니다.</h2>
            <p className="section-description">
              데모 배포에서는 간단한 역할 기반 진입으로 시작하고, 접속 코드가 설정된 배포에서는 역할별 코드가
              함께 적용됩니다.
            </p>
            <Suspense fallback={<div className="table-empty">접속 역할을 불러오는 중입니다.</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
