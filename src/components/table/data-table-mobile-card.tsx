"use client";

import { flexRender, type Row } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getColumnLabel } from "./types";

export function DataTableMobileCard<TData>({
  row,
  renderSubRow,
}: {
  row: Row<TData>;
  renderSubRow?: (row: Row<TData>) => React.ReactNode;
}) {
  // Skip the select/expand helper columns here — they get their own treatment below.
  const cells = row.getVisibleCells().filter((cell) => !["select", "expand"].includes(cell.column.id));

  return (
    <div className="border-b border-zinc-100 p-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {cells.map((cell) => {
            const label = getColumnLabel(cell.column.columnDef) || cell.column.id;
            return (
              <div key={cell.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span>
                <span className="text-right text-zinc-900">{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
              </div>
            );
          })}
        </div>

        {row.getCanExpand() && (
          <button
            type="button"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
            className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", row.getIsExpanded() && "rotate-180")} />
          </button>
        )}
      </div>

      {row.getIsExpanded() && renderSubRow && <div className="mt-3 border-t border-zinc-100 pt-3">{renderSubRow(row)}</div>}
    </div>
  );
}
