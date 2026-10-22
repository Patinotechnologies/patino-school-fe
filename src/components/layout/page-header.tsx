import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
