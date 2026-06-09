import Logo from "@/utils/logo";
import Link from "next/link";



const navLinks = [
  { label: "الرئيسية", active: true },
  { label: "المميزات" },
  { label: "كيف يعمل" },
  { label: "الأسعار" },
  { label: "الأسئلة الشائعة" },
];

export default function Navbar() {
  return (
    <nav dir="rtl" className="w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm">x 
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3 text-right">
          <Logo />
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
          <Link href="/NewOrder" className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            إنشاء  طلب جديد
          </Link>
          <Link href="/login" className="flex h-[34px] items-center rounded-lg bg-blue-600 px-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700">
            تسجيل الدخول ←
          </Link>
        </div>
      </div>
    </nav>
  );
}