import Link from "next/link";

import { AppHeader } from "@/components/app-header";

export default function SessionExpiredPage() {
  return (
    <main className="app-shell app-shell--settings">
      <AppHeader minimal />
      <div className="empty-page">
        <div className="empty-page__panel">
          <p className="eyebrow">Session Closed</p>
          <h1 className="intro-title">이 검증 세션은 더 이상 학생 응답을 받지 않습니다.</h1>
          <p className="intro-description">
            링크가 만료되었거나 교사가 학생 링크를 잠근 상태입니다. 최신 링크가 필요하면 교사에게 다시
            요청하세요.
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
