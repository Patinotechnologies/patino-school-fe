"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ExpandedState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableMobileCard } from "./data-table-mobile-card";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Shows skeleton rows instead of data — e.g. while a query is in flight. */
  isLoading?: boolean;
  /** Renders expanded content below a row (desktop) or inline in its card (mobile). Adds an expand toggle automatically. */
  renderSubRow?: (row: Row<TData>) => React.ReactNode;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  /** Hides the search box + column-visibility menu, for a bare/minimal table. */
  hideToolbar?: boolean;
  /** Extra filter controls (dropdowns, etc.) rendered on the same row as search, right after it. */
  toolbarFilters?: React.ReactNode;
  /** Adds a checkbox column and reports the selected rows' original data back to the caller — e.g. for a bulk-action bar rendered outside the table. */
  enableRowSelection?: boolean;
  onSelectedRowsChange?: (selected: TData[]) => void;
  /** Keys selection by a stable id (e.g. row.id) instead of row index — important when the data array can reorder/refetch. */
  getRowId?: (row: TData) => string;
  /** Makes rows clickable (e.g. navigate to a detail page) — rendered with a pointer cursor and hover state. */
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  renderSubRow,
  searchPlaceholder,
  pageSize = 10,
  emptyTitle = "No results",
  emptyDescription = "Nothing to show yet.",
  emptyIcon: EmptyIcon = Inbox,
  hideToolbar,
  toolbarFilters,
  enableRowSelection,
  onSelectedRowsChange,
  getRowId,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    let cols = columns;
    if (enableRowSelection) {
      const selectColumn: ColumnDef<TData, unknown> = {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label="Select all"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
      };
      cols = [selectColumn, ...cols];
    }
    if (renderSubRow) {
      const expandColumn: ColumnDef<TData, unknown> = {
        id: "expand",
        header: () => null,
        size: 32,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                row.getToggleExpandedHandler()();
              }}
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", row.getIsExpanded() && "rotate-180")} />
            </button>
          ) : null,
      };
      cols = [expandColumn, ...cols];
    }
    return cols;
  }, [columns, renderSubRow, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnVisibility, globalFilter, expanded, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getRowId,
    getRowCanExpand: () => Boolean(renderSubRow),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: { pagination: { pageSize } },
  });

  React.useEffect(() => {
    if (!onSelectedRowsChange) return;
    onSelectedRowsChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the selection itself changes
  }, [rowSelection]);

  const rows = table.getRowModel().rows;
  const leafColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {!hideToolbar && (
        <DataTableToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={searchPlaceholder}
          filters={toolbarFilters}
        />
      )}

      {/* Desktop / tablet: real table, horizontally scrollable if it overflows */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-100">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3" style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-zinc-50 last:border-0">
                  {Array.from({ length: leafColumnCount }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={leafColumnCount} className="px-5 py-16">
                  <EmptyState title={emptyTitle} description={emptyDescription} icon={EmptyIcon} />
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-b border-zinc-50 last:border-0 hover:bg-zinc-50",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4 text-zinc-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderSubRow && (
                    <tr className="border-b border-zinc-50 bg-zinc-50/60 last:border-0">
                      <td colSpan={leafColumnCount} className="px-5 py-4">
                        {renderSubRow(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row */}
      <div className="md:hidden">
        {isLoading &&
          Array.from({ length: pageSize }).map((_, i) => (
            <div key={`skeleton-card-${i}`} className="space-y-2 border-b border-zinc-100 p-4 last:border-0">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}

        {!isLoading && rows.length === 0 && (
          <div className="px-5 py-16">
            <EmptyState title={emptyTitle} description={emptyDescription} icon={EmptyIcon} />
          </div>
        )}

        {!isLoading &&
          rows.map((row) => (
            <DataTableMobileCard
              key={row.id}
              row={row}
              renderSubRow={renderSubRow}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            />
          ))}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}
