// ── Icon button ───────────────────────────────────────────────────────────────
// Kept custom rather than swapped for <Button/>: Button's variants only cover
// primary/secondary/ghost/danger (one accent color each) and its size scale
// (h-8/h-10/h-11 with horizontal padding) isn't built for a fixed 32×32
// square icon chip. Forcing it here would misshape the button and collapse
// the view/edit/delete green/blue/red color-coding into one variant.
export function IconBtn({ onClick, title, color, bg, borderColor, children }: {
  onClick: () => void; title: string; color: string; bg: string; borderColor: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        width: 32, height: 32, borderRadius: "var(--radius-md)",
        border: `1px solid ${borderColor}`, background: bg, color,
        cursor: "pointer", display: "inline-flex", alignItems: "center",
        justifyContent: "center", transition: "opacity 150ms",
      }}>
      {children}
    </button>
  );
}