import { useState } from "react";
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconSearch,
  IconCheck,
  IconDumbbell,
  IconFileTypePdf,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GROUPS, normalizeCategory } from "@/lib/exercises";
import { useExercises } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { exportWorkoutPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

const muscleText = (exercise) =>
  exercise.primaryMuscles && exercise.primaryMuscles.length
    ? exercise.primaryMuscles.join(", ")
    : exercise.targetMuscle;

const buildLines = (exerciseById, lines) =>
  lines.map((line) => ({
    exerciseId: line.exerciseId,
    name: exerciseById.get(line.exerciseId)?.name || "Exercise",
    sets: line.sets,
    reps: line.reps,
  }));

function ExercisePicker({ exercises, usedIds, name, onNameChange, onAdd, onClose }) {
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = (exercises || []).filter((ex) => {
    const matchesGroup =
      group === "All" ||
      normalizeCategory(ex.category || ex.group) === group;
    const matchesQuery =
      !q || `${ex.name} ${muscleText(ex)} ${ex.equipment || ""}`.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Close create workout dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/50"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[20px] border border-sidebar-border bg-card shadow-subtle">
        <div className="flex items-start justify-between gap-4 border-b border-sidebar-border px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Create workout
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Name your workout, then pick exercises by group or search by name — tune sets and reps after.
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

        <div className="border-b border-sidebar-border px-6 py-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Workout name
            </span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Upper Body Strength"
              className="mt-2 w-full rounded-[12px] border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>
          <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-input bg-background px-3.5 py-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Type an exercise name…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["All", ...GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={cn(
                  "relative inline-flex h-8 items-center rounded-[12px] px-3.5 text-sm font-medium transition-colors",
                  group === g
                    ? "bg-orange-600 text-white shadow-micro hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500/50"
                    : "bg-muted text-neutral hover:bg-secondary hover:text-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="divide-y divide-sidebar-border">
            {filtered.map((ex) => {
              const added = usedIds.has(ex.id);
              return (
                <div key={ex.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {muscleText(ex)}
                      {ex.equipment ? ` · ${ex.equipment}` : ""}
                    </p>
                  </div>
                  <Button
                    variant={added ? "secondary" : "default"}
                    size="sm"
                    disabled={added}
                    onClick={() => onAdd(ex.id)}
                    className="shrink-0"
                  >
                    {added ? (
                      <>
                        <IconCheck className="h-3.5 w-3.5" />
                        Added
                      </>
                    ) : (
                      <>
                        <IconPlus className="h-3.5 w-3.5" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No exercises match this group or search.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-sidebar-border px-6 py-4">
          <Button variant="white" onClick={onClose} disabled={!name.trim()}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { data: exercises } = useExercises();
  const [routineName, setRoutineName] = useState("");
  const [lines, setLines] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportedNote, setExportedNote] = useState(false);
  const [exportError, setExportError] = useState(false);

  const all = exercises || [];
  const exerciseById = new Map(all.map((ex) => [ex.id, ex]));
  const usedIds = new Set(lines.map((line) => line.exerciseId));

  const totalSets = lines.reduce((acc, line) => acc + line.sets, 0);

  const addExercise = (exerciseId) => {
    setLines((prev) => [...prev, { exerciseId, sets: 3, reps: 10 }]);
    setSavedNote(false);
    setExportedNote(false);
  };

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setSavedNote(false);
    setExportedNote(false);
  };

  const changeSets = (index, delta) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, sets: Math.max(1, line.sets + delta) } : line))
    );
    setSavedNote(false);
    setExportedNote(false);
  };

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!lines.length || !routineName.trim()) return;
    setSaving(true);
    try {
      const saved = await workoutService.saveCustomRoutine({
        name: routineName.trim(),
        group: "Custom",
        description: "",
        exercises: buildLines(exerciseById, lines),
      });
      setRoutineName(saved.name);
      setSavedNote(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
    setTimeout(() => {
      setSavedNote(false);
      setSaveError(false);
    }, 2500);
  };

  const handleExport = async () => {
    if (!lines.length) return;
    setExporting(true);
    try {
      await exportWorkoutPdf({
        title: routineName || "Built workout",
        group: "Custom",
        lines: buildLines(exerciseById, lines),
      });
      setExportedNote(true);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
    setTimeout(() => {
      setExportedNote(false);
      setExportError(false);
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Build Workout
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Create a structured workout, then save it or export it as a PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {savedNote && (
            <Badge variant="success">
              <IconCheck className="h-3.5 w-3.5" />
              Routine saved
            </Badge>
          )}
          {saveError && (
            <Badge variant="outline" className="text-destructive">
              <IconX className="h-3.5 w-3.5" />
              Could not save routine
            </Badge>
          )}
          {exportedNote && (
            <Badge variant="primary">
              <IconFileTypePdf className="h-3.5 w-3.5" />
              PDF exported
            </Badge>
          )}
          {exportError && (
            <Badge variant="outline" className="text-destructive">
              <IconX className="h-3.5 w-3.5" />
              Could not export PDF
            </Badge>
          )}
          <Button variant="white" onClick={handleExport} disabled={!lines.length || exporting}>
            <IconFileTypePdf className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
          <Button variant="white" onClick={handleSave} disabled={!lines.length || saving}>
            <IconCheck className="h-4 w-4" />
            {saving ? "Saving…" : "Save routine"}
          </Button>
<Button onClick={() => setShowPicker(true)} className="shrink-0">
            <IconPlus className="h-5 w-5" />
            Create workout
          </Button>
      </div>
    </div>

    <Card className="mt-8 w-full">
      <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-5">
        <div>
          <p className="font-display text-lg font-bold text-foreground">
            {routineName || "Built workout"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {lines.length} exercises · {totalSets} sets
          </p>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-primary-subtle text-primary">
            <IconDumbbell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Workout is empty</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Hit "Create workout" to name your workout and pick exercises by
              group or search by name.
            </p>
          </div>
        </div>
      ) : (
            <div className="divide-y divide-sidebar-border">
              {lines.map((line, index) => {
                const exercise = exerciseById.get(line.exerciseId);
                return (
                  <div key={line.exerciseId} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-secondary text-xs font-semibold text-secondary-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {exercise ? exercise.name : "Unknown exercise"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {exercise ? muscleText(exercise) : ""}
                            {exercise && exercise.secondaryMuscles?.length
                              ? ` · Secondary: ${exercise.secondaryMuscles.join(", ")}`
                              : ""}
                          </p>
                          {exercise && exercise.equipment && (
                            <p className="mt-1 text-xs font-medium text-neutral">
                              {exercise.equipment}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center rounded-[10px] border border-input bg-background"
                          aria-label={`${line.sets} sets`}
                        >
                          <button
                            onClick={() => changeSets(index, -1)}
                            aria-label="Decrease sets"
                            className="grid h-9 w-9 place-items-center rounded-l-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <IconMinus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-semibold text-foreground">
                            {line.sets} sets
                          </span>
                          <button
                            onClick={() => changeSets(index, 1)}
                            aria-label="Increase sets"
                            className="grid h-9 w-9 place-items-center rounded-r-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <IconPlus className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={line.reps}
                          onChange={(e) => updateLine(index, { reps: Number(e.target.value) || 0 })}
                          className="h-9 w-16 rounded-[10px] border border-input bg-background px-2 text-center text-sm font-semibold text-foreground outline-none transition-colors focus:border-ring"
                          aria-label={`Reps for ${exercise?.name || "exercise"}`}
                        />
                        <button
                          onClick={() => removeLine(index)}
                          aria-label={`Remove ${exercise?.name || "exercise"}`}
                          className="grid h-9 w-9 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      {showPicker && (
        <ExercisePicker
          exercises={all}
          usedIds={usedIds}
          name={routineName}
          onNameChange={setRoutineName}
          onAdd={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}