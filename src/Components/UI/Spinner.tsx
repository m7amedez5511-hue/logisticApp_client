import { cn } from "@/src/lib/utils";

export interface SpinnerProps {
  /** Visual size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Additional Tailwind classes — use `text-{color}` to tint */
  className?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10 border-4",
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
    <svg
      role="status"
      aria-label="Loading"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn(
        "motion-safe:animate-spin text-[var(--color-brand-600)] shrink-0",
        sizeMap[size],
        className,
      )}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
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