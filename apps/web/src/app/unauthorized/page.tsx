import Link from "next/link";

import { AppHeader } from "@/components/app-header";

export default function UnauthorizedPage() {
  return (
    <main className="app-shell app-shell--settings">
      <AppHeader minimal />
      <div className="empty-page">
        <div className="empty-page__panel">
          <p className="eyebrow">Unauthorized</p>
          <h1 className="intro-title">현재 역할로는 이 화면에 접근할 수 없습니다.</h1>
          <p className="intro-description">
            교사용 워크스페이스와 운영 대시보드는 권한이 분리되어 있습니다. 다른 역할로 다시 로그인하거나
            공개 소개 화면으로 돌아가세요.
          </p>
          <div className="empty-page__actions">
            <Link href="/login" className="button button--primary">
              다시 로그인
            </Link>
            <Link href="/" className="button button--secondary">
              소개 페이지
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
