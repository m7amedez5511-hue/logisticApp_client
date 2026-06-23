"use client";

import { useEffect, useRef, useState } from "react";

export interface ToastNotification {
  type: "success" | "error";
  message: string;
}

interface ToastProps {
  notification: ToastNotification | null;
  onDismiss?: () => void;
}

export function Toast({ notification, onDismiss }: ToastProps) {
  // `visible` drives the mount/unmount; stays true for 300 ms after
  // `notification` clears so the CSS exit transition has time to finish.
  const [visible, setVisible] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification) {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setVisible(true);
    } else {
      exitTimer.current = setTimeout(() => setVisible(false), 300);
    }
    return () => { if (exitTimer.current) clearTimeout(exitTimer.current); };
  }, [notification]);

  if (!visible && !notification) return null;

  const isSuccess = notification?.type === "success";
  const isShowing = !!notification;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${isShowing ? "0" : "16px"})`,
        zIndex: 9999,
        transition: "transform 250ms ease, opacity 250ms ease",
        opacity: isShowing ? 1 : 0,
        pointerEvents: isShowing ? "auto" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.75rem 1rem 0.75rem 1.25rem",
          borderRadius: "var(--radius-full)",
          background: isSuccess ? "#065F46" : "#7F1D1D",
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          maxWidth: "90vw",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>
          {isSuccess ? "✓" : "⚠"}
        </span>

        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {notification?.message}
        </span>

        {/* Dismiss button — only renders when a handler is provided */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="إغلاق الإشعار"
            style={{
              marginLeft: 4,
              flexShrink: 0,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 2px",
              fontFamily: "var(--font-sans)",
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}