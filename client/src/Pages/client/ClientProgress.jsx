/**
 * Client progress history.
 *
 * Reads `/client/progress` (newest first), derives volume totals, and renders
 * both a compact bar trend and a sortable/filterable table. Bars are scaled
 * against the largest single-session volume so small values stay visible.
 */
import { useMemo } from "react"
import { Activity, CalendarDays, Dumbbell, TrendingUp } from "lucide-react"

import { useApiData } from "@/hooks/useApiData"
import { DataTable } from "@/components/data-table"
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"

/**
 * @returns {JSX.Element} Progress KPIs, volume chart, and check-in table.
 */
export default function ClientProgress() {
  const { data: logs, loading, error, refresh } = useApiData("/client/progress")

  // Normalize the response and derive summary values. `volumePeak` uses a
  // minimum of 1 to avoid division by zero for an empty or zero-volume history.
  const entries = useMemo(() => logs ?? [], [logs])
  const latest = entries[0]
  const totalVolume = entries.reduce(
    (total, log) => total + (log.volume || 0),
    0
  )
  const averageVolume = entries.length
    ? Math.round(totalVolume / entries.length)
    : 0
  const volumePeak = Math.max(...entries.map((log) => log.volume || 0), 1)
  const chartData = useMemo(() => [...entries].reverse(), [entries])

  // Column definitions are memoized because the volume cell closure depends on
  // `volumePeak`; re-creating them on every render would reset table state.
  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) =>
          new Date(row.getValue("date")).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        size: 140,
        enableHiding: false,
      },
      {
        header: "Exercise",
        accessorKey: "exerciseName",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("exerciseName")}</span>
        ),
        size: 220,
      },
      {
        header: "Muscle",
        accessorKey: "primaryMuscle",
        size: 140,
      },
      {
        header: "Sets logged",
        accessorKey: "sets",
        size: 110,
      },
      {
        header: "Volume",
        accessorKey: "volume",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${((row.getValue("volume") || 0) / volumePeak) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(row.getValue("volume") || 0).toLocaleString()} kg
            </span>
          </div>
        ),
        size: 200,
      },
    ],
    [volumePeak]
  )

  if (loading) return <LoadingState label="Loading progress..." />
  if (error) return <ErrorState message={error.message} onRetry={refresh} />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client workspace"
        title="Progress"
        description="Training volume logged by your coach across every exercise."
      />

      {/* Headline progress metrics. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions logged"
          value={entries.length}
          hint="total check-ins"
          icon={Activity}
        />
        <StatCard
          label="Total volume"
          value={`${totalVolume.toLocaleString()} kg`}
          hint="all-time load moved"
          icon={TrendingUp}
        />
        <StatCard
          label="Average volume"
          value={`${averageVolume.toLocaleString()} kg`}
          hint="per session"
          icon={Dumbbell}
        />
        <StatCard
          label="Latest check-in"
          value={
            latest
              ? new Date(latest.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          hint={latest?.exerciseName ?? "no sessions yet"}
          icon={CalendarDays}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No progress logged yet"
          description="Your coach's progress logs will appear here after your first tracked session."
        />
      ) : (
        <>
          {/* Chronological bar chart (API sends newest first, so reverse). */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold">Volume trend</h3>
              <p className="text-xs text-muted-foreground">
                Total load moved per logged session (kg)
              </p>
            </div>
            <div className="px-5 py-6">
              <div className="flex h-40 items-end gap-3">
                {chartData.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-white/80 transition-colors hover:bg-white"
                        style={{
                          height: `${((log.volume || 0) / volumePeak) * 100}%`,
                        }}
                        title={`${(log.volume || 0).toLocaleString()} kg`}
                      />
                    </div>
                    <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full log with client-side search/sort. */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold">Check-in history</h3>
              <p className="text-xs text-muted-foreground">
                Every logged exercise, newest first
              </p>
            </div>
            <div className="p-5">
              <DataTable
                columns={columns}
                data={entries}
                searchColumnId="exerciseName"
                searchPlaceholder="Search by exercise..."
                initialSorting={[{ id: "date", desc: true }]}
                emptyMessage="No check-ins logged yet."
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
