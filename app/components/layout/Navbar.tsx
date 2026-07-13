import Logo from "@/src/utils/logo";
import Link from "next/link";

const navLinks = [
  { label: "الرئيسية", href: "/home", active: true },
  { label: "المميزات", href: "/features" },
  { label: "كيف يعمل", href: "/how_work" },
  { label: "الأسعار", href: "/prices" },
  { label: "الأسئلة الشائعة", href: "/frequently_asked_questions" },
];

export default function Navbar() {
  return (
    <nav dir="rtl" className="w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-right">
          <Logo />
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[13px] font-semibold transition hover:text-blue-600 ${
                link.active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <Link href="/login" className="flex h-[34px] items-center rounded-lg bg-blue-600 px-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700">
            تسجيل الدخول ←
          </Link>
        </div>
      </div>
    </nav>
  );
}