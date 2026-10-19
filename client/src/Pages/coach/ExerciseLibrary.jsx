/**
 * Gym exercise catalog for coaches.
 *
 * Lists both shared library exercises and custom movements created for the gym.
 * Coaches can add new custom exercises (name + muscles) and delete only their
 * custom entries; bundled library exercises are read-only. New rows are inserted
 * alphabetically to match the API ordering.
 */
import { useCallback, useMemo, useState } from "react"
import { Copy, Plus, Trash } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { DataTable, RowActions } from "@/components/data-table"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
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

const EMPTY_FORM = {
  name: "",
  primaryMuscle: "",
  secondaryMuscles: "",
}

/**
 * @param {string|null|undefined} value - ISO timestamp.
 * @returns {string} Localized short date, or an em dash when missing.
 */
function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * @returns {JSX.Element} Exercise table plus the custom-exercise dialog.
 */
export default function ExerciseLibrary() {
  const { request } = useAuth()
  const {
    data: exercises,
    loading,
    error,
    refresh,
    setData,
  } = useApiData("/exercises")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Reset the form each time the dialog opens so a cancelled edit does not leak
  // values into the next creation.
  const openDialog = () => {
    setForm(EMPTY_FORM)
    setFormError("")
    setDialogOpen(true)
  }

  // Single-row delete; the API also enforces that only custom exercises can be
  // removed.
  const handleRemove = useCallback(
    async (exercise) => {
      await request(`/exercises/${exercise.id}`, { method: "DELETE" })
      setData((current) =>
        (current ?? []).filter((item) => item.id !== exercise.id)
      )
    },
    [request, setData]
  )

  // Bulk delete ignores shared library entries and only issues requests for
  // selected custom exercises.
  const handleDelete = useCallback(
    async (selected) => {
      const removable = selected.filter((row) => row.isCustom)
      if (removable.length === 0) return
      const ids = new Set(removable.map((row) => row.id))
      await Promise.all(
        removable.map((row) =>
          request(`/exercises/${row.id}`, { method: "DELETE" })
        )
      )
      setData((current) => (current ?? []).filter((item) => !ids.has(item.id)))
    },
    [request, setData]
  )

  // `secondaryMuscles` is submitted as the comma-separated string from the form;
  // the API normalizes it into the array returned by the list endpoint.
  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError("")

    try {
      const created = await request("/exercises", {
        method: "POST",
        body: {
          name: form.name,
          primaryMuscle: form.primaryMuscle,
          secondaryMuscles: form.secondaryMuscles,
        },
      })
      setData((current) =>
        [...(current ?? []), created].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      )
      setDialogOpen(false)
    } catch (createError) {
      setFormError(createError.message ?? "Unable to create the exercise.")
    } finally {
      setSaving(false)
    }
  }

  // Columns: selection, exercise, muscle metadata, custom/library type, added
  // date, and row actions (delete is only offered for custom exercises).
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
          />
        ),
        size: 36,
        enableSorting: false,
        enableHiding: false,
      },
      {
        header: "Exercise",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("name")}
          </span>
        ),
        size: 260,
        enableHiding: false,
      },
      {
        header: "Primary muscle",
        accessorKey: "primaryMuscle",
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("primaryMuscle")}</Badge>
        ),
        size: 170,
      },
      {
        header: "Secondary muscles",
        accessorKey: "secondaryMuscles",
        cell: ({ row }) => {
          const muscles = row.getValue("secondaryMuscles") ?? []
          if (muscles.length === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <span className="text-muted-foreground">{muscles.join(", ")}</span>
          )
        },
        size: 240,
      },
      {
        header: "Type",
        accessorKey: "isCustom",
        cell: ({ row }) =>
          row.getValue("isCustom") ? (
            <Badge variant="secondary">Custom</Badge>
          ) : (
            <Badge variant="outline">Library</Badge>
          ),
        size: 110,
      },
      {
        header: "Added",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.getValue("createdAt"))}
          </span>
        ),
        size: 130,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const items = [
            {
              label: "Copy name",
              icon: Copy,
              onClick: () =>
                navigator.clipboard?.writeText(row.original.name),
            },
          ]

          if (row.original.isCustom) {
            items.push(
              { separator: true },
              {
                label: "Delete exercise",
                icon: Trash,
                destructive: true,
                onClick: () => handleRemove(row.original),
              }
            )
          }

          return (
            <RowActions
              label={`Actions for ${row.original.name}`}
              items={items}
            />
          )
        },
        size: 56,
        enableHiding: false,
      },
    ],
    [handleRemove]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach workspace"
        title="Exercise library"
        description="Every exercise available in your gym's database, including custom movements you add."
        actions={
          <Button className="gap-2" onClick={openDialog}>
            <Plus className="size-4" />
            Add exercise
          </Button>
        }
      />

      {/* List state; the dialog below is rendered regardless so it can open
          after a successful load. */}
      {loading ? (
        <LoadingState label="Loading exercises..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        <DataTable
          columns={columns}
          data={exercises ?? []}
          onDelete={handleDelete}
          searchColumnId="name"
          searchPlaceholder="Search exercises by name..."
          emptyMessage="No exercises in the database yet. Add a custom exercise to get started."
        />
      )}

      {/* Create-custom-exercise dialog. */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
            <DialogDescription>
              Create a custom exercise for your gym. It will be available in
              every coach's routine builder.
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

            {formError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Add exercise"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
