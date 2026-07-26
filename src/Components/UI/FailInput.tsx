import React from "react";

const inputBase: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  fontSize: 13,
  color: "var(--color-text-primary)",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

export function FileInput({
  label,
  current,
  onChange,
}: {
  label: string;
  current: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        style={{
          ...inputBase,
          padding: "0.35rem 0.75rem",
          height: "auto",
          cursor: "pointer",
        }}
      />
      {current && (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {current.name}
        </span>
      )}
    </label>
  );
}
