import Link from "next/link";

import { cx } from "@/lib/cx";

type AppHeaderProps = {
  current?: "landing" | "teacher" | "operator" | "student" | "settings";
  minimal?: boolean;
  utility?: React.ReactNode;
};

const navItems = [
  { href: "/", label: "소개", key: "landing" },
  { href: "/teacher", label: "교사", key: "teacher" },
  { href: "/operator", label: "운영", key: "operator" },
  { href: "/settings", label: "설정", key: "settings" },
] as const;

export function AppHeader({
  current = "landing",
  minimal = false,
  utility,
}: AppHeaderProps) {
  return (
    <header className={cx("app-header", minimal && "app-header--minimal")}>
      <div className="app-header__inner">
        <Link href="/" className="brand-link" aria-label="VIVA 홈으로 이동">
          <div className="brand-link__copy">
            <strong>VIVA</strong>
            <span>이해를 확인하는 검증 레이어</span>
          </div>
        </Link>

        {!minimal ? (
          <nav className="app-nav" aria-label="주요 이동">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "app-nav__item",
                  current === item.key && "app-nav__item--active",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="app-header__utility">{utility}</div>
      </div>
    </header>
  );
}
