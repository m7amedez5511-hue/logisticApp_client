import { cn } from "@/src/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between",
        "rounded-[var(--radius-xl)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
        "px-8 py-6",
        className,
      )}
    >
      <div>
        {backHref && (
          <a
            href={backHref}
            className={cn(
              "mb-2 inline-flex items-center gap-1",
              "text-[12px] font-semibold text-[var(--color-brand-600)]",
              "hover:text-[var(--color-brand-700)] transition-colors",
            )}
          >
            ← {backLabel ?? "رجوع"}
          </a>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-3 sm:mt-0 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}