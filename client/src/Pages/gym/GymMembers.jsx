/**
 * Gym administrator member roster.
 *
 * Loads all clients for the gym. Members are created unassigned; coaches claim
 * their own clients from the coach dashboard. Supports removing one or many
 * members and exporting the normalized rows to CSV. Display status and join
 * dates are derived for the table only; the API's `active` flag remains the
 * source of truth.
 */
import { useCallback, useMemo, useState } from "react"
import { Copy, Download, KeyRound, Trash, UserPlus } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { exportToCsv } from "@/lib/csv"
import { formatPin } from "@/lib/pins"
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

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Pending accounts (PIN not redeemed yet) show as Pending rather than Active
  // so the admin can see who still needs onboarding.
  const rows = useMemo(
    () =>
      (members ?? []).map((member) => ({
        ...member,
        status: member.setupRequired
          ? "Pending"
          : member.active
            ? "Active"
            : "Inactive",
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

  // Create the client through the gym endpoint. The API intentionally ignores
  // coach assignment here; only a coach can claim a client.
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

  // The dialog calls this before creating the account; the PIN is shown to the
  // admin and then sent back with the create request.
  const handleGeneratePin = useCallback(async () => {
    const data = await request("/gym/access-pin", { method: "POST" })
    return data.pin
  }, [request])

  // Columns: selection, member identity + text filter, setup PIN, assigned
  // coach, status facet, joined date, and row actions.
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
          <div className="min-w-0 space-y-1">
            <p className="truncate font-bold text-foreground">
              {row.getValue("name") || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email || "Awaiting setup"}
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
        header: "Setup PIN",
        accessorKey: "pin",
        cell: ({ row }) =>
          row.original.setupRequired ? (
            <span className="font-mono text-xs font-bold tracking-[0.16em] text-foreground">
              {formatPin(row.original.pin)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Activated</span>
          ),
        size: 130,
      },
      {
        header: "Coach",
        accessorKey: "coachName",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1 py-1.5">
            <p className="truncate text-muted-foreground">
              {row.getValue("coachName") || "Unassigned"}
            </p>
            {row.original.coach && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.coach}
              </p>
            )}
          </div>
        ),
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
              ...(row.original.email
                ? [
                    {
                      label: "Copy email",
                      icon: Copy,
                      onClick: () =>
                        navigator.clipboard?.writeText(row.original.email),
                    },
                  ]
                : []),
              ...(row.original.setupRequired
                ? [
                    {
                      label: "Copy setup PIN",
                      icon: KeyRound,
                      onClick: () =>
                        navigator.clipboard?.writeText(row.original.pin),
                    },
                  ]
                : []),
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
      { header: "Setup PIN", value: (row) => formatPin(row.pin) },
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

      {/* Client mode: coach assignment is intentionally not offered here. */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="client"
        saving={saving}
        error={formError}
        onGeneratePin={handleGeneratePin}
        onSubmit={handleCreate}
      />
    </div>
  )
}
