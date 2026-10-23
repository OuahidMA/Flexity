/**
 * Client home: the workouts a coach has assigned to the signed-in user.
 *
 * Loads `/client/workouts` once, derives summary metrics from the routine list,
 * highlights the next active routine, and shows the prescribed exercise order.
 * This page is read-only: logging happens on the Progress page.
 */
import { Link } from "react-router-dom"
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Moon,
  Target,
  TrendingUp,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { formatProgressDate, progressDateKey } from "@/lib/progress"
import {
  WEEKDAYS,
  getSplitLabel,
  getWeekdayLabel,
} from "@/lib/workout-splits"
import { WorkoutCalendar } from "@/components/workout/workout-calendar"
import { WorkoutProgressChart } from "@/components/workout/workout-progress-chart"
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_LABELS = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
}

/**
 * @returns {JSX.Element} Client workout overview.
 */
export default function ClientDashboard() {
  const { user } = useAuth()
  const { data: workouts, loading, error, refresh } = useApiData("/client/workouts")
  const {
    data: progress,
    loading: progressLoading,
    error: progressError,
    refresh: refreshProgress,
  } = useApiData("/client/progress")

  // Show dedicated states before touching `workouts` so a null payload never
  // reaches the aggregation logic below.
  if (loading) return <LoadingState label="Loading your workouts..." />
  if (error) return <ErrorState message={error.message} onRetry={refresh} />

  // Derived, read-only metrics computed from the API-provided exercise and set
  // counts (the list endpoint returns pre-aggregated routine summaries).
  const routines = workouts ?? []
  const active = routines.filter((routine) => routine.status === "active")
  const totalExercises = routines.reduce(
    (total, routine) => total + routine.exerciseCount,
    0
  )
  const totalSets = routines.reduce(
    (total, routine) => total + routine.totalSets,
    0
  )
  const nextWorkout = active[0] ?? routines[0]
  const firstName = (user?.profile?.name || user?.email || "there").split(
    " "
  )[0]

  // Logged history drives the fitness metrics and the recent-session table.
  const logs = progress ?? []
  const sessionCount = new Set(
    logs.map((log) => progressDateKey(log.date)).filter(Boolean)
  ).size
  const loggedVolume = logs.reduce((total, log) => total + (log.volume || 0), 0)
  const recentLogs = logs.slice(0, 6)

  // The weekly split behaves as the client's bookings: each scheduled training
  // day is surfaced with its next calendar date, Monday first.
  const bookings = WEEKDAYS.flatMap((weekday) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const offset = (weekday.value - today.getDay() + 7) % 7
    const date = new Date(today)
    date.setDate(today.getDate() + offset)

    return routines.flatMap((routine) =>
      (routine.days ?? [])
        .filter(
          (day) => Number(day.dayOfWeek) === weekday.value && !day.isRest
        )
        .map((day) => ({
          key: `${routine.id}-${weekday.value}`,
          date,
          weekday: weekday.short,
          label: day.label || "Workout",
          routineName: routine.name,
          coachName: routine.coachName,
        }))
    )
  }).slice(0, 6)

  // The calendar is driven entirely by the coach's saved weekly schedule.
  // Today's card prefers an active routine, then falls back to any scheduled one.
  const scheduledRoutines = routines.filter(
    (routine) => (routine.days ?? []).length > 0
  )
  const todayDayOfWeek = new Date().getDay()
  const todayEntry =
    [...scheduledRoutines]
      .sort((first, second) => {
        const firstActive = first.status === "active" ? 0 : 1
        const secondActive = second.status === "active" ? 0 : 1
        return firstActive - secondActive
      })
      .map((routine) => ({
        routine,
        day: (routine.days ?? []).find(
          (day) => Number(day.dayOfWeek) === todayDayOfWeek
        ),
      }))
      .find((entry) => entry.day)
  const todayLabel = todayEntry?.day?.isRest
    ? "Rest day"
    : todayEntry?.day?.label || ""
  const todayExercises =
    todayEntry?.day && !todayEntry.day.isRest
      ? [...(todayEntry.day.exercises ?? [])].sort(
          (first, second) => first.order - second.order
        )
      : []
  const exercisePreview = todayExercises.length
    ? {
        title: `${todayEntry.routine.name} — ${todayEntry.day.label}`,
        subtitle: "Today's prescribed session, in order",
        exercises: todayExercises,
      }
    : todayEntry?.day?.isRest
      ? null
      : nextWorkout && nextWorkout.exercises.length > 0
        ? {
            title: `${nextWorkout.name} — exercise order`,
            subtitle: "Follow the sequence exactly as prescribed",
            exercises: [...nextWorkout.exercises].sort(
              (first, second) => first.order - second.order
            ),
          }
        : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client workspace"
        title={`Welcome back, ${firstName}`}
        description="Your weekly split, today's training, and volume at a glance."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            nativeButton={false}
            render={<Link to="/dashboard/client/progress" />}
          >
            <Target className="size-4" />
            View progress
          </Button>
        }
      />

      {/* Personal fitness metrics: planned work from the routines and actual
          work from the logged history. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active routines"
          value={active.length}
          hint={`of ${routines.length} assigned`}
          icon={ClipboardList}
        />
        <StatCard
          label="Exercises"
          value={totalExercises}
          hint="across all routines"
          icon={Dumbbell}
        />
        <StatCard
          label="Total sets"
          value={totalSets}
          hint="planned volume"
          icon={Target}
        />
        <StatCard
          label="Volume logged"
          value={`${loggedVolume.toLocaleString()} kg`}
          hint={`${sessionCount} sessions saved`}
          icon={TrendingUp}
        />
      </div>

      {/* Live Chart.js progression view. Recording a session lives on the
          Progress page, so this dashboard stays read-only. */}
      {progressLoading && progress === null ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-hairline bg-surface-1">
          <LoadingState label="Loading strength progression..." />
        </div>
      ) : (
        <WorkoutProgressChart
          logs={logs}
          title="Strength progression"
          description="Heaviest set per session against total volume — proof of progressive overload."
        />
      )}

      {/* Client-only schedule calendar. Only split labels and rest days are
          shown here; the prescribed exercises live below. */}
      <div className="rounded-lg border border-hairline bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <h3 className="display-sm text-ink">Training calendar</h3>
            <p className="caption mt-1 text-ink-subtle">
              Your coach's weekly split and recovery days
            </p>
          </div>
          {scheduledRoutines[0] && (
            <Badge variant="outline">
              {getSplitLabel(scheduledRoutines[0].splitType)}
            </Badge>
          )}
        </div>
        <div className="p-3 sm:p-5">
          {scheduledRoutines.length > 0 ? (
            <WorkoutCalendar routines={scheduledRoutines} />
          ) : (
            <EmptyState
              title="No schedule yet"
              description="When your coach publishes a weekly routine, your split and rest days will appear here."
            />
          )}
        </div>
      </div>

      {/* Booked sessions (the coach's weekly split ahead of the client) and the
          workout logs saved by the client. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <div>
              <h3 className="display-sm text-ink">Booked sessions</h3>
              <p className="caption mt-1 text-ink-subtle">
                Your coach's scheduled training days
              </p>
            </div>
            <CalendarCheck className="size-4 text-ink-subtle" aria-hidden="true" />
          </div>

          {bookings.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="cap-label text-ink">No sessions booked</p>
              <p className="caption mt-1 text-ink-subtle">
                They will appear as soon as your coach publishes a weekly split.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {bookings.map((booking) => (
                <div
                  key={booking.key}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-12 shrink-0 rounded-sm border border-hairline bg-surface-2 px-1 py-1 text-center">
                      <p className="eyebrow leading-none text-ink-subtle">
                        {booking.weekday}
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-ink tabular-nums">
                        {booking.date.getDate()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {booking.label}
                      </p>
                      <p className="truncate caption text-ink-subtle">
                        {booking.routineName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <h3 className="display-sm text-ink">Recent workout logs</h3>
              <p className="caption mt-1 text-ink-subtle">
                Exercises saved from your prescribed sessions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              nativeButton={false}
              render={<Link to="/dashboard/client/progress" />}
            >
              <Activity className="size-3.5" />
              Open log
            </Button>
          </div>

          {progressLoading && progress === null ? (
            <LoadingState label="Loading workout logs..." />
          ) : progressError ? (
            <ErrorState message={progressError.message} onRetry={refreshProgress} />
          ) : recentLogs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No workouts logged yet"
                description="Save your first session from the progress page and it will show up here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-ink-subtle">
                      {formatProgressDate(log.date, { year: true })}
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-[13px] font-medium text-ink">
                        {log.exerciseName}
                      </p>
                      <p className="truncate caption text-ink-subtle">
                        {log.routineName || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums">{log.sets}</TableCell>
                    <TableCell className="text-right text-ink-subtle tabular-nums">
                      {(log.volume || 0).toLocaleString()} kg
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Today's split plus the full assigned-routine table. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-hairline bg-surface-1 p-5 lg:col-span-1">
          <p className="eyebrow text-ink-subtle">
            Today · {getWeekdayLabel(todayDayOfWeek)}
          </p>

          {todayEntry?.day ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                {todayEntry.day.isRest ? (
                  <Moon className="size-5 text-ink-subtle" aria-hidden="true" />
                ) : (
                  <Dumbbell className="size-5 text-ink" aria-hidden="true" />
                )}
                <h3 className="display-sm text-ink">{todayLabel}</h3>
              </div>
              <p className="caption mt-1 text-ink-subtle">
                {todayEntry.routine.name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {getSplitLabel(todayEntry.routine.splitType)}
                </Badge>
                {!todayEntry.day.isRest && (
                  <>
                    <Badge variant="outline">
                      {todayEntry.day.exercises?.length ?? 0} exercises
                    </Badge>
                    <Badge variant="outline">
                      {todayEntry.routine.coachName
                        ? `Coach ${todayEntry.routine.coachName}`
                        : "Coach assigned"}
                    </Badge>
                  </>
                )}
              </div>
            </>
          ) : nextWorkout ? (
            <>
              <h3 className="display-sm mt-3 text-ink">{nextWorkout.name}</h3>
              <p className="caption mt-1 text-ink-subtle">
                {nextWorkout.goal ||
                  nextWorkout.description ||
                  "Assigned routine"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {nextWorkout.exerciseCount} exercises
                </Badge>
                <Badge variant="outline">{nextWorkout.totalSets} sets</Badge>
                {nextWorkout.coachName && (
                  <Badge variant="outline">Coach {nextWorkout.coachName}</Badge>
                )}
              </div>
            </>
          ) : (
            <p className="caption mt-3 text-ink-subtle">
              No routines assigned yet. Your coach will publish one soon.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <div>
              <h3 className="display-sm text-ink">Assigned routines</h3>
              <p className="caption mt-1 text-ink-subtle">
                Created by your coach and updated in real time
              </p>
            </div>
            <Badge variant="outline">{routines.length} total</Badge>
          </div>

          {routines.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No routines assigned"
                description="Once your coach assigns a routine to your account it will appear here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Routine</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Exercises</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.map((routine) => (
                  <TableRow key={routine.id}>
                    <TableCell className="font-medium">
                      <p className="text-[13px] text-ink">{routine.name}</p>
                      <p className="caption font-normal text-ink-subtle">
                        {getSplitLabel(routine.splitType)}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink-subtle">
                      {routine.goal || "—"}
                    </TableCell>
                    <TableCell>{routine.exerciseCount}</TableCell>
                    <TableCell>{routine.totalSets}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={STATUS_LABELS[routine.status] ?? routine.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Exercise sequence for today's split day (or the next routine when the
          coach has not scheduled today). Ordered by `order`. */}
      {exercisePreview && (
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <div className="border-b border-hairline px-5 py-4">
            <h3 className="display-sm text-ink">{exercisePreview.title}</h3>
            <p className="caption mt-1 text-ink-subtle">
              {exercisePreview.subtitle}
            </p>
          </div>
          <div className="divide-y divide-hairline">
            {exercisePreview.exercises.map((exercise, index) => (
              <div
                key={`${exercise.exerciseId}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center bg-surface-3 text-[12px] font-medium text-ink">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {exercise.name}
                    </p>
                    <p className="truncate caption text-ink-subtle">
                      {exercise.primaryMuscle}
                      {exercise.notes ? ` · ${exercise.notes}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Badge variant="outline">{exercise.sets} sets</Badge>
                  <Badge variant="outline">
                    {exercise.trackingType === "time"
                      ? `${exercise.timeSec ?? 30}s`
                      : `${exercise.reps} reps`}
                  </Badge>
                  <Badge variant="outline">{exercise.restSec}s rest</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
