/**
 * Coach routine list.
 *
 * Loads `/routines` (scoped server-side to the signed-in coach), maps statuses
 * to display labels, and supports editing, copying the name, and deleting one or
 * many routines. Creating/editing navigates to RoutineBuilder; deletions update
 * the local cache after the DELETE succeeds.
 */
import { useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Copy, Pencil, Plus, Trash } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { DataTable, RowActions } from "@/components/data-table"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const STATUS_LABELS = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
}

/**
 * @param {string|null|undefined} value - ISO timestamp.
 * @returns {string} Localized short date, or an em dash when missing.
 */
function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * @returns {JSX.Element} Routine table with create/edit/delete actions.
 */
export default function CoachRoutines() {
  const { request } = useAuth()
  const navigate = useNavigate()
  const {
    data: routines,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/routines")

  // Expose a display label column so the status facet/filter matches what users
  // see (e.g. "Active") while preserving the raw API status.
  const rows = useMemo(
    () =>
      (routines ?? []).map((routine) => ({
        ...routine,
        statusLabel: STATUS_LABELS[routine.status] ?? routine.status,
      })),
    [routines]
  )

  // Delete a single routine and drop it from the local list without a re-fetch.
  const handleRemove = useCallback(
    async (routine) => {
      await request(`/routines/${routine.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== routine.id)
      )
    },
    [request, setData]
  )

  // Bulk delete: fire requests in parallel, then remove every affected id.
  const handleDelete = useCallback(
    async (selected) => {
      const ids = new Set(selected.map((row) => row.id))
      await Promise.all(
        selected.map((row) =>
          request(`/routines/${row.id}`, { method: "DELETE" })
        )
      )
      setData((current) => (current ?? []).filter((item) => !ids.has(item.id)))
    },
    [request, setData]
  )

  // Columns: selection, routine identity + text filter, totals, assignment,
  // status facet, updated date, and row actions.
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
          />
        ),
        size: 36,
        enableSorting: false,
        enableHiding: false,
      },
      {
        header: "Routine",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.getValue("name")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.goal || row.original.description || "No goal set"}
            </p>
          </div>
        ),
        size: 280,
        filterFn: (row, columnId, filterValue) => {
          const term = (filterValue ?? "").toLowerCase()
          if (!term) return true
          return `${row.original.name} ${row.original.goal} ${row.original.description}`
            .toLowerCase()
            .includes(term)
        },
        enableHiding: false,
      },
      {
        header: "Exercises",
        accessorKey: "exerciseCount",
        size: 110,
      },
      {
        header: "Total sets",
        accessorKey: "totalSets",
        size: 110,
      },
      {
        header: "Client",
        accessorKey: "clientName",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("clientName") || "Unassigned"}
          </span>
        ),
        size: 180,
      },
      {
        header: "Status",
        accessorKey: "statusLabel",
        cell: ({ row }) => <StatusBadge status={row.getValue("statusLabel")} />,
        size: 110,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue?.length) return true
          return filterValue.includes(row.getValue(columnId))
        },
      },
      {
        header: "Updated",
        accessorKey: "updatedAt",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.getValue("updatedAt"))}
          </span>
        ),
        size: 130,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            label={`Actions for ${row.original.name}`}
            items={[
              {
                label: "Edit routine",
                icon: Pencil,
                onClick: () =>
                  navigate(`/dashboard/coach/routines/${row.original.id}`),
              },
              {
                label: "Copy name",
                icon: Copy,
                onClick: () =>
                  navigator.clipboard?.writeText(row.original.name),
              },
              { separator: true },
              {
                label: "Delete routine",
                icon: Trash,
                destructive: true,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
        size: 56,
        enableHiding: false,
      },
    ],
    [handleRemove, navigate]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach workspace"
        title="Routines"
        description="Build named workout routines, order the exercises, and assign them to clients."
        actions={
          <Button
            className="gap-2"
            render={<Link to="/dashboard/coach/routines/new" />}
          >
            <Plus className="size-4" />
            New routine
          </Button>
        }
      />

      {/* List state: loading, error with retry, then the table. */}
      {loading ? (
        <LoadingState label="Loading routines..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          onDelete={handleDelete}
          searchColumnId="name"
          statusColumnId="statusLabel"
          searchPlaceholder="Filter routines by name or goal..."
          emptyMessage="No routines yet. Create your first routine to get started."
        />
      )}
    </div>
  )
}
