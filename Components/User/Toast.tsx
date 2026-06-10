"use client";

import { useEffect, useState } from "react";
import type { Notification } from "../../hooks/useUser";

interface ToastProps {
  notification: Notification | null;
}

export function Toast({ notification }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
    } else {
      // dismiss after 250ms to allow exit animation
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [notification]);

  if (!visible && !notification) return null;

  const isSuccess = notification?.type === "success";

  return (
    <div
      role="status" aria-live="polite" aria-atomic="true"
      style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: `translateX(-50%) translateY(${notification ? "0" : "16px"})`,
        zIndex: 9999,
        transition: "transform 250ms ease, opacity 250ms ease",
        opacity: notification ? 1 : 0,
        pointerEvents: "none",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.75rem 1.25rem",
        borderRadius: "var(--radius-full)",
        background: isSuccess ? "#065F46" : "#7F1D1D",
        color: "#FFFFFF",
        fontSize: 13, fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        maxWidth: "90vw", whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
      }}>
        {/* icon */}
        <span style={{ fontSize: 16 }}>{isSuccess ? "✓" : "⚠"}</span>
        <span>{notification?.message}</span>
      </div>
    </div>
  );
}