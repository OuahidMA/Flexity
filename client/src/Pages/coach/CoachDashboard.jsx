/**
 * Coach home: clients currently assigned to the signed-in coach.
 *
 * Clients are created only by the gym administrator; coaches add them to this
 * roster from the All Clients page. This page loads the roster and a small
 * overview payload in parallel, derives an Active/Inactive display status from
 * `active`, and unassigns single clients or bulk-removes selected ones.
 * Mutations update the local list directly and refresh the overview counts.
 */
import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  ClipboardCheck,
  Copy,
  UserX,
  Users,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { DataTable, RowActions } from "@/components/data-table"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ClientProgressDialog } from "@/components/workout/client-progress-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

/**
 * Format an ISO date for table display.
 *
 * @param {string|null|undefined} value - Date string from the API.
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
 * @returns {JSX.Element} Client roster with stats, table, and unassign actions.
 */
export default function CoachDashboard() {
  const { request } = useAuth()
  // Primary data source for the table; `overview` supplies routine counters for
  // the stat cards and is refreshed after roster changes.
  const {
    data: clients,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/coach/clients")
  const { data: overview, refresh: refreshOverview } = useApiData(
    "/coach/overview"
  )
  // The selected client whose saved progress is open in the dialog.
  const [progressClient, setProgressClient] = useState(null)

  // Normalize the boolean `active` flag into the strings the StatusBadge and
  // faceted filter expect.
  const rows = useMemo(
    () =>
      (clients ?? []).map((client) => ({
        ...client,
        status: client.active ? "Active" : "Inactive",
      })),
    [clients]
  )

  // Single-row unassign. Removing the client from local state keeps the table
  // responsive; the overview refresh keeps the stat cards accurate.
  const handleUnassign = useCallback(
    async (client) => {
      await request(`/coach/clients/${client.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== client.id)
      )
      refreshOverview()
    },
    [request, setData, refreshOverview]
  )

  // Bulk delete selected rows via parallel DELETE requests, then remove them
  // from the local cache in a single state update.
  const handleDelete = useCallback(
    async (selected) => {
      const ids = new Set(selected.map((row) => row.id))
      await Promise.all(
        selected.map((row) =>
          request(`/coach/clients/${row.id}`, { method: "DELETE" })
        )
      )
      setData((current) => (current ?? []).filter((item) => !ids.has(item.id)))
      refreshOverview()
    },
    [request, setData, refreshOverview]
  )

  // Column definitions live in one memo so handlers stay stable for the table.
  // Sections below: selection, identity/filter, status facet, joined date, actions.
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
        header: "Client",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">
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
        size: 140,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            label={`Actions for ${row.original.name}`}
            items={[
              {
                label: "View progress",
                icon: BarChart3,
                onClick: () => setProgressClient(row.original),
              },
              {
                label: "Copy email",
                icon: Copy,
                onClick: () =>
                  navigator.clipboard?.writeText(row.original.email),
              },
              { separator: true },
              {
                label: "Unassign client",
                icon: UserX,
                destructive: true,
                onClick: () => handleUnassign(row.original),
              },
            ]}
          />
        ),
        size: 56,
        enableHiding: false,
      },
    ],
    [handleUnassign]
  )

  const activeClients = rows.filter((client) => client.active).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach workspace"
        title="My clients"
        description="Track the clients assigned to you and keep their routines up to date."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              nativeButton={false}
              render={<Link to="/dashboard/coach/all-clients" />}
            >
              <Users className="size-4" />
              All clients
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              nativeButton={false}
              render={<Link to="/dashboard/coach/routines" />}
            >
              <ClipboardCheck className="size-4" />
              My routines
            </Button>
          </div>
        }
      />

      {/* Roster counts come from the table data; routine counts from `/overview`. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active clients"
          value={activeClients}
          hint={`of ${rows.length} assigned`}
          icon={Users}
        />
        <StatCard
          label="Total clients"
          value={rows.length}
          hint="on your roster"
          icon={Users}
        />
        <StatCard
          label="Active routines"
          value={overview?.activeRoutines ?? 0}
          hint={`${overview?.routines ?? 0} total`}
          icon={ClipboardCheck}
        />
      </div>

      {/* Gate the table on the primary clients request. */}
      {loading ? (
        <LoadingState label="Loading clients..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          onDelete={handleDelete}
          searchColumnId="name"
          statusColumnId="status"
          searchPlaceholder="Filter clients by name or email..."
          emptyMessage="No clients assigned yet. Add clients from the All Clients page."
        />
      )}

      <ClientProgressDialog
        client={progressClient}
        open={Boolean(progressClient)}
        onOpenChange={(open) => {
          if (!open) setProgressClient(null)
        }}
      />
    </div>
  )
}
