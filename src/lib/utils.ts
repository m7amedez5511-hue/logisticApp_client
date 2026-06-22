
// Minimal class-name merger used by UI components.
// Install `clsx` and `tailwind-merge` for production:
//   npm i clsx tailwind-merge
// Then replace the body with:
//   import { clsx } from "clsx"; import { twMerge } from "tailwind-merge";
//   export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}