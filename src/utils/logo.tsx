import { FC } from "react";

const Logo: FC = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-[#1A73E8] rounded-lg flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
        <rect x="9" y="11" width="14" height="10" rx="2" />
        <circle cx="12" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
    </div>
    <span className="font-bold text-[15px] text-[#111827]">Slash.sa</span>
  </div>
);

export default Logo;