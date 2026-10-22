"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 rows" },
  { value: "25", label: "25 rows" },
  { value: "50", label: "50 rows" },
];

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const rowCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  const firstRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(rowCount, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">
        {rowCount === 0 ? "No results" : `${firstRow}–${lastRow} of ${rowCount}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="w-32">
          <Dropdown
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(value) => table.setPageSize(Number(value))}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-sm text-zinc-600">
            Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
