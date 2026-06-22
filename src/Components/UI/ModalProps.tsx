import { useEffect } from "react";
import { cn } from "@/src/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Footer slot – typically action buttons */
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Subtitle or badge shown below the title */
  subtitle?: string;
}

const MODAL_SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
  subtitle,
}: ModalProps) {
  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-slate-900)]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative w-full flex flex-col max-h-[90vh]",
          "bg-[var(--color-surface)]",
          "rounded-[var(--radius-2xl)]",
          "border border-[var(--color-border)]",
          "shadow-[var(--shadow-overlay)]",
          MODAL_SIZES[size],
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between",
            "px-6 py-4",
            "border-b border-[var(--color-border)]",
            "bg-[var(--color-surface-muted)]",
            "rounded-t-[var(--radius-2xl)]",
          )}
        >
          <div>
            {subtitle && (
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[var(--color-brand-600)] mb-1">
                {subtitle}
              </p>
            )}
            <h2
              id="modal-title"
              className="text-[17px] font-bold text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className={cn(
              "w-[34px] h-[34px] flex items-center justify-center",
              "rounded-[var(--radius-md)]",
              "border border-[var(--color-border)]",
              "bg-[var(--color-surface)]",
              "text-[18px] text-[var(--color-text-muted)]",
              "hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)]",
              "transition-colors cursor-pointer",
            )}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "flex justify-end gap-2",
              "px-6 py-4",
              "border-t border-[var(--color-border)]",
              "bg-[var(--color-surface-muted)]",
              "rounded-b-[var(--radius-2xl)]",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}