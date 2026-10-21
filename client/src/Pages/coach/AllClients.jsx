/**
 * All Clients page for coaches.
 *
 * The gym administrator creates every client account. Coaches browse that full
 * list here and select the clients they want to coach. Selecting a client stores
 * this coach's id and two initials on the client record, and the client then
 * appears on the My Clients page where routines can be assigned.
 */
import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { UserCheck, UserPlus, Users } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { DataTable } from "@/components/data-table"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"

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
 * @returns {JSX.Element} Full gym client roster with selection controls.
 */
export default function AllClients() {
  const { request } = useAuth()
  const {
    data: clients,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/coach/all-clients")

  const [selectingId, setSelectingId] = useState(null)
  const [selectError, setSelectError] = useState("")

  // Add the display status expected by StatusBadge and the faceted filter.
  const rows = useMemo(
    () =>
      (clients ?? []).map((client) => ({
        ...client,
        status: client.assignedToMe
          ? "On my roster"
          : client.available
            ? "Available"
            : "Assigned",
      })),
    [clients]
  )

  // Selection is optimistic: merge the server response into the local cache so
  // the row immediately moves to "On my roster" without a full reload.
  const handleSelect = useCallback(
    async (client) => {
      setSelectError("")
      setSelectingId(client.id)

      try {
        const selected = await request(`/coach/clients/${client.id}/select`, {
          method: "POST",
        })
        setData((current) =>
          (current ?? []).map((item) =>
            item.id === client.id ? { ...item, ...selected } : item
          )
        )
      } catch (selectFailure) {
        setSelectError(
          selectFailure.message ?? "Unable to select this client."
        )
      } finally {
        setSelectingId(null)
      }
    },
    [request, setData]
  )

  // Columns: identity + text filter, roster status facet, assigned coach (with
  // stored initials), join date, and the select action.
  const columns = useMemo(
    () => [
      {
        header: "Client",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
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
        size: 150,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue?.length) return true
          return filterValue.includes(row.getValue(columnId))
        },
      },
      {
        header: "Coach",
        accessorKey: "coachName",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
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
        size: 170,
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
        id: "select-client",
        header: () => <span className="sr-only">Select</span>,
        cell: ({ row }) => {
          const client = row.original

          if (client.assignedToMe) {
            return (
              <span className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                On roster
              </span>
            )
          }

          if (!client.available) {
            return (
              <span className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                Unavailable
              </span>
            )
          }

          return (
            <Button
              size="sm"
              className="gap-2"
              disabled={selectingId === client.id}
              onClick={() => handleSelect(client)}
            >
              <UserPlus className="size-3.5" />
              {selectingId === client.id ? "Selecting..." : "Select"}
            </Button>
          )
        },
        size: 150,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleSelect, selectingId]
  )

  const onRoster = rows.filter((client) => client.assignedToMe).length
  const available = rows.filter(
    (client) => client.available && !client.assignedToMe
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach workspace"
        title="All clients"
        description="Browse every client created by your gym administrator, then select the ones you want to coach."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            nativeButton={false}
            render={<Link to="/dashboard/coach" />}
          >
            <Users className="size-4" />
            My clients
          </Button>
        }
      />

      {/* Roster composition at a glance. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="All clients"
          value={rows.length}
          hint="created by your gym"
          icon={Users}
        />
        <StatCard
          label="Available"
          value={available}
          hint="ready to coach"
          icon={UserPlus}
        />
        <StatCard
          label="On my roster"
          value={onRoster}
          hint="already selected"
          icon={UserCheck}
        />
      </div>

      {selectError && (
        <p className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {selectError}
        </p>
      )}

      {/* List state: loading, error with retry, then the roster table. */}
      {loading ? (
        <LoadingState label="Loading clients..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchColumnId="name"
          statusColumnId="status"
          searchPlaceholder="Filter clients by name or email..."
          emptyMessage="No clients have been created by the gym admin yet."
        />
      )}
    </div>
  )
}
