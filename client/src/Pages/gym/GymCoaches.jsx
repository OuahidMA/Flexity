/**
 * Gym administrator coach roster.
 *
 * Loads `/gym/coaches` for the current tenant, derives Active/Inactive display
 * status, and supports inviting coaches, removing one or many, and exporting the
 * currently loaded rows to CSV. Removing a coach calls the shared tenant-user
 * endpoint (`/gym/users/:id`) and updates the local cache.
 */
import { useCallback, useMemo, useState } from "react"
import { Copy, Download, Trash, UserPlus } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { exportToCsv } from "@/lib/csv"
import { DataTable, RowActions } from "@/components/data-table"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserFormDialog } from "@/components/dashboard/user-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

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
 * @returns {JSX.Element} Coach table with invite/remove/export actions.
 */
export default function GymCoaches() {
  const { request } = useAuth()
  const {
    data: coaches,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/gym/coaches")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Add the display status expected by StatusBadge and the faceted filter.
  const rows = useMemo(
    () =>
      (coaches ?? []).map((coach) => ({
        ...coach,
        status: coach.active ? "Active" : "Inactive",
      })),
    [coaches]
  )

  // Single-coach removal; local filtering avoids a full refetch.
  const handleRemove = useCallback(
    async (coach) => {
      await request(`/gym/users/${coach.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== coach.id)
      )
    },
    [request, setData]
  )

  // Bulk removal runs deletes in parallel and then drops all selected ids at once.
  const handleDelete = useCallback(
    async (selected) => {
      const ids = new Set(selected.map((row) => row.id))
      await Promise.all(
        selected.map((row) =>
          request(`/gym/users/${row.id}`, { method: "DELETE" })
        )
      )
      setData((current) => (current ?? []).filter((item) => !ids.has(item.id)))
    },
    [request, setData]
  )

  // Invite flow: POST to the coach-specific endpoint, then prepend the created
  // coach so it appears immediately without reloading the list.
  const handleCreate = async (values) => {
    setSaving(true)
    setFormError("")

    try {
      const created = await request("/gym/coaches", {
        method: "POST",
        body: values,
      })
      setData((current) => [created, ...(current ?? [])])
      setDialogOpen(false)
    } catch (createError) {
      setFormError(createError.message ?? "Unable to create the coach.")
    } finally {
      setSaving(false)
    }
  }

  // Columns: selection, coach identity + text filter, speciality, client count,
  // status facet, joined date, and row actions.
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
        header: "Coach",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.getValue("name") || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
        size: 260,
        filterFn: (row, columnId, filterValue) => {
          const term = (filterValue ?? "").toLowerCase()
          if (!term) return true
          return `${row.original.name} ${row.original.email}`
            .toLowerCase()
            .includes(term)
        },
        enableHiding: false,
      },
      {
        header: "Speciality",
        accessorKey: "speciality",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.getValue("speciality") || "General"}
          </Badge>
        ),
        size: 190,
      },
      {
        header: "Clients",
        accessorKey: "clients",
        size: 90,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
        size: 110,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue?.length) return true
          return filterValue.includes(row.getValue(columnId))
        },
      },
      {
        header: "Joined",
        accessorKey: "joinedAt",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.getValue("joinedAt"))}
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
                label: "Copy email",
                icon: Copy,
                onClick: () =>
                  navigator.clipboard?.writeText(row.original.email),
              },
              { separator: true },
              {
                label: "Remove coach",
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
    [handleRemove]
  )

  // Export the normalized rows (not the raw API payload) so the CSV matches the
  // table, including formatted dates and display statuses.
  const handleExport = () => {
    exportToCsv("gym-coaches.csv", rows, [
      { header: "Name", value: (row) => row.name },
      { header: "Email", value: (row) => row.email },
      { header: "Speciality", value: (row) => row.speciality },
      { header: "Clients", value: (row) => row.clients },
      { header: "Status", value: (row) => row.status },
      { header: "Joined", value: (row) => formatDate(row.joinedAt) },
    ])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gym workspace"
        title="Coaches"
        description={`${rows.length} coaches run programs inside your establishment.`}
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      {/* List state: loading, error with retry, then the data table. */}
      {loading ? (
        <LoadingState label="Loading coaches..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          onDelete={handleDelete}
          searchColumnId="name"
          statusColumnId="status"
          searchPlaceholder="Filter coaches by name or email..."
          emptyMessage="No coaches yet. Invite your first coach to get started."
          actions={
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <UserPlus className="size-4" />
              Invite coach
            </Button>
          }
        />
      )}

      {/* Coach mode exposes the speciality field and posts to `/gym/coaches`. */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="coach"
        saving={saving}
        error={formError}
        onSubmit={handleCreate}
      />
    </div>
  )
}
