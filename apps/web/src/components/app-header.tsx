import Link from "next/link";

import { cx } from "@/lib/cx";

type AppHeaderProps = {
  current?: "landing" | "teacher" | "operator" | "student";
  minimal?: boolean;
  utility?: React.ReactNode;
};

const navItems = [
  { href: "/", label: "소개", key: "landing" },
  { href: "/teacher", label: "교사용", key: "teacher" },
  { href: "/operator", label: "운영 요약", key: "operator" },
] as const;

export function AppHeader({
  current = "landing",
  minimal = false,
  utility,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="brand-link" aria-label="VIVA 홈">
          <div className="brand-link__copy">
            <strong>VIVA</strong>
            <span>제출 이후 이해를 검증하는 레이어</span>
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
