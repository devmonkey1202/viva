import { cx } from "@/lib/cx";

type StatusBadgeProps = {
  tone?:
    | "neutral"
    | "info"
    | "success"
    | "warning"
    | "danger"
    | "accent";
  children: React.ReactNode;
};

const toneClassMap: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "status-badge--neutral",
  info: "status-badge--info",
  success: "status-badge--success",
  warning: "status-badge--warning",
  danger: "status-badge--danger",
  accent: "status-badge--accent",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: StatusBadgeProps) {
  return <span className={cx("status-badge", toneClassMap[tone])}>{children}</span>;
}
