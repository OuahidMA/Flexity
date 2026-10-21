/**
 * Shared table used by every dashboard list (members, coaches, routines,
 * exercises, progress logs).
 *
 * Wraps TanStack Table with client-side sorting, filtering, pagination, column
 * visibility, and row selection. Optional `statusColumnId` enables a faceted
 * status filter, and `onDelete` enables bulk deletion with a confirmation
 * dialog. Data is expected to be fully loaded; filtering/sorting happen in the
 * browser.
 */
"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleX,
  Columns3,
  Ellipsis,
  Funnel,
  ListFilter,
  Trash,
} from "lucide-react"

import { cn } from "cn"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Per-row overflow menu.
 *
 * @param {object} props
 * @param {Array<{
 *   label?: string,
 *   icon?: React.ComponentType,
 *   onClick?: () => void,
 *   destructive?: boolean,
 *   separator?: boolean,
 * }>} [props.items] - Actions in display order; `separator` inserts a divider.
 * @param {string} [props.label] - Accessible trigger label.
 * @returns {JSX.Element} Dropdown trigger and menu.
 */
export function RowActions({ items = [], label = "Open menu" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            className="shadow-none"
            aria-label={label}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) =>
          item.separator ? (
            <DropdownMenuSeparator key={`separator-${index}`} />
          ) : (
            <DropdownMenuItem
              key={item.label}
              variant={item.destructive ? "destructive" : "default"}
              onClick={item.onClick}
            >
              {item.icon ? <item.icon /> : null}
              <span>{item.label}</span>
              {item.shortcut ? (
                <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Render a full dashboard table with toolbar and pagination.
 *
 * @param {object} props
 * @param {Array<object>} props.columns - TanStack column definitions.
 * @param {Array<object>} props.data - Rows to display.
 * @param {(rows: Array<object>) => void|Promise<void>} [props.onDelete] - Called
 *   with selected originals; enables the bulk-delete toolbar and row selection.
 * @param {string} [props.searchColumnId="name"] - Column targeted by the text filter.
 * @param {string} [props.statusColumnId] - Column whose unique values power the
 *   faceted status popover.
 * @param {string} [props.searchPlaceholder] - Text filter placeholder/label.
 * @param {string} [props.emptyMessage] - Message when no rows match.
 * @param {React.ReactNode} [props.toolbar] - Extra controls in the left toolbar.
 * @param {React.ReactNode} [props.actions] - Primary actions on the right.
 * @param {Array<{ id: string, desc: boolean }>} [props.initialSorting] - Initial
 *   sort; defaults to ascending on `searchColumnId`.
 * @returns {JSX.Element} The table UI.
 */
export function DataTable({
  columns,
  data,
  onDelete,
  searchColumnId = "name",
  statusColumnId,
  searchPlaceholder = "Filter by name or email...",
  emptyMessage = "No results.",
  toolbar,
  actions,
  initialSorting,
}) {
  const id = useId()
  // TanStack's table state is controlled locally so toolbar controls and the
  // table instance stay in sync without a global store.
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState(
    initialSorting ?? [{ id: searchColumnId, desc: false }]
  )
  const inputRef = useRef(null)

  // When the underlying dataset grows/shrinks (after create/delete/refresh),
  // return to the first page so the user is not left on an empty page.
  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [data.length])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Faceted status filter: derive the distinct values and their counts from the
  // current data, then store selections as an array on the column filter.
  const statusColumn = statusColumnId ? table.getColumn(statusColumnId) : null
  const statusFacets = statusColumn?.getFacetedUniqueValues()
  const statusFilterValue = statusColumn?.getFilterValue()

  const uniqueStatusValues = useMemo(() => {
    if (!statusFacets) return []
    return Array.from(statusFacets.keys()).sort()
  }, [statusFacets])

  const statusCounts = statusFacets ?? new Map()

  const selectedStatuses = useMemo(
    () => (Array.isArray(statusFilterValue) ? statusFilterValue : []),
    [statusFilterValue]
  )

  const handleStatusChange = (checked, value) => {
    const filterValue = statusColumn?.getFilterValue() ?? []
    const newFilterValue = [...filterValue]

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) newFilterValue.splice(index, 1)
    }

    statusColumn?.setFilterValue(
      newFilterValue.length ? newFilterValue : undefined
    )
  }

  // Bulk-delete flow: the parent receives the selected original records so it
  // can choose the correct endpoint(s), then the selection is cleared.
  const selectedRows = table.getSelectedRowModel().rows

  const handleDeleteRows = () => {
    onDelete?.(selectedRows.map((row) => row.original))
    table.resetRowSelection()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: text search, optional status facets, column visibility,
          caller-provided controls, and bulk/primary actions. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(table.getColumn(searchColumnId)?.getFilterValue()) &&
                  "pe-9"
              )}
              value={
                (table.getColumn(searchColumnId)?.getFilterValue() ?? "") || ""
              }
              onChange={(event) =>
                table
                  .getColumn(searchColumnId)
                  ?.setFilterValue(event.target.value)
              }
              placeholder={searchPlaceholder}
              type="text"
              aria-label={searchPlaceholder}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn(searchColumnId)?.getFilterValue()) && (
              <button
                type="button"
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-xs text-muted-foreground/80 transition-colors outline-offset-2 hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn(searchColumnId)?.setFilterValue("")
                  inputRef.current?.focus()
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {statusColumnId && (
            <Popover>
              <PopoverTrigger
                render={<Button variant="outline" className="gap-2" />}
              >
                <Funnel
                  className="opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="inline-flex h-5 items-center rounded-xs border border-border bg-background px-1 text-[0.625rem] font-bold text-muted-foreground/70">
                    {selectedStatuses.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent className="min-w-40 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-muted-foreground">
                    Filters
                  </div>
                  <div className="space-y-3">
                    {uniqueStatusValues.map((value, index) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-${index}`}
                          checked={selectedStatuses.includes(value)}
                          onCheckedChange={(checked) =>
                            handleStatusChange(checked, value)
                          }
                        />
                        <Label
                          htmlFor={`${id}-${index}`}
                          className="flex grow justify-between gap-2 font-normal"
                        >
                          {value}
                          <span className="ms-2 text-xs text-muted-foreground">
                            {statusCounts.get(value)}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" className="gap-2" />}
            >
              <Columns3
                className="opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              View
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {toolbar}
        </div>

        <div className="flex items-center gap-3">
          {onDelete && selectedRows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="gap-2" />}
              >
                <Trash
                  className="opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Delete
                <span className="inline-flex h-5 items-center rounded-xs border border-border bg-background px-1 text-[0.625rem] font-bold text-muted-foreground/70">
                  {selectedRows.length}
                </span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently remove{" "}
                      {selectedRows.length} selected{" "}
                      {selectedRows.length === 1 ? "record" : "records"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteRows}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {actions}
        </div>
      </div>

      {/* Table body. Headers are keyboard-sortable; an empty result falls back
          to a single full-width message row. */}
      <div className="overflow-hidden rounded-sm border border-border bg-background">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="h-11"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            header.column.getToggleSortingHandler()?.(event)
                          }
                        }}
                        tabIndex={0}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: (
                            <ChevronUp
                              className="shrink-0 opacity-60"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          ),
                          desc: (
                            <ChevronDown
                              className="shrink-0 opacity-60"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          ),
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination: page size, visible range, and first/prev/next/last. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              if (value) table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
          <p aria-live="polite">
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{" "}
            of <span className="text-foreground">{table.getRowCount()}</span>
          </p>
        </div>

        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
