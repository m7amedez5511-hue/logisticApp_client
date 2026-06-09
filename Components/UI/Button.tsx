// Design-system button with variant, size, and loading state support.

import { cn } from "../../lib/utils";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Full-width block button */
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-sm",
  secondary:
    "bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]",
  ghost:
    "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
  danger:
    "bg-red-600 hover:bg-red-700 text-white",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8  px-3 text-[12px] gap-1.5",
  md: "h-10 px-4 text-[13px] gap-2",
  lg: "h-11 px-6 text-[14px] gap-2",
};

/**
 * @example
 * <Button onClick={handleSave}>Save</Button>
 * <Button variant="secondary" size="sm">Cancel</Button>
 * <Button loading={isSubmitting} fullWidth>Submit</Button>
 * <Button variant="danger">Delete</Button>
 */
export function Button({
  loading,
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold",
        "transition-all active:scale-[.98]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && (
        <Spinner
          size="sm"
          className="text-current"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}