import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <p className="text-sm text-zinc-600">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
    </div>
  );
}
