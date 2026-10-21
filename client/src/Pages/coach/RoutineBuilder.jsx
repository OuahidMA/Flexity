/**
 * Create/edit screen for a workout routine.
 *
 * The outer `RoutineBuilder` handles the route param and loads an existing
 * routine (edit mode) before mounting `RoutineEditor`. The editor owns a local,
 * editable copy of the weekly schedule and its ordered exercise rows so the
 * coach can:
 *
 * 1. Pick a split type (push/pull/legs, full body, upper/lower, or a combined
 *    upper/lower/push/pull/legs split).
 * 2. Mark every weekday as a workout day or a rest day, and name the split part
 *    for workout days.
 * 3. Prescribe ordered exercises per workout day.
 * 4. Save the routine as a full week or as a single day.
 *
 * A save sends the whole routine payload in one request (POST for new, PUT when
 * editing) and then returns to the list.
 */
import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Table, IconButton, Input as RsuiteInput, NumberInput } from "rsuite"
import {
  VscArrowDown,
  VscArrowUp,
  VscEdit,
  VscRemove,
  VscSave,
} from "react-icons/vsc"
import { ArrowLeft, CalendarDays, Plus, Save, Search } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { getLocalExercises } from "@/lib/local-store"
import {
  SPLIT_TYPES,
  WEEKDAYS,
  buildDefaultWeek,
  getDefaultDayLabel,
  getSplit,
  getWeekdayLabel,
} from "@/lib/workout-splits"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const { Column, HeaderCell, Cell } = Table

const EDITOR_STYLES = `
.routine-table .table-cell-editing .rs-table-cell-content {
  padding: 4px;
}
.routine-table .table-cell-editing .rs-input {
  width: 100%;
}
`

const SELECT_CLASS =
  "h-10 w-full rounded-xs border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"

// Client-only row keys. A routine can contain the same exercise twice, so the
// API exercise id cannot be used as the React/RSuite row key.
let rowSequence = 0

/**
 * @returns {string} A unique id for a locally edited exercise row.
 */
function createRowId() {
  rowSequence += 1
  return `row-${Date.now()}-${rowSequence}`
}

/**
 * @param {Array<object>|null|undefined} exercises
 * @returns {Array<object>} Exercise rows augmented with local UI state.
 */
function hydrateExercises(exercises) {
  return (exercises ?? []).map((exercise) => ({
    ...exercise,
    trackingType: exercise.trackingType === "time" ? "time" : "reps",
    reps: exercise.reps ?? 10,
    timeSec: exercise.timeSec ?? 30,
    id: createRowId(),
    editing: false,
  }))
}

/**
 * Seeds the editor from an existing routine or a fresh split.
 *
 * Saved routines normally contain all seven weekdays. Sparse or older data is
 * filled out with defaults so the weekly grid is always complete. A legacy
 * routine with only a flat exercise list places those exercises on the first
 * workout day.
 *
 * @param {object|null|undefined} initialRoutine
 * @returns {Array<object>} Weekly day objects with hydrated exercise rows.
 */
function buildInitialDays(initialRoutine) {
  const splitType = initialRoutine?.splitType ?? "push_pull_legs"
  const scheduleMode = initialRoutine?.scheduleMode === "day" ? "day" : "week"
  const savedDays = (initialRoutine?.days ?? []).map((day) => {
    const dayOfWeek = Number(day.dayOfWeek)
    const safeDay = Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6
      ? dayOfWeek
      : 1
    const isRest = Boolean(day.isRest)

    return {
      dayOfWeek: safeDay,
      isRest,
      label:
        day.label ||
        (isRest
          ? "Rest"
          : getDefaultDayLabel(splitType, safeDay) === "Rest"
            ? getSplit(splitType).parts[0]
            : getDefaultDayLabel(splitType, safeDay)),
      exercises: hydrateExercises(day.exercises),
    }
  })

  if (scheduleMode === "day") {
    const saved = savedDays[0]
    return [
      saved ?? {
        dayOfWeek: 1,
        isRest: false,
        label: getSplit(splitType).parts[0],
        exercises: [],
      },
    ]
  }

  const base = buildDefaultWeek(splitType).map((day) => ({
    ...day,
    exercises: [],
  }))

  if (savedDays.length > 0) {
    const savedByDay = new Map(savedDays.map((day) => [day.dayOfWeek, day]))
    return base.map((day) => {
      const saved = savedByDay.get(day.dayOfWeek)
      return saved ? { ...day, ...saved } : day
    })
  }

  // Legacy routine: promote the flat exercise list onto the first workout day.
  const legacyExercises = hydrateExercises(initialRoutine?.exercises)
  if (legacyExercises.length > 0) {
    const firstWorkout = base.find((day) => !day.isRest) ?? base[0]
    firstWorkout.isRest = false
    firstWorkout.label = getSplit(splitType).parts[0]
    firstWorkout.exercises = legacyExercises
  }

  return base
}

/**
 * RSuite table cell that swaps between a text/number input and plain text based
 * on the row's `editing` flag. Only one row is in edit mode at a time (enforced
 * by `toggleEditing`).
 *
 * @param {object} props
 * @param {object} props.rowData - Local row including `id`, `editing`, and value.
 * @param {string} props.dataKey - Field being edited (sets/reps/restSec/notes).
 * @param {"string"|"number"} [props.dataType="string"] - Input control type.
 * @param {(id: string, key: string, value: any) => void} props.onChange - Row
 *   update callback supplied by the editor.
 * @returns {JSX.Element} RSuite cell content.
 */
function EditableCell({ rowData, dataKey, dataType = "string", onChange, ...props }) {
  const editing = rowData.editing
  const value = rowData[dataKey]

  return (
    <Cell {...props} className={editing ? "table-cell-editing" : undefined}>
      {editing ? (
        dataType === "number" ? (
          <NumberInput
            value={value}
            onChange={(nextValue) => onChange(rowData.id, dataKey, nextValue)}
            min={0}
            style={{ width: "100%" }}
          />
        ) : (
          <RsuiteInput
            value={value ?? ""}
            onChange={(nextValue) => onChange(rowData.id, dataKey, nextValue)}
            style={{ width: "100%" }}
          />
        )
      ) : dataType === "number" ? (
        value
      ) : (
        value || <span className="text-muted-foreground">—</span>
      )}
    </Cell>
  )
}

/**
 * Renders the prescription value that corresponds to the row's tracking mode:
 * repetitions for "reps", seconds for "time".
 *
 * @param {object} props
 * @param {object} props.rowData - Local exercise row.
 * @param {(id: string, key: string, value: any) => void} props.onChange
 * @returns {JSX.Element} Editable reps or time value.
 */
function TrackingValueCell({ rowData, onChange, ...props }) {
  const isTime = rowData.trackingType === "time"
  const dataKey = isTime ? "timeSec" : "reps"
  const value = rowData[dataKey]

  return (
    <Cell {...props} className={rowData.editing ? "table-cell-editing" : undefined}>
      {rowData.editing ? (
        <NumberInput
          value={value}
          onChange={(nextValue) => onChange(rowData.id, dataKey, nextValue)}
          min={1}
          style={{ width: "100%" }}
        />
      ) : isTime ? (
        `${value ?? 30}s`
      ) : (
        `${value ?? 10} reps`
      )}
    </Cell>
  )
}

/**
 * One row in the coach's weekly schedule grid.
 *
 * @param {object} props
 * @param {object} props.day - `{ dayOfWeek, isRest, label, exercises }`.
 * @param {{ parts: string[] }} props.split - Active split definition.
 * @param {boolean} props.active - Whether this day is open in the editor.
 * @param {boolean} [props.showWeekdaySelect] - Used by single-day mode.
 * @param {(dayOfWeek: number) => void} props.onSelect
 * @param {(dayOfWeek: number, value: string) => void} props.onTypeChange
 * @param {(dayOfWeek: number, label: string) => void} props.onLabelChange
 * @param {(dayOfWeek: number, nextWeekday: string) => void} props.onWeekdayChange
 * @returns {JSX.Element} Schedule controls for one day.
 */
function ScheduleDayRow({
  day,
  split,
  active,
  showWeekdaySelect = false,
  onSelect,
  onTypeChange,
  onLabelChange,
  onWeekdayChange,
}) {
  const exerciseCount = day.exercises?.length ?? 0

  return (
    <div
      className={`grid gap-3 px-4 py-3 sm:grid-cols-[minmax(130px,170px)_130px_minmax(0,1fr)_110px_auto] sm:items-center ${
        active ? "bg-surface-2" : ""
      }`}
    >
      {showWeekdaySelect ? (
        <select
          value={day.dayOfWeek}
          onChange={(event) => onWeekdayChange(day.dayOfWeek, event.target.value)}
          className={SELECT_CLASS}
          aria-label="Weekday"
        >
          {WEEKDAYS.map((weekday) => (
            <option key={weekday.value} value={weekday.value}>
              {weekday.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {getWeekdayLabel(day.dayOfWeek)}
          </p>
          <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {day.isRest ? "Recovery" : day.label}
          </p>
        </div>
      )}

      <select
        value={day.isRest ? "rest" : "workout"}
        onChange={(event) => onTypeChange(day.dayOfWeek, event.target.value)}
        className={SELECT_CLASS}
        aria-label={`${getWeekdayLabel(day.dayOfWeek)} type`}
      >
        <option value="workout">Workout</option>
        <option value="rest">Rest</option>
      </select>

      <select
        value={day.isRest ? "Rest" : day.label}
        onChange={(event) => onLabelChange(day.dayOfWeek, event.target.value)}
        disabled={day.isRest}
        className={SELECT_CLASS}
        aria-label={`${getWeekdayLabel(day.dayOfWeek)} split`}
      >
        {/* "Rest" is only selectable through the type control above. */}
        {day.isRest && <option value="Rest">Rest</option>}
        {split.parts.map((part) => (
          <option key={part} value={part}>
            {part}
          </option>
        ))}
        {!day.isRest && day.label && !split.parts.includes(day.label) && (
          <option value={day.label}>{day.label}</option>
        )}
      </select>

      <span className="text-xs text-muted-foreground">
        {day.isRest
          ? "No training"
          : `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`}
      </span>

      <Button
        type="button"
        size="sm"
        variant={active ? "default" : "outline"}
        onClick={() => onSelect(day.dayOfWeek)}
      >
        {active ? "Editing" : day.isRest ? "View" : "Edit"}
      </Button>
    </div>
  )
}

/**
 * Stateful editor for a new or existing routine.
 *
 * Data flow:
 * 1. Load the exercise catalog and the coach's clients for the pickers.
 * 2. Seed the split, schedule mode, and weekly days from `initialRoutine`
 *    exactly once; the outer component remounts this editor via `key` when the
 *    record changes.
 * 3. All day/row edits are local until `handleSave` builds the ordered payload.
 *
 * @param {object} props
 * @param {string|undefined} props.routineId - Present when editing.
 * @param {boolean} props.isEditing - Chooses POST vs PUT on save.
 * @param {object|null|undefined} props.initialRoutine - Loaded routine, if any.
 * @returns {JSX.Element} Metadata form, weekly schedule, and day exercise editor.
 */
function RoutineEditor({ routineId, isEditing, initialRoutine }) {
  const navigate = useNavigate()
  const { user, request } = useAuth()

  // Exercise catalog powers the add panel; clients populate the assignment
  // select. Both are scoped to the coach/gym by the API. Browser-local custom
  // exercises are merged in so they can be prescribed like catalog entries.
  const {
    data: exercises,
    loading: exercisesLoading,
    error: exercisesError,
    refresh: refreshExercises,
  } = useApiData("/exercises")
  const { data: clients } = useApiData("/coach/clients")

  const catalog = useMemo(
    () => [...(exercises ?? []), ...getLocalExercises(user?.id)],
    [exercises, user?.id]
  )

  // Metadata fields are controlled locally; `initialRoutine` seeds the edit form.
  const [name, setName] = useState(initialRoutine?.name ?? "")
  const [goal, setGoal] = useState(initialRoutine?.goal ?? "")
  const [description, setDescription] = useState(
    initialRoutine?.description ?? ""
  )
  const [clientId, setClientId] = useState(initialRoutine?.clientId ?? "")
  const [splitType, setSplitType] = useState(
    initialRoutine?.splitType ?? "push_pull_legs"
  )
  const [scheduleMode, setScheduleMode] = useState(
    initialRoutine?.scheduleMode === "day" ? "day" : "week"
  )

  const initialDays = useMemo(() => buildInitialDays(initialRoutine), [initialRoutine])
  const [days, setDays] = useState(initialDays)
  const [activeDay, setActiveDay] = useState(() => {
    const first = initialDays.find((day) => !day.isRest) ?? initialDays[0]
    return first?.dayOfWeek ?? 1
  })

  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const split = getSplit(splitType)
  const activeDayData =
    days.find((day) => day.dayOfWeek === activeDay) ?? days[0]
  const rows = activeDayData?.exercises ?? []
  const activeDayName = activeDayData
    ? getWeekdayLabel(activeDayData.dayOfWeek)
    : ""

  // Search spans name and both muscle groups so coaches can find movements by
  // body part, not just by exact exercise name.
  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = catalog

    if (!term) return list

    return list.filter((exercise) =>
      `${exercise.name} ${exercise.primaryMuscle} ${(exercise.secondaryMuscles ?? []).join(" ")}`
        .toLowerCase()
        .includes(term)
    )
  }, [catalog, search])

  const updateDay = (dayOfWeek, updater) => {
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? updater(day) : day
      )
    )
  }

  const updateActiveExercises = (updater) => {
    if (!activeDayData || activeDayData.isRest) return

    updateDay(activeDay, (day) => ({
      ...day,
      exercises: updater(day.exercises),
    }))
  }

  // Apply the new split's default rotation while preserving rest days and each
  // day's prescribed exercises.
  const handleSplitChange = (nextSplitType) => {
    const nextSplit = getSplit(nextSplitType)
    setSplitType(nextSplitType)
    setDays((current) =>
      current.map((day) => {
        if (day.isRest) return { ...day, label: "Rest" }

        const defaultLabel = getDefaultDayLabel(
          nextSplitType,
          day.dayOfWeek
        )
        const label =
          defaultLabel === "Rest" ? nextSplit.parts[0] : defaultLabel
        return { ...day, label }
      })
    )
  }

  // Switching to a single day keeps the currently edited day. Switching back to
  // a week restores a full Monday-first grid and preserves matching days.
  const handleModeChange = (nextMode) => {
    setScheduleMode(nextMode)

    if (nextMode === "day") {
      setDays((current) => {
        const chosen =
          current.find((day) => day.dayOfWeek === activeDay) ??
          current.find((day) => !day.isRest) ??
          current[0]
        return chosen ? [chosen] : []
      })
      return
    }

    setDays((current) => {
      const base = buildDefaultWeek(splitType).map((day) => ({
        ...day,
        exercises: [],
      }))
      const existing = new Map(current.map((day) => [day.dayOfWeek, day]))
      return base.map((day) => {
        const saved = existing.get(day.dayOfWeek)
        return saved ? { ...day, ...saved } : day
      })
    })
  }

  const handleDayTypeChange = (dayOfWeek, value) => {
    const isRest = value === "rest"
    updateDay(dayOfWeek, (day) => ({
      ...day,
      isRest,
      label: isRest
        ? "Rest"
        : split.parts.includes(day.label)
          ? day.label
          : split.parts[0],
    }))
    setActiveDay(dayOfWeek)
  }

  const handleDayLabelChange = (dayOfWeek, label) => {
    updateDay(dayOfWeek, (day) => ({ ...day, label }))
  }

  const handleWeekdayChange = (dayOfWeek, nextWeekday) => {
    const value = Number(nextWeekday)
    updateDay(dayOfWeek, (day) => ({ ...day, dayOfWeek: value }))
    setActiveDay(value)
  }

  // Append a catalog exercise with default prescription values and immediately
  // enter edit mode so the coach can adjust sets/reps without an extra click.
  const addExercise = (exercise) => {
    if (!activeDayData || activeDayData.isRest) return

    updateActiveExercises((current) => [
      ...current,
      {
        id: createRowId(),
        exerciseId: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        sets: 3,
        trackingType: "reps",
        reps: 10,
        timeSec: 30,
        restSec: 60,
        notes: "",
        editing: true,
      },
    ])
  }

  // Immutable row updates keep RSuite's rendered data in sync with React state.
  const updateRow = (id, key, value) => {
    updateActiveExercises((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    )
  }

  // Toggle the target row and force every other row out of edit mode, which
  // mirrors an inline "save row" interaction.
  const toggleEditing = (id) => {
    updateActiveExercises((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, editing: !row.editing }
          : { ...row, editing: false }
      )
    )
  }

  const removeRow = (id) => {
    updateActiveExercises((current) =>
      current.filter((row) => row.id !== id)
    )
  }

  // Reorder by splicing within the array. Bounds checks make the up/down buttons
  // safe even if the UI state is stale. Array order becomes `order` on save.
  const moveRow = (id, direction) => {
    updateActiveExercises((current) => {
      const index = current.findIndex((row) => row.id === id)
      const target = index + direction

      if (index < 0 || target < 0 || target >= current.length) return current

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  /**
   * Validate, serialize, and persist the routine.
   *
   * Every weekday is sent with its rest/workout state and its own ordered
   * exercises. The server also builds a flat compatibility list.
   */
  const handleSave = async () => {
    setSaveError("")

    if (!name.trim()) {
      setSaveError("Give the routine a name before saving.")
      return
    }

    const scheduledExercises = days.reduce(
      (total, day) =>
        total + (day.isRest ? 0 : day.exercises?.length ?? 0),
      0
    )

    if (scheduledExercises === 0) {
      setSaveError("Add at least one exercise to a workout day.")
      return
    }

    setSaving(true)

    const payload = {
      name: name.trim(),
      goal: goal.trim(),
      description: description.trim(),
      clientId: clientId || null,
      status: "active",
      splitType,
      scheduleMode,
      days: days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        isRest: day.isRest,
        label: day.isRest ? "Rest" : day.label,
        exercises: day.isRest
          ? []
          : (day.exercises ?? []).map((row, index) => ({
              exerciseId: row.exerciseId,
              sets: Number(row.sets) || 1,
              trackingType: row.trackingType === "time" ? "time" : "reps",
              reps: Number(row.reps) || 10,
              timeSec: Number(row.timeSec) || 30,
              restSec: Number(row.restSec) || 0,
              notes: row.notes ?? "",
              order: index,
            })),
      })),
    }

    try {
      if (isEditing) {
        await request(`/routines/${routineId}`, {
          method: "PUT",
          body: payload,
        })
      } else {
        await request("/routines", { method: "POST", body: payload })
      }

      navigate("/dashboard/coach/routines")
    } catch (error) {
      setSaveError(error.message ?? "Unable to save the routine.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Scoped tweak so RSuite's inline editor input fills the cell. */}
      <style>{EDITOR_STYLES}</style>

      <PageHeader
        eyebrow="Coach workspace"
        title={isEditing ? "Edit routine" : "Create routine"}
        description="Choose a split, mark every day as training or rest, then build the exercise order for each workout day."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              nativeButton={false}
              render={<Link to="/dashboard/coach/routines" />}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save routine"}
            </Button>
          </div>
        }
      />

      {/* Routine metadata: name, split, client assignment, and description. */}
      <div className="border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine name</Label>
            <Input
              id="routine-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Upper body strength — Phase 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-split">Routine type</Label>
            <select
              id="routine-split"
              value={splitType}
              onChange={(event) => handleSplitChange(event.target.value)}
              className={SELECT_CLASS}
            >
              {SPLIT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-mode">Schedule length</Label>
            <select
              id="routine-mode"
              value={scheduleMode}
              onChange={(event) => handleModeChange(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="week">Full week</option>
              <option value="day">Single day</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-goal">Goal</Label>
            <Input
              id="routine-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Hypertrophy"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-client">Assign to client</Label>
            <select
              id="routine-client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Unassigned</option>
              {(clients ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-description">Description</Label>
            <Input
              id="routine-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short notes about this block"
            />
          </div>
        </div>
      </div>

      {/* Weekly schedule: each day is rest or a named split day. */}
      <div className="border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="text-sm font-bold">Schedule</h3>
            <p className="text-xs text-muted-foreground">
              {scheduleMode === "week"
                ? "Set every day of the week as a workout or rest day."
                : "Choose the one weekday this routine applies to."}
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <CalendarDays className="size-3.5" />
            {split.label}
          </Badge>
        </div>

        <div className="divide-y">
          {days.map((day) => (
            <ScheduleDayRow
              key={day.dayOfWeek}
              day={day}
              split={split}
              active={day.dayOfWeek === activeDay}
              showWeekdaySelect={scheduleMode === "day"}
              onSelect={setActiveDay}
              onTypeChange={handleDayTypeChange}
              onLabelChange={handleDayLabelChange}
              onWeekdayChange={handleWeekdayChange}
            />
          ))}
        </div>
      </div>

      {/* Two-pane workspace: exercises for the selected day, catalog on right. */}
      <div
        className={
          activeDayData?.isRest
            ? ""
            : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
        }
      >
        <div className="min-w-0 border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-bold">
                {activeDayName} ·{" "}
                {activeDayData?.isRest ? "Rest day" : activeDayData?.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeDayData?.isRest
                  ? "Recovery day — no exercises scheduled."
                  : `${rows.length} exercises · use the edit icon to adjust a row`}
              </p>
            </div>
            {saveError && (
              <p className="max-w-xs text-right text-xs text-destructive">
                {saveError}
              </p>
            )}
          </div>

          {activeDayData?.isRest ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-muted-foreground">
                This day is set as rest. Switch it to a workout day to add
                exercises for the client.
              </p>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => handleDayTypeChange(activeDay, "workout")}
              >
                <Plus className="size-4" />
                Make workout day
              </Button>
            </div>
          ) : (
            <div className="routine-table p-3">
              <Table
                data={rows}
                rowKey="id"
                height={Math.min(560, Math.max(220, rows.length * 48 + 48))}
                bordered
                cellBordered
                locale={{
                  emptyMessage:
                    "No exercises for this day yet — add some from the library.",
                }}
              >
                <Column width={70}>
                  <HeaderCell>#</HeaderCell>
                  <Cell>
                    {(_rowData, rowIndex) => (
                      <span className="text-muted-foreground">
                        {rowIndex + 1}
                      </span>
                    )}
                  </Cell>
                </Column>

                <Column flexGrow={1} minWidth={200}>
                  <HeaderCell>Exercise</HeaderCell>
                  <Cell>
                    {(rowData) => (
                      <div className="min-w-0">
                        <p className="truncate font-bold">{rowData.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {rowData.primaryMuscle}
                        </p>
                      </div>
                    )}
                  </Cell>
                </Column>

                <Column width={110}>
                  <HeaderCell>Sets</HeaderCell>
                  <EditableCell
                    dataKey="sets"
                    dataType="number"
                    onChange={updateRow}
                  />
                </Column>

                <Column width={110}>
                  <HeaderCell>Track</HeaderCell>
                  <Cell>
                    {(rowData) => (
                      <select
                        value={rowData.trackingType ?? "reps"}
                        onChange={(event) =>
                          updateRow(
                            rowData.id,
                            "trackingType",
                            event.target.value
                          )
                        }
                        className="h-8 w-full rounded-xs border border-hairline bg-surface-1 px-1.5 text-xs text-ink outline-none focus-visible:border-primary"
                        aria-label={`Tracking mode for ${rowData.name}`}
                      >
                        <option value="reps">Reps</option>
                        <option value="time">Time</option>
                      </select>
                    )}
                  </Cell>
                </Column>

                <Column width={130}>
                  <HeaderCell>Reps / Time</HeaderCell>
                  <TrackingValueCell onChange={updateRow} />
                </Column>

                <Column width={130}>
                  <HeaderCell>Rest (sec)</HeaderCell>
                  <EditableCell
                    dataKey="restSec"
                    dataType="number"
                    onChange={updateRow}
                  />
                </Column>

                <Column width={220}>
                  <HeaderCell>Notes</HeaderCell>
                  <EditableCell
                    dataKey="notes"
                    dataType="string"
                    onChange={updateRow}
                  />
                </Column>

                <Column width={190}>
                  <HeaderCell>Actions</HeaderCell>
                  <Cell style={{ padding: "6px" }}>
                    {(rowData, rowIndex) => (
                      <div className="flex items-center gap-1">
                        <IconButton
                          appearance="subtle"
                          size="sm"
                          title={rowData.editing ? "Save row" : "Edit row"}
                          icon={rowData.editing ? <VscSave /> : <VscEdit />}
                          onClick={() => toggleEditing(rowData.id)}
                        />
                        <IconButton
                          appearance="subtle"
                          size="sm"
                          title="Move up"
                          icon={<VscArrowUp />}
                          disabled={rowIndex === 0}
                          onClick={() => moveRow(rowData.id, -1)}
                        />
                        <IconButton
                          appearance="subtle"
                          size="sm"
                          title="Move down"
                          icon={<VscArrowDown />}
                          disabled={rowIndex === rows.length - 1}
                          onClick={() => moveRow(rowData.id, 1)}
                        />
                        <IconButton
                          appearance="subtle"
                          size="sm"
                          title="Remove exercise"
                          icon={<VscRemove />}
                          onClick={() => removeRow(rowData.id)}
                        />
                      </div>
                    )}
                  </Cell>
                </Column>
              </Table>
            </div>
          )}
        </div>

        {/* Add-exercise panel: search the catalog and append to the active day. */}
        {!activeDayData?.isRest && (
          <div className="border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-bold">Exercise library</h3>
              <p className="text-xs text-muted-foreground">
                Add movements to {activeDayName}
              </p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search exercises..."
                  className="pl-8"
                />
              </div>
            </div>

            <div className="max-h-125 overflow-y-auto p-3">
              {exercisesLoading ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Loading exercises...
                </p>
              ) : exercisesError ? (
                <div className="p-3">
                  <ErrorState
                    message={exercisesError.message}
                    onRetry={refreshExercises}
                  />
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  <p>No exercises found.</p>
                  <Link
                    to="/dashboard/coach/exercises"
                    className="mt-2 inline-block font-bold text-primary hover:text-primary-hover"
                  >
                    Open the exercise library
                  </Link>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredExercises.map((exercise) => (
                    <li
                      key={exercise.id}
                      className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-hairline-strong"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {exercise.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {exercise.primaryMuscle}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {exercise.isCustom && (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          title={`Add ${exercise.name}`}
                          onClick={() => addExercise(exercise)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Route-level wrapper that decides between create and edit mode.
 *
 * `useApiData` is disabled for the "new" route, so no request fires without an
 * id. While an existing routine loads, a full-page state is shown; otherwise the
 * editor mounts with the loaded record. The `key` guarantees fresh local state
 * when navigating between different routines.
 *
 * @returns {JSX.Element} Loading/error state or the routine editor.
 */
export default function RoutineBuilder() {
  const { routineId } = useParams()
  const isEditing = Boolean(routineId)
  const { data: routine, loading, error, refresh } = useApiData(
    routineId ? `/routines/${routineId}` : null,
    { enabled: isEditing }
  )

  if (isEditing && loading) {
    return <LoadingState label="Loading routine..." />
  }

  if (isEditing && error) {
    return <ErrorState message={error.message} onRetry={refresh} />
  }

  return (
    <RoutineEditor
      key={routine?.id ?? routineId ?? "new"}
      routineId={routineId}
      isEditing={isEditing}
      initialRoutine={routine}
    />
  )
}
