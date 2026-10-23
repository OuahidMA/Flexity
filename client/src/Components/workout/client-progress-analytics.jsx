/**
 * Coach-facing analytics for one roster client.
 *
 * Loads `/coach/clients/:id/progress` and presents the same Chart.js
 * progression card the client sees, followed by the complete saved history. It
 * is shared by the dashboard client picker and the row-action dialog so both
 * entry points stay in sync.
 */
import { Activity, CalendarCheck, Dumbbell, TrendingUp } from "lucide-react"

import { useApiData } from "@/hooks/useApiData"
import {
  buildExerciseProgress,
  formatMetricSummary,
  formatProgressDate,
  formatWeightSummary,
  progressDateKey,
} from "@/lib/progress"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/data-state"
import { WorkoutProgressChart } from "@/components/workout/workout-progress-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * @param {object} props
 * @param {string|null|undefined} props.clientId - Roster client id.
 * @param {boolean} [props.enabled=true] - Set false while a dialog is closed.
 * @returns {JSX.Element} Summary, progression chart, and workout history.
 */
export function ClientProgressAnalytics({ clientId, enabled = true }) {
  const path = enabled && clientId ? `/coach/clients/${clientId}/progress` : null
  const { data, loading, error, refresh } = useApiData(path, {
    enabled: Boolean(enabled && clientId),
  })

  const logs = data?.logs ?? []
  const sessions = new Set(
    logs.map((log) => progressDateKey(log.date)).filter(Boolean)
  ).size
  const totalSets = logs.reduce((total, log) => total + (log.sets || 0), 0)
  const totalVolume = logs.reduce((total, log) => total + (log.volume || 0), 0)

  // Reuse the chart grouping so the headline "best lift" matches the plotted
  // exercise series rather than an unrelated bodyweight or timed log.
  const bestLift = buildExerciseProgress(logs).reduce(
    (best, group) => Math.max(best, group.bestWeight ?? 0),
    0
  )
  const latest = logs[0]

  // `useApiData` keeps the previous payload while a new path is in flight, so
  // the client id in the response guards against showing another client's chart
  // for a frame when the coach changes the selection.
  const loadedClientId = data?.client?.id
  const isStale =
    data !== null &&
    Boolean(clientId) &&
    String(loadedClientId ?? "") !== String(clientId)

  if (error) {
    return <ErrorState message={error.message} onRetry={refresh} />
  }

  if (loading || isStale) {
    return <LoadingState label="Loading client progress..." />
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No progress logged yet"
        description="This client has not saved a workout. Their sets and progression chart will appear here as soon as they log one."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-ink-subtle">Sessions</p>
            <CalendarCheck className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          </div>
          <p className="display-sm mt-2 text-ink">{sessions}</p>
          <p className="caption mt-1 text-ink-subtle">
            latest {latest ? formatProgressDate(latest.date, { year: true }) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-ink-subtle">Sets logged</p>
            <Activity className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          </div>
          <p className="display-sm mt-2 text-ink">{totalSets}</p>
          <p className="caption mt-1 text-ink-subtle">
            across {logs.length} exercise logs
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-ink-subtle">Volume</p>
            <TrendingUp className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          </div>
          <p className="display-sm mt-2 text-ink">
            {totalVolume.toLocaleString()} kg
          </p>
          <p className="caption mt-1 text-ink-subtle">weight × reps</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-ink-subtle">Best top set</p>
            <Dumbbell className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          </div>
          <p className="display-sm mt-2 text-ink">{bestLift} kg</p>
          <p className="caption mt-1 text-ink-subtle">heaviest logged set</p>
        </div>
      </div>

      <WorkoutProgressChart
        logs={logs}
        title="Client strength progression"
        description="Switch exercises to spot strength gains and plateaus across sessions."
      />

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-4">
          <div>
            <h3 className="display-sm text-ink">Workout history</h3>
            <p className="caption mt-1 text-ink-subtle">
              Every saved exercise, newest first
            </p>
          </div>
          <span className="caption text-ink-subtle">{logs.length} entries</span>
        </div>

        <div className="max-h-[26rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Sets</TableHead>
                <TableHead>Reps / Time</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-ink-subtle">
                    {formatProgressDate(log.date, { year: true })}
                  </TableCell>
                  <TableCell>
                    <p className="text-[13px] font-medium text-ink">
                      {log.exerciseName}
                    </p>
                    <p className="caption text-ink-subtle">
                      {log.routineName || "—"}
                      {log.dayLabel ? ` · ${log.dayLabel}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{log.sets}</TableCell>
                  <TableCell className="whitespace-nowrap text-ink-subtle tabular-nums">
                    {formatMetricSummary(log)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-ink-subtle tabular-nums">
                    {formatWeightSummary(log)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {(log.volume || 0).toLocaleString()} kg
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default ClientProgressAnalytics
