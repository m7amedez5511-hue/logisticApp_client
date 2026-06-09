// Accessible labelled input with error and hint state.

import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label text — also used to derive the `htmlFor` id */
  label: string;
  /** Validation error message — sets aria-invalid and renders red helper text */
  error?: string;
  /** Neutral helper / hint text shown below the input */
  hint?: string;
  /** Optional right-side icon node */
  icon?: React.ReactNode;
}

/**
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   error={errors.email}
 *   autoComplete="email"
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   hint="At least 8 characters"
 * />
 */
export function Input({ label, error, hint, id, icon, className, ...rest }: InputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const hintId  = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[12px] font-semibold text-[var(--color-text-primary)]"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-hint)] pointer-events-none"
          >
            {icon}
          </div>
        )}

        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            "w-full h-10 px-3 border rounded-[var(--radius-md)] text-[13px]",
            "text-[var(--color-text-primary)] placeholder-[var(--color-text-hint)]",
            "bg-white outline-none transition",
            "focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/15",
            "focus-visible:ring-[var(--color-brand-600)]",
            icon ? "pr-9" : "",
            error
              ? "border-red-400 bg-red-50"
              : "border-[var(--color-border)]",
            className,
          )}
          {...rest}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-500 font-medium">
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
}