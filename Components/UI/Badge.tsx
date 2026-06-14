interface BadgeProps {
  label: string;
  color?: "indigo" | "green" | "amber" | "red" | "slate";
}

const BADGE_COLORS: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  green:  "bg-emerald-100 text-emerald-700",
  amber:  "bg-amber-100 text-amber-700",
  red:    "bg-red-100 text-red-700",
  slate:  "bg-slate-100 text-slate-600",
};

export function Badge({ label, color = "slate" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_COLORS[color]}`}
    >
      {label}
    </span>
  );
}