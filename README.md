# Slash.sa — منصة إدارة الأسطول واللوجستيات

منصة ويب متكاملة لإدارة عمليات الأسطول واللوجستيات، مبنية بلغة عربية أولًا (Arabic-first)
باتجاه RTL كامل، وموجهة للسوق السعودي. تشمل المنصة إدارة المركبات والسائقين والفروع
والطلبات والرحلات وسجل الصيانة، مع لوحات تحكم منفصلة حسب دور المستخدم (مشرف / عميل / مستخدم ميداني).

## المتطلبات الأساسية

- Node.js 20.9 أو أحدث
- npm (أو أي package manager متوافق)

## التقنيات المستخدمة

| الطبقة              | التقنية                                   |
| -------------------- | ------------------------------------------ |
| الإطار               | Next.js 16 (App Router)                    |
| اللغة                | TypeScript                                 |
| التنسيق              | Tailwind CSS v4                            |
| النماذج والتحقق      | react-hook-form + yup                      |
| الأيقونات            | lucide-react (صفحات التسويق) / Tabler Icons Webfont (لوحة التحكم) |
| المصادقة             | JWT + HttpOnly cookie + middleware للحماية |

## هيكل المشروع (مختصر)
app/
├── (صفحات تسويقية)      home, features/app, how_work, prices, frequently_asked_questions
├── dashboard/            لوحة التحكم (محمية بواسطة middleware)
│   ├── cars, drivers, orders, trips, clients, branches, roles, audit, users
├── login, register       صفحات المصادقة
├── api/proxy/[...path]   بروكسي موحّد لكل طلبات الـ backend
└── components/layout     Navbar, Sidebar, Topbar (تُستخدم عبر الصفحات يدويًا)
src/
├── Components/           مكوّنات لوحة التحكم (مقسّمة حسب الوحدة: Car, Driver, Order...)
├── hooks/                منطق جلب البيانات والطفرات (Create/Update/Delete) لكل وحدة
├── services/              طبقة استدعاء الـ API (كل وحدة لها service منفصل)
├── types/                تعريفات TypeScript لكل نموذج بيانات
├── validations/          مخططات yup للتحقق من صحة النماذج
└── lib/                  دوال مساعدة (auth, session, formatters, order-status)
## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## الأوامر المتاحة

| الأمر            | الوصف                                  |
| ---------------- | --------------------------------------- |
| `npm run dev`    | تشغيل بيئة التطوير (Webpack)            |
| `npm run build`  | بناء نسخة الإنتاج                      |
| `npm run start`  | تشغيل نسخة الإنتاج المبنية              |
| `npm run lint`   | فحص الكود بواسطة ESLint                |

## ملاحظات النشر (Deployment)

- المنصة مبنية على Next.js App Router وتعمل على أي بيئة تدعم Node.js 20.9+ (مثل Vercel).
- كل طلبات الـ backend تمر عبر `app/api/proxy/[...path]/route.ts`، فتأكد من ضبط الـ backend base URL بشكل صحيح قبل النشر.
- التوثيق (Authentication) يعتمد على HttpOnly cookie تُضبط عبر `app/api/auth/set-cookie`، وتُمسح عبر `app/api/clear-cookie` — تأكد من تفعيل `Secure` في بيئة الإنتاج (يتم تلقائيًا حسب `NODE_ENV`).
- الحماية على مستوى الراوت تتم عبر `middleware.ts` — راجع الـ `matcher` فيه عند إضافة مسارات محمية جديدة.

## المساهمة (Contributing)

1. أنشئ فرعًا جديدًا من `main` باسم واضح للتغيير (مثال: `feature/car-maintenance-filters`).
2. اتبع نفس أسلوب الكود الموجود: RTL-first، CSS custom property tokens بدل الألوان الثابتة، وهيكلة hooks/services/types/validations لكل وحدة جديدة.
3. شغّل `npm run lint` قبل فتح Pull Request.
4. اكتب وصفًا واضحًا للتغيير وربطه بأي تذكرة (issue) ذات صلة.

## الترخيص

جميع الحقوق محفوظة © 2026 Slash.sa