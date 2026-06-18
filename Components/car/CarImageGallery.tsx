"use client";
// Components/Car/CarImageGallery.tsx
// Full-screen gallery modal for viewing, uploading and deleting car images.

import { useRef, useState } from "react";
import { Spinner } from "../UI";
import { useCarImages } from "../../hooks/useCars";
import { STAGE_MAP } from "../../types/car";
import type { Car, CarImage, ImageStage } from "../../types/car";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarImageGalleryProps {
  car: Car;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarImageGallery({ car, onClose }: CarImageGalleryProps) {
  const [stage,    setStage]    = useState<ImageStage>("GENERAL");
  const [sortBy,   setSortBy]   = useState<"asc" | "desc">("desc");
  const [lightbox, setLightbox] = useState<CarImage | null>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  const {
    images, loading, uploading, deleting, error, setError,
    uploadImages, deleteImage,
  } = useCarImages(car.id, sortBy);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await uploadImages(files, stage);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (imageId: string) => {
    const ok = await deleteImage(imageId);
    if (ok && lightbox?.id === imageId) setLightbox(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (lightbox) setLightbox(null);
      else onClose();
    }
  };

  const imgSrc = (img: CarImage) => img.url ?? `/api/proxy/car-photos/${img.image}`;

  return (
    <div
      role="dialog" aria-modal="true" aria-label="معرض صور المركبة"
      onKeyDown={handleKeyDown}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.5rem",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
            معرض الصور
          </p>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: "2px 0 0" }}>
            {car.manufacturer} {car.model} — {car.plateLetters} {car.plateNumber}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as "asc" | "desc")}
            style={{ height: 36, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12, color: "var(--color-text-secondary)", padding: "0 0.75rem", outline: "none", fontFamily: "var(--font-sans)" }}>
            <option value="desc">الأحدث أولاً</option>
            <option value="asc">الأقدم أولاً</option>
          </select>

          {/* Stage selector for upload */}
          <select value={stage} onChange={e => setStage(e.target.value as ImageStage)}
            style={{ height: 36, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12, color: "var(--color-text-secondary)", padding: "0 0.75rem", outline: "none", fontFamily: "var(--font-sans)" }}>
            <option value="GENERAL">عام</option>
            <option value="BEFORE">قبل</option>
            <option value="AFTER">بعد</option>
          </select>

          {/* Upload button */}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ height: 36, padding: "0 1rem", borderRadius: "var(--radius-md)", border: "none", background: uploading ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
            {uploading
              ? <><Spinner size="sm" className="text-white" /> جارٍ الرفع…</>
              : <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  رفع صور
                </>
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />

          {/* Close */}
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 20, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "0.75rem 1.5rem", background: "#FEF2F2", borderBottom: "1px solid #FECACA", fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
          ⚠ {error}
          <button onClick={() => setError(null)} style={{ marginRight: 8, fontSize: 14, background: "none", border: "none", color: "#DC2626", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* ── Gallery Grid ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0" }}>
            <Spinner size="lg" />
            <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>جارٍ تحميل الصور…</span>
          </div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p style={{ fontSize: 15, color: "var(--color-text-muted)", fontWeight: 600 }}>لا توجد صور بعد</p>
            <p style={{ fontSize: 13, color: "var(--color-text-hint)", marginTop: 4 }}>
              اضغط على &quot;رفع صور&quot; لإضافة أولى الصور لهذه المركبة.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {images.map(img => {
              const stageInfo = STAGE_MAP[img.stage ?? "GENERAL"] ?? STAGE_MAP.GENERAL;
              const isDeleting = deleting === img.id;
              return (
                <div key={img.id} style={{
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-card)",
                  opacity: isDeleting ? 0.5 : 1,
                  transition: "opacity 200ms",
                }}>
                  <div style={{ position: "relative", paddingBottom: "70%", cursor: "pointer" }} onClick={() => setLightbox(img)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc(img)}
                      alt={`صورة ${stageInfo.label}`}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.target as HTMLImageElement).src = "/file.svg"; }}
                    />
                    <span style={{
                      position: "absolute", top: 8, right: 8,
                      borderRadius: "var(--radius-full)",
                      background: stageInfo.bg, color: stageInfo.color,
                      padding: "0.2rem 0.625rem",
                      fontSize: 10, fontWeight: 700,
                      boxShadow: "0 1px 4px rgba(0,0,0,.12)",
                    }}>
                      {stageInfo.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderTop: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {new Date(img.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                    </span>
                    <button type="button" onClick={() => handleDelete(img.id)} disabled={isDeleting} aria-label="حذف الصورة"
                      style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDeleting
                        ? <Spinner size="sm" className="text-red-600" />
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc(lightbox)}
            alt="عرض مكبَّر"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "var(--radius-lg)", objectFit: "contain" }}
            onClick={e => e.stopPropagation()}
            onError={e => { (e.target as HTMLImageElement).src = "/file.svg"; }}
          />
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}