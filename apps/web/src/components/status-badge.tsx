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
  neutral: "border-slate-300/80 bg-white/75 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  accent: "border-orange-200 bg-orange-50 text-orange-700",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${toneClassMap[tone]}`}
    >
      {children}
    </span>
  );
}
