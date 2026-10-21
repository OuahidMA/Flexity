/**
 * Client home: the workouts a coach has assigned to the signed-in user.
 *
 * Loads `/client/workouts` once, derives summary metrics from the routine list,
 * highlights the next active routine, and shows the prescribed exercise order.
 * All mutations happen on the coach side; this page is read-only.
 */
import { Link } from "react-router-dom"
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Moon,
  Target,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import {
  getSplitLabel,
  getWeekdayLabel,
} from "@/lib/workout-splits"
import { WorkoutCalendar } from "@/components/workout/workout-calendar"
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

      {/* Summary KPIs derived from the assigned routines. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Routines"
          value={routines.length}
          hint="assigned by your coach"
          icon={ClipboardList}
        />
        <StatCard
          label="Active"
          value={active.length}
          hint="currently running"
          icon={CalendarDays}
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
      </div>

      {/* Client-only schedule calendar. Only split labels and rest days are
          shown here; the prescribed exercises live below. */}
      <div className="border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="text-sm font-bold">Training calendar</h3>
            <p className="text-xs text-muted-foreground">
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

      {/* Today's split plus the full assigned-routine table. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border bg-card p-5 lg:col-span-1">
          <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">
            Today · {getWeekdayLabel(todayDayOfWeek)}
          </p>

          {todayEntry?.day ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                {todayEntry.day.isRest ? (
                  <Moon className="size-5 text-muted-foreground" />
                ) : (
                  <Dumbbell className="size-5 text-primary" />
                )}
                <h3 className="text-xl font-bold">{todayLabel}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
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
              <h3 className="mt-3 text-xl font-bold">{nextWorkout.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
            <p className="mt-3 text-sm text-muted-foreground">
              No routines assigned yet. Your coach will publish one soon.
            </p>
          )}
        </div>

        <div className="border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-bold">Assigned routines</h3>
              <p className="text-xs text-muted-foreground">
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
                    <TableCell className="font-bold">
                      <p>{routine.name}</p>
                      <p className="text-xs font-normal text-muted-foreground">
                        {getSplitLabel(routine.splitType)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
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
        <div className="border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="text-sm font-bold">{exercisePreview.title}</h3>
            <p className="text-xs text-muted-foreground">
              {exercisePreview.subtitle}
            </p>
          </div>
          <div className="divide-y">
            {exercisePreview.exercises.map((exercise, index) => (
              <div
                key={`${exercise.exerciseId}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center bg-muted text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {exercise.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {exercise.primaryMuscle}
                      {exercise.notes ? ` · ${exercise.notes}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
