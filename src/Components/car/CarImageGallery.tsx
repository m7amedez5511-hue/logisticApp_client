"use client";

import { useRef, useState } from "react";
import { Alert, Button, EmptyState, IconBtn, Select, Spinner } from "../UI";
import { useCarImages } from "@/src/hooks/useCars";
import { STAGE_MAP } from "@/src/types/car";
import type { Car, CarImage, ImageStage } from "@/src/types/car";

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
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
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

  const markLoaded = (id: string) =>
    setLoadedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const openLightbox = (img: CarImage) => {
    setLightbox(img);
    setLightboxLoaded(false);
  };

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
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "asc" | "desc")}
            wrapperClassName="w-auto"
            className="h-9"
          >
            <option value="desc">الأحدث أولاً</option>
            <option value="asc">الأقدم أولاً</option>
          </Select>

          {/* Stage selector for upload */}
          <Select
            value={stage}
            onChange={e => setStage(e.target.value as ImageStage)}
            wrapperClassName="w-auto"
            className="h-9"
          >
            <option value="GENERAL">عام</option>
            <option value="BEFORE">قبل</option>
            <option value="AFTER">بعد</option>
          </Select>

          {/* Upload button */}
          <Button
            type="button"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
          >
            {!uploading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            {uploading ? "جارٍ الرفع…" : "رفع صور"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />

          {/* Close */}
          <IconBtn
            title="إغلاق"
            color="var(--color-text-muted)"
            bg="var(--color-surface)"
            borderColor="var(--color-border)"
            onClick={onClose}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>×</span>
          </IconBtn>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "0.75rem 1.5rem" }}>
          <Alert type="error" message={error} onClose={() => setError(null)} />
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
          <EmptyState
            icon="📸"
            title="لا توجد صور بعد"
            description='اضغط على "رفع صور" لإضافة أولى الصور لهذه المركبة.'
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {images.map(img => {
              const stageInfo = STAGE_MAP[img.stage ?? "GENERAL"] ?? STAGE_MAP.GENERAL;
              const isDeleting = deleting === img.id;
              const isLoaded = loadedIds.has(img.id);
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
                  <div style={{ position: "relative", paddingBottom: "70%", cursor: "pointer", background: "var(--color-surface-muted)" }} onClick={() => openLightbox(img)}>
                    {!isLoaded && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--color-surface-muted)",
                      }}>
                        <Spinner size="sm" className="text-blue-600" />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc(img)}
                      alt={`صورة ${stageInfo.label}`}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                        opacity: isLoaded ? 1 : 0,
                        transition: "opacity 200ms",
                      }}
                      onLoad={() => markLoaded(img.id)}
                      onError={e => { (e.target as HTMLImageElement).src = "/file.svg"; markLoaded(img.id); }}
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
                    <IconBtn
                      title="حذف الصورة"
                      color="#DC2626"
                      bg="#FEF2F2"
                      borderColor="#FECACA"
                      onClick={() => handleDelete(img.id)}
                    >
                      {isDeleting
                        ? <Spinner size="sm" className="text-red-600" />
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                      }
                    </IconBtn>
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
          {!lightboxLoaded && (
            <div style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner size="lg" className="text-white" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc(lightbox)}
            alt="عرض مكبَّر"
            style={{
              maxWidth: "90vw", maxHeight: "90vh", borderRadius: "var(--radius-lg)", objectFit: "contain",
              opacity: lightboxLoaded ? 1 : 0,
              transition: "opacity 200ms",
            }}
            onClick={e => e.stopPropagation()}
            onLoad={() => setLightboxLoaded(true)}
            onError={e => { (e.target as HTMLImageElement).src = "/file.svg"; setLightboxLoaded(true); }}
          />
          {/* Kept custom — a circular translucent button on a dark overlay,
              a different visual context than IconBtn's light-surface style. */}
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}