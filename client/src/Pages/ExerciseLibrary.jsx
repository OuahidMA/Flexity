import { useState } from "react";
import { IconSearch, IconPlus, IconTrash, IconX, IconCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GROUPS } from "@/lib/exercises";
import { useExercises } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { cn } from "@/lib/utils";

const badgeVariant = (category) =>
  category === "Push"
    ? "primary"
    : category === "Pull"
      ? "neutral"
      : category === "Legs"
        ? "success"
        : "outline";

const muscleText = (exercise) =>
  exercise.primaryMuscles && exercise.primaryMuscles.length
    ? exercise.primaryMuscles.join(", ")
    : exercise.targetMuscle;

function ExerciseForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    category: "Push",
    primaryMuscles: "",
    secondaryMuscles: "",
    equipment: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const name = form.name.trim();
    const primaryMuscles = form.primaryMuscles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name) {
      setError("Give the exercise a name.");
      return;
    }
    if (!primaryMuscles.length) {
      setError("Add at least one target muscle.");
      return;
    }
    setSaving(true);
    await workoutService.saveExercise({
      name,
      category: form.category,
      primaryMuscles,
      secondaryMuscles: form.secondaryMuscles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      equipment: form.equipment.trim(),
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Close add exercise dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/50"
      />
      <div className="relative w-full max-w-lg rounded-[20px] border border-sidebar-border bg-card p-6 shadow-subtle">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Add exercise
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved to this browser and available across your workouts.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral">Exercise name</span>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setError("");
              }}
              autoFocus
              placeholder="e.g. Cable Crunch"
              className="mt-1.5 h-11 w-full rounded-[12px] border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-neutral">Category</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setForm((prev) => ({ ...prev, category: g }))}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-[12px] px-4 text-sm font-medium transition-colors",
                    form.category === g
                      ? "bg-primary text-white shadow-micro"
                      : "bg-muted text-neutral hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-neutral">
              Target muscles <span className="text-muted-foreground">(comma separated)</span>
            </span>
            <input
              value={form.primaryMuscles}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, primaryMuscles: e.target.value }));
                setError("");
              }}
              placeholder="e.g. Abs, Obliques"
              className="mt-1.5 h-11 w-full rounded-[12px] border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral">
              Secondary muscles{" "}
              <span className="text-muted-foreground">(optional)</span>
            </span>
            <input
              value={form.secondaryMuscles}
              onChange={(e) => setForm((prev) => ({ ...prev, secondaryMuscles: e.target.value }))}
              placeholder="e.g. Forearms"
              className="mt-1.5 h-11 w-full rounded-[12px] border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral">
              Equipment <span className="text-muted-foreground">(comma separated)</span>
            </span>
            <input
              value={form.equipment}
              onChange={(e) => setForm((prev) => ({ ...prev, equipment: e.target.value }))}
              placeholder="e.g. Barbell, Resistance Band"
              className="mt-1.5 h-11 w-full rounded-[12px] border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-[10px] bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            <IconCheck className="h-4 w-4" />
            {saving ? "Saving…" : "Add exercise"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseLibrary() {
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { data: list, loading } = useExercises(refreshKey);

  const handleCreated = () => {
    setShowForm(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (id) => {
    await workoutService.deleteExercise(id);
    setRefreshKey((k) => k + 1);
  };

  const filtered = (list || []).filter((exercise) => {
    const matchesGroup =
      group === "All" || exercise.category === group || exercise.group === group;
    const q = query.trim().toLowerCase();
    const haystack = [
      exercise.name,
      muscleText(exercise),
      ...(exercise.secondaryMuscles || []),
      exercise.equipment,
    ]
      .join(" ")
      .toLowerCase();
    return matchesGroup && (!q || haystack.includes(q));
  });

  const counts = (list || []).reduce((acc, exercise) => {
    const category = exercise.category || exercise.group;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Exercise Library
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {loading && !list
              ? "Loading exercises…"
              : `${(list || []).length} movements across ${GROUPS.join(", ")}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-[12px] border border-input bg-background px-3.5 py-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises…"
              className="w-44 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground sm:w-64"
            />
          </div>
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <IconPlus className="h-4 w-4" />
            Add exercise
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {["All", ...GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={cn(
              "relative inline-flex h-9 items-center rounded-[12px] px-4 text-sm font-medium transition-colors",
              group === g
                ? "bg-primary text-white shadow-micro"
                : "bg-muted text-neutral hover:bg-secondary hover:text-foreground"
            )}
          >
            {g}
            {counts[g] ? (
              <span
                className={cn(
                  "ml-2 rounded-[6px] px-1.5 py-0.5 text-xs",
                  group === g ? "bg-white/20 text-white" : "bg-secondary text-secondary-foreground"
                )}
              >
                {counts[g]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && !list
          ? [...Array(6)].map((_, idx) => (
              <div key={idx} className="h-44 animate-pulse rounded-[16px] bg-muted" />
            ))
          : filtered.map((exercise) => (
              <div
                key={exercise.id}
                className="group rounded-[16px] border border-sidebar-border bg-card p-5 shadow-subtle transition-shadow hover:shadow-micro"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-tight text-foreground">
                    {exercise.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={badgeVariant(exercise.category)}>{exercise.category}</Badge>
                    {exercise.custom && (
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        aria-label={`Delete ${exercise.name}`}
                        className="grid h-7 w-7 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Target muscles</p>
                    <p className="text-sm font-medium text-foreground">{muscleText(exercise)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Equipment</p>
                    <p className="text-sm font-medium text-foreground">{exercise.equipment}</p>
                  </div>
                </div>
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Secondary: {exercise.secondaryMuscles.join(", ")}
                  </p>
                )}
                {exercise.custom && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <IconCheck className="h-3.5 w-3.5" />
                    Added by you
                  </p>
                )}
              </div>
            ))}
      </div>

      {!loading && list && filtered.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-dashed border-border bg-card p-10 text-center">
          <p className="text-base font-medium text-foreground">No exercises found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search, or add the movement yourself.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setGroup("All");
              }}
            >
              Reset filters
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="h-4 w-4" />
              Add exercise
            </Button>
          </div>
        </div>
      )}

      {showForm && <ExerciseForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}
    </div>
  );
}