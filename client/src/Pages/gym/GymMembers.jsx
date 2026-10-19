/**
 * Gym administrator member roster.
 *
 * Loads all clients plus the coach list so members can be created with an
 * optional coach assignment. Supports removing one or many members and exporting
 * the normalized rows to CSV. Display status and join dates are derived for the
 * table only; the API's `active` flag remains the source of truth.
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
 * @returns {JSX.Element} Member table with add/remove/export actions.
 */
export default function GymMembers() {
  const { request } = useAuth()
  const {
    data: members,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/gym/clients")
  const { data: coaches } = useApiData("/gym/coaches")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Add the display status expected by StatusBadge and the faceted filter.
  const rows = useMemo(
    () =>
      (members ?? []).map((member) => ({
        ...member,
        status: member.active ? "Active" : "Inactive",
      })),
    [members]
  )

  // Single-member removal; update the local cache instead of refetching.
  const handleRemove = useCallback(
    async (member) => {
      await request(`/gym/users/${member.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== member.id)
      )
    },
    [request, setData]
  )

  // Bulk removal runs deletes in parallel and filters the local cache once.
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

  // Create the client through the gym endpoint; include `coachId` only when the
  // admin selected one, otherwise the API leaves the member unassigned.
  const handleCreate = async (values) => {
    setSaving(true)
    setFormError("")

    try {
      const created = await request("/gym/clients", {
        method: "POST",
        body: values,
      })
      setData((current) => [created, ...(current ?? [])])
      setDialogOpen(false)
    } catch (createError) {
      setFormError(createError.message ?? "Unable to create the member.")
    } finally {
      setSaving(false)
    }
  }

  // Columns: selection, member identity + text filter, assigned coach, status
  // facet, joined date, and row actions.
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
        header: "Member",
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
        header: "Coach",
        accessorKey: "coachName",
        cell: ({ row }) => row.getValue("coachName") || "Unassigned",
        size: 180,
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
                label: "Remove member",
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

  // Export mirrors the table, including formatted dates and derived status.
  const handleExport = () => {
    exportToCsv("gym-members.csv", rows, [
      { header: "Name", value: (row) => row.name },
      { header: "Email", value: (row) => row.email },
      { header: "Coach", value: (row) => row.coachName },
      { header: "Status", value: (row) => row.status },
      { header: "Joined", value: (row) => formatDate(row.joinedAt) },
    ])
  }

  const activeCount = rows.filter((member) => member.active).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gym workspace"
        title="Members"
        description={`${rows.length} clients belong to your establishment — ${activeCount} currently active.`}
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      {/* List state: loading, error with retry, then the data table. */}
      {loading ? (
        <LoadingState label="Loading members..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          onDelete={handleDelete}
          searchColumnId="name"
          statusColumnId="status"
          searchPlaceholder="Filter members by name or email..."
          emptyMessage="No members yet. Add your first client to get started."
          actions={
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <UserPlus className="size-4" />
              Add member
            </Button>
          }
        />
      )}

      {/* Client mode: the coach select is populated from `/gym/coaches`. */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="client"
        coaches={coaches ?? []}
        saving={saving}
        error={formError}
        onSubmit={handleCreate}
      />
    </div>
  )
}
