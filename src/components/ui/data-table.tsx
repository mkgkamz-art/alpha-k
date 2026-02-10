"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── Table Root ── */
export interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full overflow-x-auto border border-border-default rounded-[8px]",
        className
      )}
      {...props}
    >
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  )
);
DataTable.displayName = "DataTable";

/* ── Table Head ── */
export const TableHead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-bg-tertiary", className)}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/* ── Table Body ── */
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
));
TableBody.displayName = "TableBody";

/* ── Table Row ── */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border-default/30 transition-colors",
        hoverable && "hover:bg-bg-secondary/50 cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

/* ── Table Header Cell ── */
export interface TableHeaderCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  align?: "left" | "center" | "right";
}

export const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(
  (
    { className, sortable, sorted, align = "left", children, onClick, ...props },
    ref
  ) => (
    <th
      ref={ref}
      onClick={sortable ? onClick : undefined}
      className={cn(
        "px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary whitespace-nowrap",
        align === "center" && "text-center",
        align === "right" && "text-right",
        sortable && "cursor-pointer select-none hover:text-text-primary transition-colors",
        className
      )}
      aria-sort={
        sorted === "asc"
          ? "ascending"
          : sorted === "desc"
            ? "descending"
            : undefined
      }
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted === "asc" && <span aria-hidden="true">↑</span>}
        {sorted === "desc" && <span aria-hidden="true">↓</span>}
      </span>
    </th>
  )
);
TableHeaderCell.displayName = "TableHeaderCell";

/* ── Table Cell ── */
export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  mono?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", mono, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 text-text-primary",
        align === "center" && "text-center",
        align === "right" && "text-right",
        mono && "font-num",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";
