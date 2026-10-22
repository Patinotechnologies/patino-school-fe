"use client";

import type { Table } from "@tanstack/react-table";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getColumnLabel } from "./types";

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = "Search…",
  filters,
}: {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra filter controls (dropdowns, etc.) rendered on the same row as search — the table itself stays unaware of what they are. */
  filters?: React.ReactNode;
}) {
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9"
          />
        </div>
        {filters}
      </div>

      {hideableColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {hideableColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                onSelect={(e) => e.preventDefault()}
              >
                {getColumnLabel(column.columnDef) || column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
