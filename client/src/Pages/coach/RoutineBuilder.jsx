/**
 * Create/edit screen for a workout routine.
 *
 * The outer `RoutineBuilder` handles the route param and loads an existing
 * routine (edit mode) before mounting `RoutineEditor`. The editor owns a local,
 * editable copy of the ordered exercise rows so the coach can add, reorder, and
 * tune sets/reps/rest before saving. A save sends the whole routine payload in
 * one request (POST for new, PUT when editing) and then returns to the list.
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
import { ArrowLeft, Plus, Save, Search } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
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
 * Stateful editor for a new or existing routine.
 *
 * Data flow:
 * 1. Load the exercise catalog and the coach's clients for the pickers.
 * 2. Seed form fields and ordered rows from `initialRoutine` exactly once; the
 *    outer component remounts this editor via `key` when the record changes.
 * 3. All row edits are local until `handleSave` builds the ordered payload.
 *
 * @param {object} props
 * @param {string|undefined} props.routineId - Present when editing.
 * @param {boolean} props.isEditing - Chooses POST vs PUT on save.
 * @param {object|null|undefined} props.initialRoutine - Loaded routine, if any.
 * @returns {JSX.Element} Metadata form, ordered exercise table, and library.
 */
function RoutineEditor({ routineId, isEditing, initialRoutine }) {
  const navigate = useNavigate()
  const { request } = useAuth()

  // Exercise catalog powers the add panel; clients populate the assignment
  // select. Both are scoped to the coach/gym by the API.
  const {
    data: exercises,
    loading: exercisesLoading,
    error: exercisesError,
    refresh: refreshExercises,
  } = useApiData("/exercises")
  const { data: clients } = useApiData("/coach/clients")

  // Metadata fields are controlled locally; `initialRoutine` seeds the edit form.
  const [name, setName] = useState(initialRoutine?.name ?? "")
  const [goal, setGoal] = useState(initialRoutine?.goal ?? "")
  const [description, setDescription] = useState(
    initialRoutine?.description ?? ""
  )
  const [clientId, setClientId] = useState(initialRoutine?.clientId ?? "")
  // The ordered working copy. Each saved exercise gets a local row id and starts
  // read-only; newly added exercises start in edit mode with sensible defaults.
  const [rows, setRows] = useState(() =>
    (initialRoutine?.exercises ?? []).map((exercise) => ({
      ...exercise,
      id: createRowId(),
      editing: false,
    }))
  )
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Search spans name and both muscle groups so coaches can find movements by
  // body part, not just by exact exercise name.
  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = exercises ?? []

    if (!term) return list

    return list.filter((exercise) =>
      `${exercise.name} ${exercise.primaryMuscle} ${(exercise.secondaryMuscles ?? []).join(" ")}`
        .toLowerCase()
        .includes(term)
    )
  }, [exercises, search])

  // Append a catalog exercise with default prescription values and immediately
  // enter edit mode so the coach can adjust sets/reps without an extra click.
  const addExercise = (exercise) => {
    setRows((current) => [
      ...current,
      {
        id: createRowId(),
        exerciseId: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        sets: 3,
        reps: 10,
        restSec: 60,
        notes: "",
        editing: true,
      },
    ])
  }

  // Immutable row updates keep RSuite's rendered data in sync with React state.
  const updateRow = (id, key, value) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    )
  }

  // Toggle the target row and force every other row out of edit mode, which
  // mirrors an inline "save row" interaction.
  const toggleEditing = (id) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, editing: !row.editing }
          : { ...row, editing: false }
      )
    )
  }

  const removeRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  // Reorder by splicing within the array. Bounds checks make the up/down buttons
  // safe even if the UI state is stale. Array order becomes `order` on save.
  const moveRow = (id, direction) => {
    setRows((current) => {
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
   * The payload always marks the routine `active`, numbers exercises by their
   * current row position, and coerces numeric fields with sensible minimums
   * (1 set/reps, 0 rest). New routines POST; edits PUT to the route param.
   */
  const handleSave = async () => {
    setSaveError("")

    if (!name.trim()) {
      setSaveError("Give the routine a name before saving.")
      return
    }

    if (rows.length === 0) {
      setSaveError("Add at least one exercise to the routine.")
      return
    }

    setSaving(true)

    const payload = {
      name: name.trim(),
      goal: goal.trim(),
      description: description.trim(),
      clientId: clientId || null,
      status: "active",
      exercises: rows.map((row, index) => ({
        exerciseId: row.exerciseId,
        sets: Number(row.sets) || 1,
        reps: Number(row.reps) || 1,
        restSec: Number(row.restSec) || 0,
        notes: row.notes ?? "",
        order: index,
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
        description="Name the routine, add exercises from the library, then order them into the exact sequence your client should follow."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
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

      {/* Routine metadata: name, goal, client assignment, and description. */}
      <div className="rounded-xl border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-2">
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
              className="h-10 w-full rounded-none border border-input bg-[#0A0A0A] px-3 text-sm text-white outline-none focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30"
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

      {/* Two-pane workspace: ordered routine on the left, searchable exercise
          catalog on the right. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Exercise order</h3>
              <p className="text-xs text-muted-foreground">
                {rows.length} exercises · use the edit icon to adjust a row
              </p>
            </div>
            {saveError && (
              <p className="max-w-xs text-right text-xs text-destructive">
                {saveError}
              </p>
            )}
          </div>

          {/* Ordered exercise table. Row order is the source of truth for the
              `order` field sent to the API. */}
          <div className="routine-table p-3">
            <Table
              data={rows}
              rowKey="id"
              height={Math.min(560, Math.max(220, rows.length * 48 + 48))}
              bordered
              cellBordered
              locale={{
                emptyMessage: "No exercises yet — add some from the library.",
              }}
            >
              <Column width={70}>
                <HeaderCell>#</HeaderCell>
                <Cell>
                  {(_rowData, rowIndex) => (
                    <span className="text-muted-foreground">{rowIndex + 1}</span>
                  )}
                </Cell>
              </Column>

              <Column flexGrow={1} minWidth={200}>
                <HeaderCell>Exercise</HeaderCell>
                <Cell>
                  {(rowData) => (
                    <div className="min-w-0">
                      <p className="truncate font-medium">{rowData.name}</p>
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
                <HeaderCell>Reps</HeaderCell>
                <EditableCell
                  dataKey="reps"
                  dataType="number"
                  onChange={updateRow}
                />
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
        </div>

        {/* Add-exercise panel: search the catalog and append to the routine. */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="text-sm font-semibold">Exercise library</h3>
            <p className="text-xs text-muted-foreground">
              Add movements to the routine
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
                  className="mt-2 inline-block font-medium text-foreground underline"
                >
                  Open the exercise library
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredExercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
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
