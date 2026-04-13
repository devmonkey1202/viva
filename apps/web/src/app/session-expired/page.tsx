import Link from "next/link";

import { AppHeader } from "@/components/app-header";

export default function SessionExpiredPage() {
  return (
    <main className="app-shell">
      <AppHeader minimal />
      <div className="empty-page">
        <div className="empty-page__panel">
          <p className="eyebrow">Session Expired</p>
          <h1 className="intro-title">이 검증 세션은 더 이상 사용할 수 없습니다.</h1>
          <p className="intro-description">
            링크가 만료되었거나 삭제된 세션일 수 있습니다. 교사에게 최신 링크를 다시
            받아서 접속하세요.
          </p>
          <div className="empty-page__actions">
            <Link href="/" className="button button--primary">
              메인으로 이동
            </Link>
            <Link href="/login" className="button button--secondary">
              교사/운영자 로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

