import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="app-shell">
      <AppHeader current="landing" />
      <div className="page-stack">
        <div className="empty-page">
          <div className="empty-page__panel">
            <p className="eyebrow">Access Gateway</p>
            <h1 className="intro-title">역할을 선택하고 작업 공간으로 들어갑니다.</h1>
            <p className="intro-description">
              VIVA는 공개 소개 페이지와 실사용 워크스페이스를 분리합니다. 교사는
              검증 워크벤치로, 운영자는 요약 대시보드로 진입합니다.
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
