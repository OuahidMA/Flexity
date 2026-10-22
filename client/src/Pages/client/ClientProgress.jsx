/**
 * Client progress page.
 *
 * The page reads the routines assigned by the coach and renders the selected
 * workout as a table: one row group per exercise and one input row per set.
 * The logging field mirrors the coach's prescription:
 * - trackingType "reps" -> numeric reps per set
 * - trackingType "time" -> seconds per set (planks, intervals, ...)
 *
 * Every set can also record a weight, or "None" for bodyweight work which greys
 * out the weight input. Saving writes one ProgressLog per exercise to the API,
 * so coaches can read the same data from their dashboard.
 */
import { useMemo, useState } from "react"
import {
  Activity,
  CalendarDays,
  Dumbbell,
  TrendingUp,
} from "lucide-react"

import { useApiData } from "@/hooks/useApiData"
import {
  buildDailyVolume,
  formatMetricSummary,
  formatProgressDate,
  formatWeightSummary,
  progressDateKey,
  todayInputValue,
} from "@/lib/progress"
import { getWeekdayLabel } from "@/lib/workout-splits"
import { DataTable } from "@/components/data-table"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { ProgressLogger } from "@/components/workout/progress-logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SELECT_CLASS =
  "h-11 w-full min-w-0 rounded-xs border border-hairline-strong bg-surface-1 px-3 text-base text-ink transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"

/**
 * Defaults to the routine scheduled today, then the first active routine.
 *
 * @param {Array<object>} routines - Assigned routines.
 * @returns {object|null} Preferred routine.
 */
function pickPreferredRoutine(routines) {
  if (routines.length === 0) return null

  const today = new Date().getDay()
  return (
    routines.find(
      (routine) =>
        routine.status === "active" &&
        (routine.days ?? []).some(
          (day) => Number(day.dayOfWeek) === today && !day.isRest
        )
    ) ??
    routines.find((routine) => routine.status === "active") ??
    routines[0]
  )
}

/**
 * @param {Array<object>} days - Routine schedule.
 * @param {number|null} requested - User-selected weekday.
 * @returns {number|null} A weekday present in the schedule.
 */
function pickPreferredDay(days, requested) {
  if (days.length === 0) return null

  if (requested !== null && requested !== "") {
    const current = Number(requested)
    if (days.some((day) => Number(day.dayOfWeek) === current)) return current
  }

  const today = new Date().getDay()
  const preferred =
    days.find((day) => Number(day.dayOfWeek) === today && !day.isRest) ??
    days.find((day) => !day.isRest) ??
    days[0]

  return preferred ? Number(preferred.dayOfWeek) : null
}

/**
 * @returns {JSX.Element} Client progress logging table, KPIs, and history.
 */
export default function ClientProgress() {
  const {
    data: workouts,
    loading: workoutsLoading,
    error: workoutsError,
    refresh: refreshWorkouts,
  } = useApiData("/client/workouts")
  const {
    data: progress,
    loading: progressLoading,
    error: progressError,
    refresh: refreshProgress,
  } = useApiData("/client/progress")

  const routines = useMemo(() => workouts ?? [], [workouts])
  const logs = useMemo(() => progress ?? [], [progress])

  const [routineId, setRoutineId] = useState(null)
  const [dayOfWeek, setDayOfWeek] = useState(null)
  const [date, setDate] = useState(todayInputValue)

  // Selection is derived, not synced in an effect: a missing/invalid state
  // falls back to the coach-scheduled routine and day for today.
  const preferredRoutine = useMemo(() => pickPreferredRoutine(routines), [routines])

  const selectedRoutine = useMemo(
    () =>
      routines.find((routine) => routine.id === routineId) ??
      preferredRoutine,
    [routines, routineId, preferredRoutine]
  )

  const scheduledDays = useMemo(
    () => selectedRoutine?.days ?? [],
    [selectedRoutine]
  )

  const effectiveDayOfWeek = useMemo(
    () => pickPreferredDay(scheduledDays, dayOfWeek),
    [scheduledDays, dayOfWeek]
  )

  const selectedDay = useMemo(() => {
    if (scheduledDays.length === 0) return null
    return (
      scheduledDays.find(
        (day) => Number(day.dayOfWeek) === Number(effectiveDayOfWeek)
      ) ?? null
    )
  }, [scheduledDays, effectiveDayOfWeek])

  // Schedule-aware exercise list: a specific weekday for weekly routines, or
  // the legacy flat list when a routine has no days.
  const exercises = useMemo(() => {
    if (!selectedRoutine) return []

    const source =
      scheduledDays.length === 0
        ? selectedRoutine.exercises ?? []
        : selectedDay?.isRest
          ? []
          : selectedDay?.exercises ?? []

    return [...source].sort(
      (first, second) => Number(first.order ?? 0) - Number(second.order ?? 0)
    )
  }, [selectedRoutine, scheduledDays, selectedDay])

  const dayLabel =
    selectedRoutine && scheduledDays.length === 0
      ? "Full routine"
      : selectedDay?.label || "Workout"

  const sessionCount = useMemo(
    () =>
      new Set(
        logs.map((log) => progressDateKey(log.date)).filter(Boolean)
      ).size,
    [logs]
  )
  const totalVolume = logs.reduce((total, log) => total + (log.volume || 0), 0)
  const totalLoggedSets = logs.reduce(
    (total, log) => total + (log.sets || 0),
    0
  )
  const latest = logs[0]
  const volumePeak = Math.max(...logs.map((log) => log.volume || 0), 1)
  const dailyVolume = useMemo(() => buildDailyVolume(logs), [logs])
  const dailyPeak = Math.max(
    ...dailyVolume.map((day) => day.volume),
    1
  )

  // Remounting the logger when the workout/date changes rebuilds its draft.
  // The extra `ready` token re-mounts once, after the initial progress fetch,
  // so previously saved values pre-fill. Later refreshes do not remount, which
  // keeps the save confirmation visible.
  const progressReady = progress !== null
  const loggerKey = selectedRoutine
    ? [
        selectedRoutine.id,
        effectiveDayOfWeek ?? "flat",
        date,
        progressReady ? "ready" : "pending",
      ].join(":")
    : "none"

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-subtle">
            {formatProgressDate(row.getValue("date"), { year: true })}
          </span>
        ),
        size: 130,
        enableHiding: false,
      },
      {
        header: "Exercise",
        accessorKey: "exerciseName",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {row.getValue("exerciseName")}
            </p>
            <p className="truncate caption text-ink-subtle">
              {row.original.routineName || row.original.primaryMuscle || "—"}
              {row.original.dayLabel ? ` · ${row.original.dayLabel}` : ""}
            </p>
          </div>
        ),
        size: 220,
      },
      {
        header: "Sets",
        accessorKey: "sets",
        size: 70,
      },
      {
        header: "Reps / Time",
        id: "metric",
        cell: ({ row }) => (
          <span className="text-ink-subtle tabular-nums">
            {formatMetricSummary(row.original)}
          </span>
        ),
        size: 150,
      },
      {
        header: "Weight",
        id: "weight",
        cell: ({ row }) => (
          <span className="text-ink-subtle tabular-nums">
            {formatWeightSummary(row.original)}
          </span>
        ),
        size: 170,
      },
      {
        header: "Volume",
        accessorKey: "volume",
        cell: ({ row }) => {
          const volume = row.getValue("volume") || 0

          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden bg-surface-4">
                <div
                  className="h-full bg-ink"
                  style={{ width: `${(volume / volumePeak) * 100}%` }}
                />
              </div>
              <span className="caption whitespace-nowrap text-ink-subtle tabular-nums">
                {volume.toLocaleString()} kg
              </span>
            </div>
          )
        },
        size: 160,
      },
    ],
    [volumePeak]
  )

  if (workoutsLoading) {
    return <LoadingState label="Loading your workouts..." />
  }

  if (workoutsError && !selectedRoutine) {
    return (
      <ErrorState message={workoutsError.message} onRetry={refreshWorkouts} />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client workspace"
        title="Progress"
        description="Log every set from the workout your coach prescribed. Reps switch to time automatically for interval exercises, and None covers bodyweight sets."
      />

      {/* Progress KPIs from the shared server history. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions logged"
          value={sessionCount}
          hint="days with a saved workout"
          icon={CalendarDays}
        />
        <StatCard
          label="Sets logged"
          value={totalLoggedSets}
          hint="across every session"
          icon={Activity}
        />
        <StatCard
          label="Total volume"
          value={`${totalVolume.toLocaleString()} kg`}
          hint="weight x reps"
          icon={TrendingUp}
        />
        <StatCard
          label="Latest check-in"
          value={latest ? formatProgressDate(latest.date) : "—"}
          hint={latest?.exerciseName ?? "no sessions yet"}
          icon={Dumbbell}
        />
      </div>

      {/* Coach-prescribed logging table. */}
      <div className="rounded-lg border border-hairline bg-surface-1">
        <div className="border-b border-hairline px-5 py-4">
          <h3 className="display-sm text-ink">Log this workout</h3>
          <p className="caption mt-1 text-ink-subtle">
            Inputs follow your coach&apos;s setup: reps for strength work, seconds
            for timed sets.
          </p>
        </div>

        {routines.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No routines assigned"
              description="Once your coach assigns a routine, its exercises and set targets will appear here."
            />
          </div>
        ) : (
          <>
            {/* Workout selection. Day options include rest days so the client
                sees the full schedule without leaving the page. */}
            <div className="grid gap-4 border-b border-hairline px-5 py-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1.3fr_0.9fr]">
              <div className="space-y-2">
                <Label htmlFor="progress-routine">Routine</Label>
                <select
                  id="progress-routine"
                  value={selectedRoutine?.id ?? ""}
                  onChange={(event) => setRoutineId(event.target.value)}
                  className={SELECT_CLASS}
                >
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress-day">Day</Label>
                <select
                  id="progress-day"
                  value={effectiveDayOfWeek ?? ""}
                  onChange={(event) => setDayOfWeek(event.target.value)}
                  disabled={scheduledDays.length === 0}
                  className={SELECT_CLASS}
                >
                  {scheduledDays.length === 0 ? (
                    <option value="">Full routine</option>
                  ) : (
                    scheduledDays.map((day) => (
                      <option key={day.dayOfWeek} value={day.dayOfWeek}>
                        {getWeekdayLabel(day.dayOfWeek, { short: true })} ·{" "}
                        {day.isRest ? "Rest" : day.label || "Workout"}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress-date">Date</Label>
                <Input
                  id="progress-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
            </div>

            {selectedDay?.isRest ? (
              <div className="p-5">
                <EmptyState
                  title="Rest day"
                  description={`${getWeekdayLabel(
                    selectedDay.dayOfWeek
                  )} is a recovery day in ${
                    selectedRoutine.name
                  }. Pick another day to log a session.`}
                />
              </div>
            ) : exercises.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No exercises on this day"
                  description="Your coach has not added exercises to this workout day yet."
                />
              </div>
            ) : (
              <ProgressLogger
                key={loggerKey}
                routineId={selectedRoutine.id}
                dayOfWeek={
                  scheduledDays.length === 0 ? null : effectiveDayOfWeek
                }
                dayLabel={dayLabel}
                exercises={exercises}
                date={date}
                logs={logs}
                onSaved={refreshProgress}
              />
            )}
          </>
        )}
      </div>

      {/* Check-in history from the API. */}
      <div className="rounded-lg border border-hairline bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <h3 className="display-sm text-ink">Check-in history</h3>
            <p className="caption mt-1 text-ink-subtle">
              Every saved exercise, newest first
            </p>
          </div>
          {progressError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshProgress}
            >
              Retry
            </Button>
          )}
        </div>

        <div className="p-5">
          {progressLoading && logs.length === 0 ? (
            <LoadingState label="Loading progress..." />
          ) : progressError ? (
            <ErrorState
              message={progressError.message}
              onRetry={refreshProgress}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No progress logged yet"
              description="Save your first workout above and it will appear here for you and your coach."
            />
          ) : (
            <div className="space-y-6">
              {/* Volume per logged day (not per exercise). */}
              <div>
                <h4 className="eyebrow text-ink-subtle">Volume trend</h4>
                <div className="mt-3 flex h-32 items-end gap-2">
                  {dailyVolume.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full bg-ink transition-colors hover:bg-ink-muted"
                          style={{
                            height: `${Math.max(
                              (day.volume / dailyPeak) * 100,
                              2
                            )}%`,
                          }}
                          title={`${day.volume.toLocaleString()} kg`}
                        />
                      </div>
                      <span className="caption whitespace-nowrap text-ink-subtle">
                        {formatProgressDate(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <DataTable
                columns={columns}
                data={logs}
                searchColumnId="exerciseName"
                searchPlaceholder="Search by exercise..."
                initialSorting={[{ id: "date", desc: true }]}
                emptyMessage="No check-ins logged yet."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
