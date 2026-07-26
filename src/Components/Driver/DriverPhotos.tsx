import { useEffect, useState } from "react";
import { Spinner } from "../UI";

export function PhotoCard({
  url,
  label,
}: {
  url?: string | null;
  label: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset error/loaded state when url changes so updated images get a fresh load attempt
  useEffect(() => {
    queueMicrotask(() => {
      setImgError(false);
      setImgLoaded(false);
    });
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
          position: "relative",
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
          <>
            {!imgLoaded && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-surface-muted)",
                }}
              >
                <Spinner size="sm" className="text-blue-600" />
              </div>
            )}
            {/* key={url} forces a full remount whenever the URL changes,
                clearing any stale error/loaded state from a previous load. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={url}
              src={url}
              alt={label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 200ms",
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <i className="ti ti-photo" style={{ fontSize: 32, color: "var(--color-text-hint)" }} aria-hidden="true" />
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