/**
 * Client progress history.
 *
 * Progress entries are entered and stored in this browser's localStorage; no
 * API call reads or writes the database. The page lists every exercise the
 * coach prescribed so the client can log sets, reps or time, and weight
 * without leaving the page. Bars are scaled against the largest single-session
 * volume so small values stay visible.
 */
import { useMemo, useState } from "react"
import { Activity, CalendarDays, Dumbbell, Plus, TrendingUp } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { addProgressLog, createLocalId, getProgressLogs } from "@/lib/local-store"
import { DataTable } from "@/components/data-table"
import { EmptyState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * @returns {string} Today's date as a local `yyyy-mm-dd` input value.
 */
function todayInputValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * @returns {object} A blank log-session form.
 */
function emptyForm() {
  return {
    exerciseName: "",
    date: todayInputValue(),
    sets: "3",
    trackingType: "reps",
    reps: "10",
    timeSec: "30",
    weight: "0",
    noWeight: false,
  }
}

/**
 * Flattens a routine's schedule into exercise rows, keeping the day label for
 * context when the routine uses weekly days.
 *
 * @param {object} routine - Routine returned by the API.
 * @returns {object[]} Exercises with their day label.
 */
function getRoutineExercises(routine) {
  const days = (routine.days ?? []).filter((day) => !day.isRest)

  if (days.length === 0) {
    return (routine.exercises ?? []).map((exercise) => ({
      ...exercise,
      dayLabel: "",
    }))
  }

  return days.flatMap((day) =>
    (day.exercises ?? []).map((exercise) => ({
      ...exercise,
      dayLabel: day.label ?? "",
    }))
  )
}

/**
 * @param {object} exercise - API exercise line.
 * @returns {string} Human-readable prescription.
 */
function prescriptionLabel(exercise) {
  const target =
    exercise.trackingType === "time"
      ? `${exercise.timeSec ?? 30}s`
      : `${exercise.reps ?? 10} reps`
  return `${exercise.sets ?? 3} × ${target}`
}

/**
 * One coach-prescribed exercise with inline local logging. The target input is
 * driven by the coach's tracking mode: reps for strength, seconds for timed
 * work. Checking "None" greys out the weight field and logs no external load.
 *
 * @param {object} props
 * @param {object} props.exercise - Prescribed exercise.
 * @param {(entry: { sets: number, target: number, weight: number|null }) => void} props.onLog
 * @returns {JSX.Element} Table row.
 */
function PrescriptionRow({ exercise, onLog }) {
  const isTime = exercise.trackingType === "time"
  const [sets, setSets] = useState(String(exercise.sets ?? 3))
  const [target, setTarget] = useState(
    String(isTime ? (exercise.timeSec ?? 30) : (exercise.reps ?? 10))
  )
  const [weight, setWeight] = useState("0")
  const [noWeight, setNoWeight] = useState(false)
  const [error, setError] = useState("")

  const handleLog = () => {
    const setsValue = Number(sets)
    const targetValue = Number(target)
    const weightValue = noWeight ? null : Number(weight)

    if (setsValue < 1 || targetValue < 1) {
      setError("Enter valid sets and target.")
      return
    }

    if (!noWeight && (weight === "" || !Number.isFinite(weightValue))) {
      setError("Enter a weight or choose None.")
      return
    }

    setError("")
    onLog({ sets: setsValue, target: targetValue, weight: weightValue })
  }

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-36">
          <p className="font-bold">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.primaryMuscle || "Exercise"}
            {exercise.dayLabel ? ` · ${exercise.dayLabel}` : ""}
          </p>
        </div>
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <span className="text-xs font-medium text-muted-foreground">
          {prescriptionLabel(exercise)}
        </span>
      </TableCell>

      <TableCell>
        <Input
          type="number"
          min="1"
          value={sets}
          onChange={(event) => setSets(event.target.value)}
          className="h-9 w-20"
          aria-label={`Sets for ${exercise.name}`}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="h-9 w-20"
            aria-label={`${isTime ? "Seconds" : "Reps"} for ${exercise.name}`}
          />
          <span className="text-xs text-muted-foreground">
            {isTime ? "sec" : "reps"}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.5"
            value={noWeight ? "" : weight}
            onChange={(event) => setWeight(event.target.value)}
            disabled={noWeight}
            className={
              noWeight
                ? "h-9 w-24 bg-muted/50 text-muted-foreground"
                : "h-9 w-24"
            }
            aria-label={`Weight for ${exercise.name}`}
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox
              checked={noWeight}
              onCheckedChange={(checked) => {
                setNoWeight(Boolean(checked))
                setError("")
              }}
            />
            None
          </label>
        </div>
      </TableCell>

      <TableCell>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleLog}
        >
          Log
        </Button>
        {error && (
          <p className="mt-1 text-[10px] text-destructive">{error}</p>
        )}
      </TableCell>
    </TableRow>
  )
}

/**
 * @returns {JSX.Element} Progress KPIs, prescribed exercises, volume chart, and check-in table.
 */
export default function ClientProgress() {
  const { user } = useAuth()
  const [entries, setEntries] = useState(() => getProgressLogs(user?.id))

  // Assigned workouts supply the coach's prescription. Progress itself never
  // touches the API.
  const { data: workouts } = useApiData("/client/workouts")

  const prescribedExercises = useMemo(() => {
    const seen = new Set()
    const rows = []

    for (const routine of workouts ?? []) {
      for (const exercise of getRoutineExercises(routine)) {
        const name = exercise.name?.trim()
        if (!name) continue
        const key = (exercise.exerciseId || name).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)

        const trackingType =
          exercise.trackingType === "time" ? "time" : "reps"
        const reps = exercise.reps ?? 10
        const timeSec = exercise.timeSec ?? 30

        rows.push({
          key: `${routine.id}-${key}-${trackingType}-${reps}-${timeSec}`,
          name,
          primaryMuscle: exercise.primaryMuscle ?? "",
          sets: exercise.sets ?? 3,
          trackingType,
          reps,
          timeSec,
          dayLabel: exercise.dayLabel,
        })
      }
    }

    return rows
  }, [workouts])

  const exerciseOptions = prescribedExercises

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")

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

  const openDialog = () => {
    setForm(emptyForm())
    setFormError("")
    setDialogOpen(true)
  }

  const handlePrescriptionLog = (exercise, { sets, target, weight }) => {
    const isTime = exercise.trackingType === "time"
    const log = {
      id: createLocalId(),
      date: new Date().toISOString(),
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      sets,
      trackingType: exercise.trackingType,
      reps: isTime ? 0 : target,
      timeSec: isTime ? target : 0,
      weight,
      weightMode: weight == null ? "none" : "kg",
      volume: isTime || weight == null ? 0 : sets * weight * target,
    }

    setEntries(addProgressLog(user?.id, log))
  }

  const handleExerciseNameChange = (event) => {
    const exerciseName = event.target.value
    const match = exerciseOptions.find(
      (option) => option.name.toLowerCase() === exerciseName.trim().toLowerCase()
    )

    setForm((current) => ({
      ...current,
      exerciseName,
      ...(match
        ? {
            trackingType: match.trackingType,
            reps: String(match.reps),
            timeSec: String(match.timeSec),
          }
        : {}),
    }))
  }

  const handleLog = (event) => {
    event.preventDefault()

    const exerciseName = form.exerciseName.trim()
    const sets = Number(form.sets)
    const isTime = form.trackingType === "time"
    const target = Number(isTime ? form.timeSec : form.reps)
    const weight = form.noWeight ? null : Number(form.weight)

    if (!exerciseName) {
      setFormError("Enter or pick an exercise.")
      return
    }

    if (
      !form.date ||
      sets < 1 ||
      target < 1 ||
      (!form.noWeight &&
        (form.weight === "" || !Number.isFinite(weight) || weight < 0))
    ) {
      setFormError("Enter a valid date, sets, target, and weight.")
      return
    }

    // Noon avoids timezone shifts when formatting the stored date back out.
    const match = exerciseOptions.find(
      (option) => option.name.toLowerCase() === exerciseName.toLowerCase()
    )

    const log = {
      id: createLocalId(),
      date: new Date(`${form.date}T12:00:00`).toISOString(),
      exerciseName,
      primaryMuscle: match?.primaryMuscle ?? "",
      sets,
      trackingType: isTime ? "time" : "reps",
      reps: isTime ? 0 : target,
      timeSec: isTime ? target : 0,
      weight,
      weightMode: weight == null ? "none" : "kg",
      volume: isTime || weight == null ? 0 : sets * weight * target,
    }

    setEntries(addProgressLog(user?.id, log))
    setDialogOpen(false)
  }

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
          <span className="font-bold">{row.getValue("exerciseName")}</span>
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
        header: "Reps / Time",
        id: "target",
        cell: ({ row }) => {
          const log = row.original
          if (log.trackingType === "time") return `${log.timeSec ?? 0}s`
          if (log.reps == null) return "—"
          return `${log.reps} reps`
        },
        size: 120,
      },
      {
        header: "Weight",
        id: "weight",
        cell: ({ row }) => {
          const log = row.original
          if (log.weightMode === "none" || log.weight == null) {
            return log.weightMode === "none" ? "None" : "—"
          }
          return `${log.weight} kg`
        },
        size: 110,
      },
      {
        header: "Volume",
        accessorKey: "volume",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden bg-muted">
              <div
                className="h-full bg-primary"
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

  const isTime = form.trackingType === "time"

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client workspace"
        title="Progress"
        description="Log sets, reps or time, and weight for the exercises your coach prescribed. Entries stay in this browser."
        actions={
          <Button className="gap-2" onClick={openDialog}>
            <Plus className="size-4" />
            Log session
          </Button>
        }
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

      {prescribedExercises.length > 0 && (
        <div className="border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="text-sm font-bold">Coach plan</h3>
            <p className="text-xs text-muted-foreground">
              Every prescribed exercise. The input follows your coach's reps or
              time setting; choose None when no weight applies.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead>Reps / Time</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Log</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescribedExercises.map((exercise) => (
                  <PrescriptionRow
                    key={exercise.key}
                    exercise={exercise}
                    onLog={(payload) =>
                      handlePrescriptionLog(exercise, payload)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          title="No progress logged yet"
          description="Log a prescribed exercise above or add a custom session. Everything you log stays in this browser."
          action={
            <Button className="gap-2" onClick={openDialog}>
              <Plus className="size-4" />
              Log session
            </Button>
          }
        />
      ) : (
        <>
          {/* Chronological bar chart (entries are stored newest first). */}
          <div className="border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-bold">Volume trend</h3>
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
                        className="w-full bg-primary/70 transition-colors hover:bg-primary"
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
          <div className="border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-bold">Check-in history</h3>
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

      {/* Local-only custom session logger. */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log session</DialogTitle>
            <DialogDescription>
              Record one exercise from your session. Saved in this browser only.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLog} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progress-exercise">Exercise</Label>
              <Input
                id="progress-exercise"
                list="progress-exercise-options"
                value={form.exerciseName}
                onChange={handleExerciseNameChange}
                placeholder="Bench press"
                required
              />
              <datalist id="progress-exercise-options">
                {exerciseOptions.map((option) => (
                  <option key={option.key} value={option.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="progress-date">Date</Label>
                <Input
                  id="progress-date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress-tracking">Tracking</Label>
                <select
                  id="progress-tracking"
                  value={form.trackingType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      trackingType: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xs border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none focus-visible:border-primary"
                >
                  <option value="reps">Reps</option>
                  <option value="time">Time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="progress-sets">Sets</Label>
                <Input
                  id="progress-sets"
                  type="number"
                  min="1"
                  value={form.sets}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sets: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="progress-weight">Weight (kg)</Label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      checked={form.noWeight}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          noWeight: Boolean(checked),
                        }))
                      }
                    />
                    None
                  </label>
                </div>
                <Input
                  id="progress-weight"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.noWeight ? "" : form.weight}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weight: event.target.value,
                    }))
                  }
                  disabled={form.noWeight}
                  className={
                    form.noWeight
                      ? "bg-muted/50 text-muted-foreground"
                      : undefined
                  }
                  required={!form.noWeight}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress-target">
                  {isTime ? "Time (sec)" : "Reps"}
                </Label>
                <Input
                  id="progress-target"
                  type="number"
                  min="1"
                  value={isTime ? form.timeSec : form.reps}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [isTime ? "timeSec" : "reps"]: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-xs border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
