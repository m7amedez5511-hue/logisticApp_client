import Logo from "@/src/utils/logo";
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
    <nav dir="rtl" className="w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm">
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

        {/*
          Was `mr-auto`. `mr-*` is a PHYSICAL Tailwind utility — it means
          "margin-right" no matter what `dir` says, so it would have
          pinned the login button to the visual left in both LTR and
          RTL, fighting the rest of the nav. `ms-auto` ("margin-inline-
          start: auto") pushes against the start edge instead, which is
          right in RTL and left in LTR — it tracks `dir` automatically.
          This is the single most common RTL bug: Tailwind's l/r-prefixed
          utilities (ml, mr, pl, pr, left-, right-, text-left, text-right,
          rounded-l, rounded-r, border-l, border-r) are all physical and
          need their logical (s/e) equivalents — ms, me, ps, pe, start-,
          end-, text-start, text-end, rounded-s, rounded-e, border-s,
          border-e — anywhere direction should matter.
        */}
        <div className="ms-auto flex items-center gap-2">
          <Link href="/login" className="flex h-[34px] items-center rounded-lg bg-blue-600 px-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700">
            تسجيل الدخول ←
          </Link>
        </div>
      </div>
    </nav>
  );
}