import { cx } from "@/lib/cx";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  variant?: "default" | "landing" | "tool" | "operator" | "student" | "settings";
  className?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  meta,
  variant = "default",
  className,
}: PageIntroProps) {
  return (
    <section className={cx("intro-block", `intro-block--${variant}`, className)}>
      <div className="intro-block__body">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="intro-title">{title}</h1>
        <p className="intro-description">{description}</p>
      </div>
      {(actions || meta) && (
        <div className="intro-block__aside">
          {actions ? <div className="intro-block__actions">{actions}</div> : null}
          {meta ? <div className="intro-block__meta">{meta}</div> : null}
        </div>
      )}
    </section>
  );
}

type SurfaceCardProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "default" | "muted" | "accent";
  className?: string;
  children: React.ReactNode;
};

export function SurfaceCard({
  title,
  eyebrow,
  description,
  action,
  tone = "default",
  className,
  children,
}: SurfaceCardProps) {
  return (
    <section className={cx("surface-card", `surface-card--${tone}`, className)}>
      {(title || eyebrow || description || action) && (
        <div className="surface-card__header">
          <div className="surface-card__copy">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? (
              <p className="section-description">{description}</p>
            ) : null}
          </div>
          {action ? <div className="surface-card__action">{action}</div> : null}
        </div>
      )}
      <div className="surface-card__body">{children}</div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  note?: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {note ? <p className="metric-card__note">{note}</p> : null}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div>
        <p className="empty-state__title">{title}</p>
        <p className="empty-state__description">{description}</p>
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

type FieldProps = {
  label: string;
  helper?: string;
  children: React.ReactNode;
};

export function Field({ label, helper, children }: FieldProps) {
  return (
    <label className="field-block">
      <span className="field-block__label">{label}</span>
      {helper ? <span className="field-block__helper">{helper}</span> : null}
      {children}
    </label>
  );
}
