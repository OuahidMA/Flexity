/**
 * Quick workout logger for the client dashboard.
 *
 * A client names an exercise from the shared catalog (datalist suggestions),
 * then records one weight, a rep target, and how many sets were performed. The
 * form expands that into the per-set shape the progress API expects and saves
 * one ProgressLog for the day. Re-saving the same exercise/date updates that
 * log, so the chart never gains duplicate sessions.
 */
import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { formatProgressDate, todayInputValue } from "@/lib/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_SETS = 20

/**
 * @param {object} props
 * @param {() => void} [props.onSaved] - Refreshes the dashboard chart/history.
 * @returns {JSX.Element} Compact exercise/weight/reps/sets/date form.
 */
export function QuickLogForm({ onSaved }) {
  const { request } = useAuth()
  const { data: exercises, loading: catalogLoading, error: catalogError } =
    useApiData("/exercises")

  const [exerciseName, setExerciseName] = useState("")
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("10")
  const [sets, setSets] = useState("3")
  const [date, setDate] = useState(todayInputValue)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ error: "", success: "" })

  // Dedupe by display name so the datalist never shows the same movement twice.
  const exerciseOptions = useMemo(() => {
    const names = new Set()

    return (exercises ?? [])
      .map((exercise) => exercise.name)
      .filter((name) => {
        if (!name || names.has(name.toLowerCase())) return false
        names.add(name.toLowerCase())
        return true
      })
      .sort((first, second) => first.localeCompare(second))
  }, [exercises])

  /**
   * Resolves the typed name to a catalog row. The API snapshots the catalog
   * exercise id, so free text that is not in the library cannot be logged.
   */
  const findExercise = (name) =>
    (exercises ?? []).find(
      (exercise) =>
        exercise.name.toLowerCase() === name.trim().toLowerCase()
    ) ?? null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ error: "", success: "" })

    if (!exercises) {
      setStatus({
        error: catalogLoading
          ? "Loading the exercise catalog. Try again in a moment."
          : "The exercise catalog is unavailable right now.",
        success: "",
      })
      return
    }

    const exercise = findExercise(exerciseName)

    if (!exercise) {
      setStatus({
        error:
          "Pick an exercise from the suggestions so it can be tracked on your chart.",
        success: "",
      })
      return
    }

    const weightValue = Number(weight)
    const repsValue = Number(reps)
    const setsValue = Number(sets)

    if (!weight || !Number.isFinite(weightValue) || weightValue < 0) {
      setStatus({ error: "Enter the weight lifted.", success: "" })
      return
    }

    if (!Number.isFinite(repsValue) || repsValue < 1) {
      setStatus({ error: "Enter at least one rep per set.", success: "" })
      return
    }

    if (
      !Number.isFinite(setsValue) ||
      setsValue < 1 ||
      setsValue > MAX_SETS
    ) {
      setStatus({
        error: `Sets must be between 1 and ${MAX_SETS}.`,
        success: "",
      })
      return
    }

    if (!date) {
      setStatus({ error: "Choose the workout date.", success: "" })
      return
    }

    const setCount = Math.round(setsValue)
    const repCount = Math.round(repsValue)

    setSaving(true)

    try {
      await request("/client/progress", {
        method: "POST",
        body: {
          date,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          primaryMuscle: exercise.primaryMuscle || "",
          exerciseOrder: 0,
          trackingType: "reps",
          sets: Array.from({ length: setCount }, (_, index) => ({
            setNumber: index + 1,
            reps: repCount,
            timeSec: 0,
            weight: weightValue,
          })),
        },
      })

      setStatus({
        error: "",
        success: `Logged ${setCount} × ${repCount} @ ${weightValue} kg ${exercise.name} for ${formatProgressDate(
          date,
          { year: true }
        )}.`,
      })
      // Keep reps/sets/date for the next exercise, clear the movement itself.
      setExerciseName("")
      setWeight("")
      onSaved?.()
    } catch (error) {
      setStatus({
        error: error.message ?? "Unable to save this workout.",
        success: "",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quick-log-exercise">Exercise name</Label>
        <Input
          id="quick-log-exercise"
          list="quick-log-exercise-options"
          value={exerciseName}
          onChange={(event) => {
            setExerciseName(event.target.value)
            setStatus({ error: "", success: "" })
          }}
          placeholder="Start typing, e.g. Bench Press"
          autoComplete="off"
          required
        />
        <datalist id="quick-log-exercise-options">
          {exerciseOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="caption text-ink-subtle">
          {catalogError
            ? "Exercise catalog unavailable — refresh to try again."
            : `${exerciseOptions.length} exercises available`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="quick-log-weight">Weight (kg)</Label>
          <Input
            id="quick-log-weight"
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value)
              setStatus({ error: "", success: "" })
            }}
            placeholder="60"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-log-reps">Reps per set</Label>
          <Input
            id="quick-log-reps"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={reps}
            onChange={(event) => {
              setReps(event.target.value)
              setStatus({ error: "", success: "" })
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-log-sets">Sets</Label>
          <Input
            id="quick-log-sets"
            type="number"
            min="1"
            max={MAX_SETS}
            step="1"
            inputMode="numeric"
            value={sets}
            onChange={(event) => {
              setSets(event.target.value)
              setStatus({ error: "", success: "" })
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-log-date">Date</Label>
          <Input
            id="quick-log-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setStatus({ error: "", success: "" })
            }}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        {status.error && (
          <p className="caption text-destructive">{status.error}</p>
        )}
        {!status.error && status.success && (
          <p className="caption text-semantic-success">{status.success}</p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={saving}>
          <Plus className="size-4" />
          {saving ? "Saving..." : "Log workout"}
        </Button>
      </div>
    </form>
  )
}

export default QuickLogForm
