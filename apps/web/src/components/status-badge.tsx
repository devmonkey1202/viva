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
  neutral:
    "border-[rgba(44,32,19,0.14)] bg-[rgba(255,250,242,0.74)] text-[rgba(24,20,17,0.72)]",
  info:
    "border-[rgba(59,86,112,0.18)] bg-[rgba(59,86,112,0.08)] text-[rgba(39,64,86,0.92)]",
  success:
    "border-[rgba(33,70,61,0.18)] bg-[rgba(33,70,61,0.1)] text-[rgba(33,70,61,0.96)]",
  warning:
    "border-[rgba(138,90,31,0.18)] bg-[rgba(138,90,31,0.08)] text-[rgba(138,90,31,0.96)]",
  danger:
    "border-[rgba(127,32,37,0.2)] bg-[rgba(127,32,37,0.08)] text-[rgba(127,32,37,0.96)]",
  accent:
    "border-[rgba(125,46,42,0.18)] bg-[rgba(125,46,42,0.08)] text-[rgba(125,46,42,0.96)]",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] uppercase ${toneClassMap[tone]}`}
    >
      {children}
    </span>
  );
}
