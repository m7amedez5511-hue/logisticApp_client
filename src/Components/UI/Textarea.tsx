import { forwardRef } from "react";
import { cn } from "@/src/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, wrapperClassName = "", className = "", id, ...rest },
  ref
) {
  const taId    = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const errorId = taId ? `${taId}-error` : undefined;
  const hintId  = taId ? `${taId}-hint`  : undefined;

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={taId}
          className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={taId}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          "w-full rounded-[var(--radius-md)] border px-3 py-2 text-[13px] resize-none",
          "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-hint)]",
          "transition-[border-color,box-shadow]",
          "focus:outline-none focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/15",
          "disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-hint)]",
          error
            ? "border-[var(--color-danger)] bg-[var(--color-danger-light)]"
            : "border-[var(--color-border)]",
          className,
        )}
        {...rest}
      />

      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-[11px] text-[var(--color-text-hint)]">
          {hint}
        </p>
      )}
    </div>
  );
});