import Link from "next/link";

import { AppHeader } from "@/components/app-header";

export default function NotFound() {
  return (
    <main className="app-shell">
      <AppHeader minimal />
      <div className="empty-page">
        <div className="empty-page__panel">
          <p className="eyebrow">Not Found</p>
          <h1 className="intro-title">요청한 화면을 찾을 수 없습니다.</h1>
          <p className="intro-description">
            링크가 만료되었거나 잘못된 검증 세션일 수 있습니다. 교사용 화면에서
            최신 세션 링크를 다시 확인하세요.
          </p>
          <div className="empty-page__actions">
            <Link href="/" className="button button--primary">
              홈으로 이동
            </Link>
            <Link href="/teacher" className="button button--secondary">
              교사용 화면
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
