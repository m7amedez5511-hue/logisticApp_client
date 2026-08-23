import { FC } from "react";
import Link from "next/link";

interface LogoProps {
  white?: boolean;
  href?: string;
}

const Logo: FC<LogoProps> = ({ white = false, href }) => {
  const content = (
    <div className="flex items-center gap-2">
      <div style={{
        width: 32, height: 32,
        background: white ? "rgba(255,255,255,0.15)" : "#2563EB",
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
          <rect x="9" y="11" width="14" height="10" rx="2"/>
          <circle cx="12" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
        </svg>
      </div>
      <span style={{
        fontWeight: 700,
        fontSize: 15,
        color: white ? "#FFFFFF" : "#0F172A",
      }}>
        Slash.sa
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;