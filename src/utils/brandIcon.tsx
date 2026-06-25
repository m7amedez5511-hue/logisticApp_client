function BrandIcon({ size = 32, bg = "rgba(255,255,255,0.15)" }: { size?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, background: bg, borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none"
        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
        <rect x="9" y="11" width="14" height="10" rx="2"/>
        <circle cx="12" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
      </svg>
    </div>
  );
}


export default BrandIcon