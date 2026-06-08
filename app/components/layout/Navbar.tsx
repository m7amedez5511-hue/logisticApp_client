


const navLinks = [
  { label: "الرئيسية", active: true },
  { label: "المميزات" },
  { label: "كيف يعمل" },
  { label: "الأسعار" },
  { label: "الأسئلة الشائعة" },
];

export default function Navbar() {
  return (
    <nav dir="rtl" className="w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 text-right">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-white"
              aria-hidden="true"
            >
              <path d="M3 7h11l3 4h4l-2 4H8" />
              <circle cx="9" cy="18" r="1.7" fill="currentColor" stroke="none" />
              <circle cx="18" cy="18" r="1.7" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="text-[16px] font-extrabold text-slate-900">LogiFlow</span>
        </a>

        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className={`text-[13px] font-semibold transition hover:text-blue-600 ${
                link.active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="mr-auto flex items-center gap-2">
          <button className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            إنشاء  طلب جديد
          </button>
          <button className="flex h-[34px] items-center rounded-lg bg-blue-600 px-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700">
            تسجيل الدخول ←
          </button>
        </div>
      </div>
    </nav>
  );
}