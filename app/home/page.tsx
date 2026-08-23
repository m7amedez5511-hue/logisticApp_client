import Link from "next/link";
import {
  Truck,
  Clock,
  Users,
  ShieldCheck,
  BarChart3,
  MapPin,
  PackageCheck,
} from "lucide-react";


const stats = [
  { label: "الطلبات النشطة", value: "48", color: "text-blue-600" },
  { label: "مُسلَّم هذا الشهر", value: "312", color: "text-emerald-600" },
  { label: "العملاء المسجلون", value: "127", color: "text-slate-900" },
];

type Tone = "blue" | "emerald" | "amber";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
};

const features: { icon: typeof Truck; title: string; text: string; tone: Tone }[] = [
  {
    icon: Truck,
    title: "إدارة الطلبات",
    text: "إنشاء الطلبات وتتبعها وتحديثها في الوقت الفعلي.",
    tone: "blue",
  },
  {
    icon: Clock,
    title: "التتبع المباشر",
    text: "راقب تقدم الاستلام والتسليم عبر خريطة مرئية.",
    tone: "emerald",
  },
  {
    icon: Users,
    title: "صلاحيات حسب الدور",
    text: "لوحات تحكم منفصلة للمشرفين والعملاء والمستخدمين.",
    tone: "amber",
  },
  {
    icon: ShieldCheck,
    title: "أمان بمستوى المؤسسات",
    text: "تشفير متقدّم وصلاحيات دقيقة لكل مستخدم على حدة.",
    tone: "blue",
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات",
    text: "تقارير يومية للسائقين والرحلات وسجل صيانة المركبات.",
    tone: "emerald",
  },
  {
    icon: MapPin,
    title: "إدارة الفروع",
    text: "أدر عناوين متعددة وفروع مرتبطة بأسطولك بسهولة.",
    tone: "amber",
  },
];

const roles = [
  {
    tone: "dark",
    tag: "مشرف",
    title: "تحكم كامل",
    items: [
      "عرض جميع طلبات العملاء",
      "تحديث حالات الطلبات",
      "إدارة العملاء والسائقين",
      "سجل التدقيق",
      "تعيين الرحلات",
    ],
  },
  {
    tone: "blue",
    tag: "عميل",
    title: "طلباتي",
    items: [
      "إضافة طلبات جديدة",
      "تتبع الشحنات النشطة",
      "عرض سجل الطلبات",
      "إدارة العناوين",
      "التواصل مع الدعم",
    ],
  },
  {
    tone: "green",
    tag: "مستخدم",
    title: "وصول ميداني",
    items: [
      "عرض الرحلات المعينة",
      "تحديث حالة التسليم",
      "الملف الشخصي",
      "إعدادات الإشعارات",
      "تفضيلات التطبيق",
    ],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#ECEEF2] text-slate-900" dir="rtl">
      

      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] text-white">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
          <article className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[13px] text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              منصة سعودية لإدارة الأسطول واللوجستيات
            </span>
            <h1 className="max-w-xl text-[32px] font-extrabold leading-tight text-white lg:text-[42px]">
              إدارة لوجستية سهلة، توصيل مضمون في كل مرة.
            </h1>
            <p className="max-w-xl text-[15px] leading-7 text-white/75">
              أدِر كل شحنة وعميل وسائق ومركبة من منصة واحدة آمنة، مصممة خصيصًا
              لفرق العمليات في المملكة العربية السعودية.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-xl border border-white/30 bg-white/15 px-5 text-[13px] font-semibold text-white shadow-md backdrop-blur"
              >
                تسجيل الدخول للوحة التحكم
              </Link>
             
            </div>
          </article>

          <aside className="w-full max-w-md rounded-2xl border border-white/20 bg-white/12 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
              تغذية الطلبات المباشرة
            </p>
            <div className="mt-5 space-y-3">
              {[
                ["SHIP-202606-00142", "في الطريق", "bg-amber-100 text-amber-800"],
                ["SHIP-202606-00139", "تم التسليم", "bg-emerald-100 text-emerald-800"],
                ["SHIP-202606-00145", "تم الإنشاء", "bg-blue-100 text-blue-800"],
              ].map(([code, status, badge]) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/8 px-4 py-3"
                >
                  <span className="font-mono text-[12px] text-white/90">{code}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badge}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-white/40">
              <span>تم التحديث للتو</span>
              <span className="text-emerald-300">● النظام متصل</span>
            </div>
          </aside>
        </div>
      </section>

      {/* Stats + Features */}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-[32px] font-extrabold ${item.color}`}>
                {item.value}
              </p>
            </article>
          ))}
        </div>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-blue-600">
            المميزات الأساسية
          </p>
          <h2 className="mt-2 text-[22px] font-extrabold text-slate-900">
            كل ما يحتاجه فريق اللوجستيك
          </h2>
          <p className="mt-2 text-[14px] text-slate-500">
            من إدارة الطلبات إلى التتبع المباشر، كل شيء في مكان واحد.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[feature.tone]}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500">{feature.text}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-6">
            
          </div>
        </article>
      </section>

      {/* Roles */}
      <section className="bg-[#ECEEF2] py-2">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
          <article className="text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-blue-600">
              أدوار المستخدمين
            </p>
            <h2 className="mt-2 text-[22px] font-extrabold text-slate-900">
              منصة واحدة، ثلاثة مداخل
            </h2>
          </article>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <article
                key={role.title}
                className={`rounded-2xl border p-5 shadow-sm ${role.tone === "dark" ? "border-slate-800 bg-slate-950 " : role.tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${role.tone === "dark" ? "bg-slate-800 text-slate-200" : role.tone === "blue" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {role.tag}
                </span>
                <h3 className="mt-3 text-[18px] font-extrabold">{role.title}</h3>
                <ul className="mt-4 space-y-2 text-[13px] leading-6">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-[12px]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <article className="flex flex-col items-center gap-4 rounded-3xl bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] p-10 text-center text-white shadow-sm">
          <PackageCheck className="h-10 w-10" strokeWidth={1.8} />
          <h2 className="text-[22px] font-extrabold">جاهز تبدأ توصيل أسرع وأذكى؟</h2>
          <p className="max-w-xl text-[14px] text-white/80">
            انضم إلى فرق اللوجستيك التي تدير عملياتها بثقة عبر منصتنا.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-[13px] font-semibold text-blue-700 shadow-md"
            >
              ابدأ الآن
            </Link>
           
          </div>
        </article>
      </section>

      
    </main>
  );
}