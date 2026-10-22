import "@tanstack/react-table";

// Lets any column declare a plain-text label for places that need one (the
// column-visibility menu, the auto-generated mobile card) — needed whenever
// `header` is a render function (e.g. DataTableColumnHeader) rather than a string.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match the library's own ColumnMeta<TData, TValue> signature
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

export function getColumnLabel(columnDef: { header?: unknown; meta?: { label?: string } }): string {
  if (columnDef.meta?.label) return columnDef.meta.label;
  if (typeof columnDef.header === "string") return columnDef.header;
  return "";
}
