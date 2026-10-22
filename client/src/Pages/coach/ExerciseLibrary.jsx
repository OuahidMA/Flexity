/**
 * Gym exercise catalog for coaches.
 *
 * Renders the full exercise collection as a paginated card grid. Each card
 * summarizes muscle, equipment, and difficulty metadata; the details dialog
 * exposes the complete record (instructions, tips, target muscles, goals, tags,
 * and MET). Coaches can create custom exercises and delete only those custom
 * entries; library exercises are read-only. Custom exercises live in this
 * browser's localStorage and never reach the API.
 */
import { useCallback, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Plus,
  Search,
  Trash,
  X,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import {
  addLocalExercise,
  buildLocalExercise,
  getLocalExercises,
  removeLocalExercise,
} from "@/lib/local-store"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const EMPTY_FORM = {
  name: "",
  primaryMuscle: "",
  secondaryMuscles: "",
}

// The grid is 3 columns on wide screens, so 12 cards fills four full rows.
const PAGE_SIZE = 12

/**
 * Turn a stored identifier such as "full_body" into "Full Body".
 *
 * @param {string|null|undefined} value - Raw muscle/equipment/category value.
 * @returns {string} Human-readable label, or an em dash when empty.
 */
function formatLabel(value) {
  if (!value) return "—"
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

/**
 * Single catalog card.
 *
 * @param {object} props
 * @param {object} props.exercise - Serialized exercise from the API.
 * @param {() => void} props.onView - Opens the details dialog.
 * @param {() => void} props.onCopy - Copies the exercise name.
 * @param {() => void} props.onRemove - Deletes a custom exercise.
 * @returns {JSX.Element} The card.
 */
function ExerciseCard({ exercise, onView, onCopy, onRemove }) {
  const secondaryMuscles = exercise.secondaryMuscles ?? []
  const visibleSecondary = secondaryMuscles.slice(0, 2)
  const remainingSecondary = secondaryMuscles.length - visibleSecondary.length

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
      <div className="flex items-start justify-between gap-3 border-b border-hairline p-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink-subtle">
            {formatLabel(exercise.category || exercise.bodyPart)}
          </p>
          <h3 className="mt-2 line-clamp-2 text-[15px] font-medium text-ink">
            {exercise.name || "Untitled exercise"}
          </h3>
        </div>
        <Badge
          variant={exercise.isCustom ? "secondary" : "outline"}
          className="shrink-0"
        >
          {exercise.isCustom ? "Custom" : "Library"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 min-h-10 caption text-ink-subtle">
          {exercise.description || "No description available."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{formatLabel(exercise.primaryMuscle)}</Badge>
          {visibleSecondary.map((muscle) => (
            <Badge key={muscle} variant="secondary">
              {formatLabel(muscle)}
            </Badge>
          ))}
          {remainingSecondary > 0 && (
            <Badge variant="secondary">+{remainingSecondary}</Badge>
          )}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-hairline pt-3">
          <div className="min-w-0">
            <dt className="eyebrow text-ink-subtle">Equipment</dt>
            <dd className="mt-1 truncate caption text-ink">
              {exercise.equipment ? formatLabel(exercise.equipment) : "Bodyweight"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="eyebrow text-ink-subtle">Difficulty</dt>
            <dd className="mt-1 truncate caption text-ink">
              {formatLabel(exercise.difficulty)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 border-t border-hairline p-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={onView}
        >
          <Eye className="size-4" />
          Details
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Copy ${exercise.name}`}
          onClick={onCopy}
        >
          <Copy className="size-4" />
        </Button>
        {exercise.isCustom && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${exercise.name}`}
            onClick={onRemove}
          >
            <Trash className="size-4" />
          </Button>
        )}
      </div>
    </article>
  )
}

/**
 * @returns {JSX.Element} Exercise card grid plus the create/details dialogs.
 */
export default function ExerciseLibrary() {
  const { user, request } = useAuth()
  const {
    data: exercises,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/exercises")

  // Custom exercises are browser-local; seed the display list from storage.
  const [localExercises, setLocalExercises] = useState(() =>
    getLocalExercises(user?.id)
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  // The exercise shown in the read-only details dialog, or null when closed.
  const [details, setDetails] = useState(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  // Library records and browser-local customs share one displayed catalog.
  const allExercises = useMemo(
    () => [...(exercises ?? []), ...localExercises],
    [exercises, localExercises]
  )

  // Filter locally so typing stays responsive; the API returns the full catalog.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const source = allExercises

    if (!term) return source

    return source.filter((exercise) =>
      [
        exercise.name,
        exercise.description,
        exercise.primaryMuscle,
        exercise.equipment,
        exercise.category,
        exercise.difficulty,
        ...(exercise.secondaryMuscles ?? []),
        ...(exercise.targetMuscles?.primary ?? []),
        ...(exercise.targetMuscles?.secondary ?? []),
        ...(exercise.tags ?? []),
        ...(exercise.goals ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [allExercises, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleExercises = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  // Reset the form each time the dialog opens so a cancelled edit does not leak
  // values into the next creation.
  const openDialog = () => {
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  // Browser-local entries are deleted from localStorage; older database-backed
  // customs still go through the API, which enforces custom-only deletes.
  const handleRemove = useCallback(
    async (exercise) => {
      if (exercise.isLocal) {
        setLocalExercises(removeLocalExercise(user?.id, exercise.id))
        setPage(0)
        return
      }

      await request(`/exercises/${exercise.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== exercise.id)
      )
      setPage(0)
    },
    [request, setData, user?.id]
  )

  // New custom exercises are persisted in this browser only. The id is
  // ObjectId-shaped so routines can still reference it without API changes.
  const handleCreate = (event) => {
    event.preventDefault()

    const created = buildLocalExercise(form)
    setLocalExercises(addLocalExercise(user?.id, created))
    setPage(0)
    setDialogOpen(false)
  }

  // Details dialog prefers the library's specific target-muscle arrays and falls
  // back to the normalized primary muscle for custom exercises.
  const detailPrimaryMuscles = details
    ? details.targetMuscles?.primary?.length
      ? details.targetMuscles.primary
      : details.primaryMuscle
        ? [details.primaryMuscle]
        : []
    : []
  const detailSecondaryMuscles = details?.secondaryMuscles ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach workspace"
        title="Exercise library"
        description="Every exercise available in your gym, including custom movements you add. Custom exercises are saved in this browser."
        actions={
          <Button className="gap-2" onClick={openDialog}>
            <Plus className="size-4" />
            Add exercise
          </Button>
        }
      />

      {/* List state; the dialogs below are rendered regardless so they can open
          after a successful load. */}
      {loading ? (
        <LoadingState label="Loading exercises..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-subtle" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder="Search exercises by name, muscle, or equipment..."
                aria-label="Search exercises"
                className={search ? "ps-9 pe-9" : "ps-9"}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("")
                    setPage(0)
                  }}
                  className="absolute inset-y-0 end-0 flex w-9 items-center justify-center text-ink-subtle transition-colors hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <p className="eyebrow text-ink-subtle">
              {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-surface-1 px-6 py-16 text-center">
              <p className="caption text-ink-subtle">
                {allExercises.length
                  ? "No exercises match your search."
                  : "No exercises yet. Add a custom exercise to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onView={() => setDetails(exercise)}
                    onCopy={() =>
                      navigator.clipboard?.writeText(exercise.name)
                    }
                    onRemove={() => handleRemove(exercise)}
                  />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="caption text-ink-subtle">
                    Showing{" "}
                    <span className="text-ink">
                      {currentPage * PAGE_SIZE + 1}–
                      {Math.min(
                        (currentPage + 1) * PAGE_SIZE,
                        filtered.length
                      )}
                    </span>{" "}
                    of <span className="text-ink">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        setPage((current) => Math.max(0, current - 1))
                      }
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <span className="eyebrow px-2 text-ink-subtle">
                      Page {currentPage + 1} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        setPage((current) =>
                          Math.min(pageCount - 1, current + 1)
                        )
                      }
                      disabled={currentPage >= pageCount - 1}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create-custom-exercise dialog. */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
            <DialogDescription>
              Create a custom exercise for your routine builder. It is saved in
              this browser only, not in the gym database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Name</Label>
              <Input
                id="exercise-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Incline dumbbell press"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-primary">Primary muscle</Label>
              <Input
                id="exercise-primary"
                value={form.primaryMuscle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    primaryMuscle: event.target.value,
                  }))
                }
                placeholder="Chest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-secondary">
                Secondary muscles (comma separated)
              </Label>
              <Input
                id="exercise-secondary"
                value={form.secondaryMuscles}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    secondaryMuscles: event.target.value,
                  }))
                }
                placeholder="Front delts, triceps"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add exercise</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Read-only view of every field stored for the selected exercise. */}
      <Dialog
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open) setDetails(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>{details.name}</DialogTitle>
                <DialogDescription>
                  {details.description || "No description available."}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {formatLabel(details.category)}
                </Badge>
                <Badge variant="outline">
                  {formatLabel(details.difficulty)}
                </Badge>
                <Badge variant="secondary">
                  {details.isCustom ? "Custom" : "Library"}
                </Badge>
                {details.equipment && (
                  <Badge variant="outline">
                    {formatLabel(details.equipment)}
                  </Badge>
                )}
                {details.mechanic && (
                  <Badge variant="outline">
                    {formatLabel(details.mechanic)}
                  </Badge>
                )}
                {details.forceType && (
                  <Badge variant="outline">
                    {formatLabel(details.forceType)}
                  </Badge>
                )}
              </div>

              <dl className="grid grid-cols-1 gap-4 border-y border-hairline py-4 sm:grid-cols-2">
                <div>
                  <dt className="eyebrow text-ink-subtle">Primary muscles</dt>
                  <dd className="mt-1 caption text-ink">
                    {detailPrimaryMuscles.length
                      ? detailPrimaryMuscles
                          .map((muscle) => formatLabel(muscle))
                          .join(", ")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-ink-subtle">Secondary muscles</dt>
                  <dd className="mt-1 caption text-ink">
                    {detailSecondaryMuscles.length
                      ? detailSecondaryMuscles
                          .map((muscle) => formatLabel(muscle))
                          .join(", ")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-ink-subtle">Equipment</dt>
                  <dd className="mt-1 caption text-ink">
                    {details.equipment
                      ? formatLabel(details.equipment)
                      : "Bodyweight"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-ink-subtle">MET</dt>
                  <dd className="mt-1 caption text-ink">{details.met ?? "—"}</dd>
                </div>
              </dl>

              {details.instructions.length > 0 && (
                <div>
                  <h3 className="eyebrow text-ink-subtle">Instructions</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 body-md text-ink-muted">
                    {details.instructions.map((step, index) => (
                      <li key={`${index}-${step}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {details.tips.length > 0 && (
                <div>
                  <h3 className="eyebrow text-ink-subtle">Tips</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 body-md text-ink-muted">
                    {details.tips.map((tip, index) => (
                      <li key={`${index}-${tip}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(details.goals.length > 0 || details.tags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {details.goals.map((goal) => (
                    <Badge key={`goal-${goal}`} variant="outline">
                      {formatLabel(goal)}
                    </Badge>
                  ))}
                  {details.tags.map((tag) => (
                    <Badge key={`tag-${tag}`} variant="secondary">
                      {formatLabel(tag)}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
