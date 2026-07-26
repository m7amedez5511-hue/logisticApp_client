import { cn } from "@/src/lib/utils";

export interface SpinnerProps {
  /** Visual size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Additional Tailwind classes — use `text-{color}` to tint */
  className?: string;
}

// Font size (px) for each spinner size — replaces the old h-*/w-* SVG classes.
const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "16px",
  md: "24px",
  lg: "40px",
};

/**
 * @example
 * // Default (medium, brand blue)
 * <Spinner />
 *
 * // Large, white (inside a dark button)
 * <Spinner size="lg" className="text-white" />
 *
 * // Small, inline
 * <Spinner size="sm" className="text-emerald-600" />
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <i
      role="status"
      aria-label="Loading"
      className={cn(
        "ti ti-loader-2 motion-safe:animate-spin text-[var(--color-brand-600)] shrink-0",
        className,
      )}
      style={{ fontSize: sizeMap[size], lineHeight: 1 }}
    />
  );
}

/** Full-page loading overlay */
export function PageLoader({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-label={message}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-surface)]"
    >
      <Spinner size="lg" />
      <p className="text-[13px] text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

/** Inline loading row — for card/section loading states */
export function InlineLoader({ message = "Loading…" }: { message?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-4">
      <Spinner size="sm" />
      <span className="text-[13px] text-[var(--color-text-muted)]">{message}</span>
    </div>
  );
}