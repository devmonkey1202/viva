import Link from "next/link";

import { AppHeader } from "@/components/app-header";

export default function NotFound() {
  return (
    <main className="app-shell app-shell--settings">
      <AppHeader minimal />
      <div className="empty-page">
        <div className="empty-page__panel">
          <p className="eyebrow">찾을 수 없음</p>
          <h1 className="empty-page__title">요청한 화면을 찾을 수 없습니다.</h1>
          <p className="intro-description">
            잘못된 링크이거나 만료된 검증 세션일 수 있습니다. 교사 화면에서
            최신 링크를 다시 확인하세요.
          </p>
          <div className="empty-page__actions">
            <Link href="/" className="button button--primary">
              소개로 이동
            </Link>
            <Link href="/teacher" className="button button--secondary">
              교사 화면
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
