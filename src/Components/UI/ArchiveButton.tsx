"use client";

interface ArchiveButtonProps {
  onClick: () => void;
  label?: string;
  /** "floating" pins it bottom-right of the viewport; "inline" renders it in normal flow */
  variant?: "floating" | "inline";
}

export function ArchiveButton({
  onClick,
  label = "الأرشيف",
  variant = "floating",
}: ArchiveButtonProps) {
  const base: React.CSSProperties = {
    height: 44,
    padding: "0 1.25rem",
    borderRadius: "var(--radius-full)",
    border: "none",
    background: "#EA580C", // orange-600, matches existing danger/success accent pattern
    fontSize: 13,
    fontWeight: 700,
    color: "#FFF",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-sans)",
    boxShadow: "0 4px 14px rgba(234,88,12,.35)",
    whiteSpace: "nowrap",
    transition: "transform 150ms, box-shadow 150ms",
  };

  const floatingStyle: React.CSSProperties = variant === "floating"
    ? {
        position: "fixed",
        bottom: 24,
        insetInlineEnd: 24, // logical property — respects RTL/LTR automatically
        zIndex: 40,
      }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{ ...base, ...floatingStyle }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="5" rx="1" />
        <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
        <path d="M10 13h4" />
      </svg>
      {label}
    </button>
  );
}