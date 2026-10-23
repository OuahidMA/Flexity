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
  CalendarDays,
  ClipboardCheck,
  Copy,
  UserX,
  Users,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { getWeekdayLabel } from "@/lib/workout-splits"
import { DataTable, RowActions } from "@/components/data-table"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ClientProgressAnalytics } from "@/components/workout/client-progress-analytics"
import { ClientProgressDialog } from "@/components/workout/client-progress-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const SELECT_CLASS =
  "h-11 w-full min-w-0 rounded-xs border border-hairline-strong bg-surface-1 px-3 text-base text-ink transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"

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
  // Routines carry the weekly schedule (days + split labels) used by the
  // coach's planning panel and the attendance roster header.
  const { data: routines, loading: routinesLoading } = useApiData("/routines")
  // The selected client whose saved progress is open in the dialog.
  const [progressClient, setProgressClient] = useState(null)
  // The client currently shown in the inline progression section.
  const [progressClientId, setProgressClientId] = useState(null)

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

  // A missing or removed selection falls back to the first roster client, so
  // the progression section always has something useful to show.
  const selectedProgressClient =
    rows.find((client) => client.id === progressClientId) ?? rows[0] ?? null

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
            <p className="truncate text-[13px] font-medium text-ink">
              {row.getValue("name") || "—"}
            </p>
            <p className="truncate caption text-ink-subtle">
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
          <span className="text-ink-subtle">
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

  // Flatten every scheduled day into one week view. A routine can contribute
  // several days, and rest days are kept so the coach sees the full split.
  const scheduleDays = useMemo(
    () =>
      (routines ?? []).flatMap((routine) =>
        (routine.days ?? []).map((day) => ({
          ...day,
          dayOfWeek: Number(day.dayOfWeek),
          routineName: routine.name,
          routineStatus: routine.status,
          clientName: routine.clientName,
        }))
      ),
    [routines]
  )
  const today = new Date().getDay()
  const weekOrder = [1, 2, 3, 4, 5, 6, 0]
  const todaySessions = scheduleDays.filter(
    (day) => day.dayOfWeek === today && !day.isRest
  )

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

      {/* Weekly schedule from the routines this coach has published. */}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <h3 className="display-sm text-ink">This week's schedule</h3>
              <p className="caption mt-1 text-ink-subtle">
                Split days from the routines you have published
              </p>
            </div>
            <Badge variant="outline">
              {scheduleDays.filter((day) => !day.isRest).length} sessions
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-px border-b border-hairline bg-hairline sm:grid-cols-7">
            {weekOrder.map((dayOfWeek) => {
              const sessions = scheduleDays.filter(
                (day) => day.dayOfWeek === dayOfWeek && !day.isRest
              )
              const isToday = dayOfWeek === today

              return (
                <div
                  key={dayOfWeek}
                  className={`bg-surface-1 px-2 py-3 text-center ${
                    isToday ? "bg-surface-2" : ""
                  }`}
                >
                  <p className="eyebrow text-ink-subtle">
                    {getWeekdayLabel(dayOfWeek, { short: true })}
                  </p>
                  <p
                    className={`display-sm mt-1 ${
                      sessions.length ? "text-ink" : "text-ink-tertiary"
                    }`}
                  >
                    {sessions.length}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="divide-y divide-hairline">
            {routinesLoading && routines === null ? (
              <p className="px-5 py-5 caption text-ink-subtle">
                Loading schedule...
              </p>
            ) : todaySessions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays
                  className="mx-auto size-5 text-ink-tertiary"
                  aria-hidden="true"
                />
                <p className="cap-label mt-3 text-ink">Nothing scheduled today</p>
                <p className="caption mt-1 text-ink-subtle">
                  Add training days in a routine to fill the week.
                </p>
              </div>
            ) : (
              todaySessions.map((session, index) => (
                <div
                  key={`${session.routineName}-${session.dayOfWeek}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-hairline bg-surface-2 text-ink-muted">
                      <CalendarDays className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {session.label || "Workout"}
                      </p>
                      <p className="truncate caption text-ink-subtle">
                        {session.routineName}
                        {session.clientName ? ` · ${session.clientName}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {session.exercises?.length ?? 0}{" "}
                    {session.exercises?.length === 1 ? "exercise" : "exercises"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Client progression: choose any roster client and review the same
            Chart.js view the client sees, plus their full history. */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-4">
            <div className="min-w-0">
              <h3 className="display-sm text-ink">Client progression</h3>
              <p className="caption mt-1 text-ink-subtle">
                Pick a client to inspect strength gains, plateaus, and every
                saved set.
              </p>
            </div>
            <div className="w-full space-y-2 sm:w-72">
              <Label htmlFor="coach-progress-client">Client</Label>
              <select
                id="coach-progress-client"
                value={selectedProgressClient?.id ?? ""}
                onChange={(event) => setProgressClientId(event.target.value)}
                disabled={rows.length === 0}
                className={SELECT_CLASS}
              >
                {rows.length === 0 ? (
                  <option value="">No clients yet</option>
                ) : (
                  rows.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name || client.email}
                      {client.active ? "" : " (inactive)"}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {loading && rows.length === 0 ? (
            <LoadingState label="Loading clients..." />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No clients on your roster"
              description="Select a client from All clients to start reviewing their progression."
            />
          ) : (
            <ClientProgressAnalytics
              clientId={selectedProgressClient?.id}
              enabled={Boolean(selectedProgressClient)}
            />
          )}
        </section>
      </div>

      {/* Attendance roster: every assigned client, with their saved progress
          one click away. */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
        <div>
          <h3 className="display-sm text-ink">Attendance roster</h3>
          <p className="caption mt-1 text-ink-subtle">
            {activeClients} active of {rows.length} assigned clients
          </p>
        </div>
        <Badge variant="outline">{rows.length} clients</Badge>
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
