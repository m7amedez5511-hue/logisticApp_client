# Slash.sa — Fleet & Logistics Management Platform

A full-featured web platform for managing fleet and logistics operations, built **Arabic-first** with complete **RTL** support and targeted at the Saudi market. The platform covers vehicle, driver, branch, order, and trip management along with a maintenance log, all backed by role-based dashboards (admin / client / field user).

## Prerequisites

- Node.js 20.9 or later
- npm (or any compatible package manager)

## Tech Stack

| Layer            | Technology                                              |
| ---------------- | -------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                                  |
| Language         | TypeScript                                                |
| Styling          | Tailwind CSS v4                                           |
| Forms & Validation | react-hook-form + yup                                  |
| Icons            | lucide-react (marketing pages) / Tabler Icons Webfont (dashboard) |
| Authentication   | JWT + HttpOnly cookie + protective middleware             |

## Project Structure (overview)

```
app/
├── (marketing pages)     home, features/app, how_it_works, pricing, faq
├── dashboard/            protected dashboard (guarded by middleware)
│   ├── cars, drivers, orders, trips, clients, branches, roles, audit, users
├── login, register       authentication pages
├── api/proxy/[...path]   unified proxy for all backend requests
└── components/layout     Navbar, Sidebar, Topbar (manually used across pages)

src/
├── Components/           dashboard components (organized per module: Car, Driver, Order...)
├── hooks/                data-fetching and mutation logic (Create/Update/Delete) per module
├── services/             API call layer (each module has its own service)
├── types/                TypeScript type definitions per data model
├── validations/          yup schemas for form validation
└── lib/                  helper functions (auth, session, formatters, order-status)
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command         | Description                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Run the development server (Webpack)  |
| `npm run build` | Build the production bundle           |
| `npm run start` | Run the built production version      |
| `npm run lint`  | Lint the codebase with ESLint         |

## Deployment Notes

- The platform is built on the Next.js App Router and runs on any environment that supports Node.js 20.9+ (e.g., Vercel).
- All backend requests are routed through `app/api/proxy/[...path]/route.ts` — make sure the backend base URL is configured correctly before deploying.
- Authentication relies on an HttpOnly cookie set via `app/api/auth/set-cookie` and cleared via `app/api/clear-cookie`. Make sure `Secure` is enabled in production (this happens automatically based on `NODE_ENV`).
- Route-level protection is handled by `middleware.ts` — check its `matcher` config whenever you add new protected routes.

## Contributing

1. Create a new branch from `main` with a clear name describing the change (e.g., `feature/car-maintenance-filters`).
2. Follow the existing code conventions: RTL-first, CSS custom property tokens instead of hardcoded colors, and the hooks/services/types/validations structure for each new module.
3. Run `npm run lint` before opening a Pull Request.
4. Write a clear description of the change and link it to any related issue.

## License

All rights reserved © 2026 Slash.sa