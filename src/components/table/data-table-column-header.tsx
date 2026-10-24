"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) {
    return <span className={cn("text-xs font-medium uppercase tracking-wide text-zinc-500", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-900",
        className,
      )}
    >
      {title}
      {sorted === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
      {sorted === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
      {!sorted && <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-300" />}
    </button>
  );
}
