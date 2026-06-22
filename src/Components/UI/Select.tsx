import React, { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, wrapperClassName = "", className = "", id, children, ...rest },
  ref
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full h-10 rounded-[var(--radius-md)] border px-3 text-[13px]",
          "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
          "transition-[border-color,box-shadow]",
          "focus:outline-none focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/15",
          "disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-hint)] disabled:cursor-not-allowed",
          error
            ? "border-[var(--color-danger)] bg-[var(--color-danger-light)]"
            : "border-[var(--color-border)]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p className="text-[11px] font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
});