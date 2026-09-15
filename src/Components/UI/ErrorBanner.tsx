// ErrorBanner.tsx
"use client";

import type { NormalizedError } from "@/src/types/types";

interface ErrorBannerProps {
  error: NormalizedError | null;
  onClose?: () => void;
}

// 1. Compact RTL error banner — matches the project's existing Alert style.
export function ErrorBanner({ error, onClose }: ErrorBannerProps) {
  // 2. Render nothing when there's no error.
  if (!error) return null;

  return (
    <div
      dir="rtl"
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700"
    >
      {/* 3. Fixed-size icon so long Arabic text never squeezes it. */}
      <span aria-hidden="true" className="mt-0.5 flex-shrink-0">⚠</span>

      {/* 4. break-words + min-w-0 prevent overflow on narrow screens. */}
      <div className="min-w-0 flex-1 break-words leading-relaxed">
        {error.message}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="flex-shrink-0 text-[16px] leading-none text-red-400 opacity-70 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}