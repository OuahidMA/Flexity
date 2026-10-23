/**
 * Set-by-set workout logging table.
 *
 * The component is mounted with a `key` tied to the selected routine/day/date,
 * so a fresh mount always rebuilds the draft from the coach's prescription and
 * any progress already saved for that workout. Typing only mutates local state;
 * saving posts one ProgressLog per exercise.
 */
import { useState } from "react"
import { Save } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { isProgressDate } from "@/lib/progress"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Safety cap for coaches who enter an unusually high set count.
const MAX_SETS = 20

/**
 * @param {unknown} value
 * @returns {number} A safe, positive set count for the logging grid.
 */
function clampSetCount(value) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 3
  return Math.min(Math.max(Math.round(count), 1), MAX_SETS)
}

/**
 * Builds a stable key for one exercise line. `order` distinguishes the same
 * exercise repeated twice in one routine.
 *
 * @param {string} routineId
 * @param {number|null} dayOfWeek
 * @param {object} exercise
 * @param {number} index
 * @returns {string}
 */
function exerciseKey(routineId, dayOfWeek, exercise, index) {
  return [
    routineId,
    dayOfWeek ?? "flat",
    exercise.exerciseId,
    exercise.order ?? index,
  ].join(":")
}

/**
 * @param {object} exercise - Prescribed exercise line.
 * @returns {string} Human-readable target, e.g. "3 sets x 10 reps".
 */
function prescriptionLabel(exercise) {
  const target =
    exercise.trackingType === "time"
      ? `${exercise.timeSec ?? 30}s`
      : `${exercise.reps ?? 10} reps`
  return `${clampSetCount(exercise.sets)} sets x ${target}`
}

/**
 * Builds the editable draft for every exercise in the selected workout.
 *
 * When the client already saved this routine line on the selected date, the
 * saved sets are restored so saving again edits instead of duplicating.
 *
 * @param {Array<object>} exercises - Selected workout's exercise lines.
 * @param {Array<object>} logs - `/client/progress` payload.
 * @param {{ routineId: string, dayOfWeek: number|null, date: string }} context
 * @returns {Record<string, Array<object>>} Draft sets keyed by exercise key.
 */
function buildDraft(exercises, logs, { routineId, dayOfWeek, date }) {
  const draft = {}

  exercises.forEach((exercise, index) => {
    const key = exerciseKey(routineId, dayOfWeek, exercise, index)
    const saved = (logs ?? []).find(
      (log) =>
        String(log.routineId ?? "") === String(routineId) &&
        String(log.exerciseId) === String(exercise.exerciseId) &&
        Number(log.exerciseOrder ?? 0) === Number(exercise.order ?? index) &&
        isProgressDate(log.date, date)
    )
    const savedSets = saved?.trackingData ?? []
    // Always show every prescribed set, and keep any extra sets already saved
    // (for example if the coach later reduced the prescription).
    const setCount = Math.max(
      clampSetCount(exercise.sets),
      Math.min(savedSets.length, MAX_SETS)
    )

    draft[key] = Array.from({ length: setCount }, (_, setIndex) => {
      const savedSet = savedSets[setIndex]

      return {
        reps: String(savedSet?.reps || exercise.reps || 10),
        timeSec: String(savedSet?.timeSec || exercise.timeSec || 30),
        weight:
          savedSet && savedSet.weight != null ? String(savedSet.weight) : "",
        noWeight: savedSet ? savedSet.weight == null : false,
      }
    })
  })

  return draft
}

/**
 * One exercise's set-by-set input rows.
 *
 * The first row carries the exercise and prescription cells with `rowSpan` so
 * the table reads as "exercise -> its sets" while staying a single DOM table.
 *
 * @param {object} props
 * @param {object} props.exercise - Prescribed exercise line.
 * @param {Array<object>} props.sets - Draft sets for this exercise.
 * @param {Record<string, string>} props.errors - Field errors keyed by set.
 * @param {string} props.rowKey - Prefix for React keys and error keys.
 * @param {(index: number, patch: object) => void} props.onChange
 * @returns {JSX.Element} Table rows for the exercise.
 */
function ExerciseSetRows({ exercise, sets, errors, rowKey, onChange }) {
  const isTime = exercise.trackingType === "time"

  return sets.map((set, index) => {
    const setKey = `${rowKey}:${index}`
    const isFirst = index === 0

    return (
      <TableRow key={setKey} className="align-top">
        {isFirst && (
          <>
            <TableCell
              rowSpan={sets.length}
              className="min-w-32 px-3 py-3 align-top transition-colors sm:px-4"
            >
              <p className="text-[13px] font-medium text-ink">{exercise.name}</p>
              <p className="mt-1 caption text-ink-subtle">
                {exercise.primaryMuscle || "Exercise"}
              </p>
              <p className="mt-1 eyebrow text-ink-subtle md:hidden">
                {prescriptionLabel(exercise)}
              </p>
            </TableCell>
            <TableCell
              rowSpan={sets.length}
              className="hidden align-top whitespace-nowrap transition-colors md:table-cell"
            >
              <span className="caption text-ink-subtle">
                {prescriptionLabel(exercise)}
              </span>
              {exercise.notes && (
                <p className="mt-1 max-w-40 eyebrow text-ink-subtle">
                  {exercise.notes}
                </p>
              )}
            </TableCell>
          </>
        )}

        <TableCell className="w-12 px-2 caption text-ink-subtle tabular-nums">
          {index + 1}
        </TableCell>

        <TableCell className="px-2">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="1"
              inputMode="numeric"
              value={isTime ? set.timeSec : set.reps}
              onChange={(event) =>
                onChange(index, {
                  [isTime ? "timeSec" : "reps"]: event.target.value,
                })
              }
              className="h-8 w-16 px-2"
              aria-label={`${
                isTime ? "Seconds" : "Reps"
              } for ${exercise.name}, set ${index + 1}`}
              aria-invalid={Boolean(errors[setKey]) || undefined}
            />
            <span className="eyebrow text-ink-subtle">
              {isTime ? "sec" : "reps"}
            </span>
          </div>
        </TableCell>

        <TableCell className="px-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Input
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              placeholder="kg"
              value={set.noWeight ? "" : set.weight}
              onChange={(event) =>
                onChange(index, { weight: event.target.value })
              }
              disabled={set.noWeight}
              className={
                set.noWeight
                  ? "h-8 w-16 bg-surface-2 px-2 text-ink-subtle sm:w-20"
                  : "h-8 w-16 px-2 sm:w-20"
              }
              aria-label={`Weight for ${exercise.name}, set ${index + 1}`}
              aria-invalid={Boolean(errors[setKey]) || undefined}
            />
            <label
              htmlFor={`no-weight-${rowKey}-${index}`}
              className="flex cursor-pointer items-center gap-1 eyebrow text-ink-subtle"
            >
              <Checkbox
                id={`no-weight-${rowKey}-${index}`}
                checked={set.noWeight}
                onCheckedChange={(checked) =>
                  onChange(index, {
                    noWeight: Boolean(checked),
                    ...(checked ? { weight: "" } : {}),
                  })
                }
                aria-label={`No weight for ${exercise.name}, set ${index + 1}`}
              />
              None
            </label>
          </div>
          {errors[setKey] && (
            <p className="mt-1 max-w-36 caption text-destructive">
              {errors[setKey]}
            </p>
          )}
        </TableCell>
      </TableRow>
    )
  })
}

/**
 * @param {object} props
 * @param {string} props.routineId - Selected routine.
 * @param {number|null} props.dayOfWeek - Selected weekday, null for flat routines.
 * @param {string} props.dayLabel - Split label for the table caption.
 * @param {Array<object>} props.exercises - Prescribed exercise lines.
 * @param {string} props.date - `yyyy-mm-dd` workout date.
 * @param {Array<object>} props.logs - Existing progress for pre-filling today's logs.
 * @param {() => void} [props.onSaved] - Refresh the history after a successful save.
 * @returns {JSX.Element} Editable logging table and save footer.
 */
export function ProgressLogger({
  routineId,
  dayOfWeek,
  dayLabel,
  exercises,
  date,
  logs,
  onSaved,
}) {
  const { request } = useAuth()
  const [draft, setDraft] = useState(() =>
    buildDraft(exercises, logs, { routineId, dayOfWeek, date })
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState({ error: "", success: "" })

  const totalSets = Object.values(draft).reduce(
    (total, sets) => total + sets.length,
    0
  )

  /**
   * Applies a patch to one set. Clearing the field error keeps validation
   * feedback close to the edit that fixed it.
   */
  const updateSet = (key, index, patch) => {
    setDraft((current) => ({
      ...current,
      [key]: (current[key] ?? []).map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set
      ),
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[`${key}:${index}`]
      return next
    })
    // Any edit invalidates the previous save confirmation.
    setSaveState({ error: "", success: "" })
  }

  /**
   * Validates every set, then saves each exercise as its own ProgressLog.
   * Saving is idempotent per routine line and day, so pressing Save twice
   * updates the same entries instead of duplicating them.
   */
  const handleSave = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    const payloads = []

    exercises.forEach((exercise, index) => {
      const key = exerciseKey(routineId, dayOfWeek, exercise, index)
      const isTime = exercise.trackingType === "time"
      const sets = draft[key] ?? []

      const normalizedSets = sets.map((set, setIndex) => {
        const errorKey = `${key}:${setIndex}`
        const metric = Number(isTime ? set.timeSec : set.reps)
        const weight = set.noWeight ? null : Number(set.weight)

        if (!Number.isFinite(metric) || metric < 1) {
          nextErrors[errorKey] = isTime
            ? "Enter a time in seconds"
            : "Enter a rep count"
          return null
        }

        if (
          !set.noWeight &&
          (set.weight === "" || !Number.isFinite(weight) || weight < 0)
        ) {
          nextErrors[errorKey] = "Add a weight or select None"
          return null
        }

        return {
          setNumber: setIndex + 1,
          reps: isTime ? 0 : Math.round(metric),
          timeSec: isTime ? Math.round(metric) : 0,
          weight,
        }
      })

      if (normalizedSets.some((set) => set === null)) return

      payloads.push({
        date,
        routineId,
        dayOfWeek,
        exerciseId: exercise.exerciseId,
        exerciseOrder: exercise.order ?? index,
        trackingType: isTime ? "time" : "reps",
        sets: normalizedSets,
      })
    })

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setSaveState({
        error: "Complete the highlighted sets before saving.",
        success: "",
      })
      return
    }

    if (payloads.length === 0) {
      setSaveState({ error: "Nothing to save yet.", success: "" })
      return
    }

    setSaving(true)
    setSaveState({ error: "", success: "" })

    try {
      await Promise.all(
        payloads.map((payload) =>
          request("/client/progress", { method: "POST", body: payload })
        )
      )
      setSaveState({
        error: "",
        success: "Workout saved. Your coach can see it now.",
      })
      onSaved?.()
    } catch (error) {
      setSaveState({
        error: error.message ?? "Unable to save your workout.",
        success: "",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-5 py-3 caption text-ink-subtle">
        <span className="font-medium text-ink">{dayLabel}</span>
        <span>·</span>
        <span>{exercises.length} exercises</span>
        <span>·</span>
        <span>{totalSets} sets</span>
      </div>

      <div className="overflow-x-auto">
        <Table className="progress-logger-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-3 sm:px-4">Exercise</TableHead>
              <TableHead className="hidden md:table-cell">
                Prescription
              </TableHead>
              <TableHead className="w-12 px-2">Set</TableHead>
              <TableHead className="px-2">Reps / Time</TableHead>
              <TableHead className="px-2">Weight (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise, index) => {
              const key = exerciseKey(
                routineId,
                dayOfWeek,
                exercise,
                index
              )

              return (
                <ExerciseSetRows
                  key={key}
                  rowKey={key}
                  exercise={exercise}
                  sets={draft[key] ?? []}
                  errors={fieldErrors}
                  onChange={(setIndex, patch) =>
                    updateSet(key, setIndex, patch)
                  }
                />
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-4">
        <div className="caption text-ink-subtle">
          {saveState.error && (
            <p className="text-destructive">{saveState.error}</p>
          )}
          {!saveState.error && saveState.success && (
            <p className="text-semantic-success">{saveState.success}</p>
          )}
          {!saveState.error && !saveState.success && (
            <p>
              {exercises.length} exercises · {totalSets} sets · fields
              pre-filled with your coach&apos;s targets
            </p>
          )}
        </div>
        <Button type="submit" className="gap-2" disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save workout"}
        </Button>
      </div>
    </form>
  )
}

export default ProgressLogger
