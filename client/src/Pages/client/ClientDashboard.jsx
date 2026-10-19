/**
 * Client home: the workouts a coach has assigned to the signed-in user.
 *
 * Loads `/client/workouts` once, derives summary metrics from the routine list,
 * highlights the next active routine, and shows the prescribed exercise order.
 * All mutations happen on the coach side; this page is read-only.
 */
import { Link } from "react-router-dom"
import { CalendarDays, ClipboardList, Dumbbell, Target } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client workspace"
        title={`Welcome back, ${firstName}`}
        description="Your coach's routines, exercise order, and training volume at a glance."
        actions={
          <Button
            variant="outline"
            className="gap-2"
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

      {/* Next session highlight plus the full assigned-routine table. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-1">
          <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
            Next session
          </p>

          {nextWorkout ? (
            <>
              <h3 className="mt-3 text-xl font-semibold">{nextWorkout.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextWorkout.goal || nextWorkout.description || "Assigned routine"}
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

        <div className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Assigned routines</h3>
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
                    <TableCell className="font-medium">{routine.name}</TableCell>
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

      {/* Exercise sequence for the next/active routine, ordered by `order`. */}
      {nextWorkout && nextWorkout.exercises.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="text-sm font-semibold">
              {nextWorkout.name} — exercise order
            </h3>
            <p className="text-xs text-muted-foreground">
              Follow the sequence exactly as prescribed
            </p>
          </div>
          <div className="divide-y">
            {[...nextWorkout.exercises]
              .sort((a, b) => a.order - b.order)
              .map((exercise, index) => (
                <div
                  key={`${exercise.exerciseId}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
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
                    <Badge variant="outline">{exercise.reps} reps</Badge>
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
