import { useEffect, useState } from "react";

export function PhotoCard({
  url,
  label,
}: {
  url?: string | null;
  label: string;
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error when url changes so updated images get a fresh load attempt
  useEffect(() => {
    setImgError(false);
  }, [url]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-text-muted)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-hint)"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      {url && !imgError && (
        <a
          href={url} 
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "#2563EB",
            textDecoration: "underline",
            textAlign: "center",
          }}
        >
          عرض الصورة ↗
        </a>
      )}
    </div>
  );
}
