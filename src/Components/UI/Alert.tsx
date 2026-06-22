// Typed, accessible alert banner with optional dismiss button.

import { cn } from "@/src/lib/utils";

export type AlertType = "error" | "info" | "success" | "warning";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const config: Record<AlertType, { bg: string; icon: string; iconLabel: string }> = {
  error:   { bg: "bg-red-50 border-red-200 text-red-700",         icon: "⚠", iconLabel: "Error" },
  info:    { bg: "bg-blue-50 border-blue-200 text-blue-700",      icon: "ℹ", iconLabel: "Info" },
  success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "✓", iconLabel: "Success" },
  warning: { bg: "bg-amber-50 border-amber-200 text-amber-700",   icon: "!", iconLabel: "Warning" },
};

/**
 * @example
 * <Alert type="error" message="Invalid credentials." onClose={() => setErr(null)} />
 * <Alert type="success" title="Saved!" message="Your changes have been applied." />
 */
export function Alert({ type = "error", title, message, onClose, className }: AlertProps) {
  const { bg, icon, iconLabel } = config[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 border rounded-[var(--radius-md)] px-3 py-2.5 text-[12px] font-medium",
        bg,
        className,
      )}
    >
      <span aria-label={iconLabel} className="flex-shrink-0 mt-0.5">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="flex-shrink-0 opacity-60 hover:opacity-100 text-[16px] leading-none transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}