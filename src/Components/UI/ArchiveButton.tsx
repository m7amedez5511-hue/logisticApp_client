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
      <i className="ti ti-archive" style={{ fontSize: 16 }} aria-hidden="true" />
      {label}
    </button>
  );
}