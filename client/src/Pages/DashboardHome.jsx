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
import { GROUPS } from "@/lib/exercises";
import { useExercises, useRoutineTemplates } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { exportWorkoutPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

const muscleText = (exercise) =>
  exercise.primaryMuscles && exercise.primaryMuscles.length
    ? exercise.primaryMuscles.join(", ")
    : exercise.targetMuscle;

function ExercisePicker({ exercises, usedIds, onAdd, onClose }) {
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = (exercises || []).filter((ex) => {
    const matchesGroup =
      group === "All" || ex.category === group || ex.group === group;
    const matchesQuery =
      !q || `${ex.name} ${muscleText(ex)} ${ex.equipment}`.toLowerCase().includes(q);
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
              Pick exercises by group or search by name — tune sets and reps after.
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
          <div className="flex items-center gap-2 rounded-[12px] border border-input bg-background px-3.5 py-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
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
                    ? "bg-primary text-white shadow-micro"
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
                      {muscleText(ex)} · {ex.equipment}
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
          <Button variant="white" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { data: exercises } = useExercises();
  const { data: templates } = useRoutineTemplates();
  const [templateKey, setTemplateKey] = useState("free");
  const [routineName, setRoutineName] = useState("");
  const [lines, setLines] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportedNote, setExportedNote] = useState(false);

  const templateOptions = [
    { key: "free", label: "Free", template: null },
    ...(templates || []).map((template) => ({
      key: template.group.toLowerCase(),
      label: template.group,
      template,
    })),
  ];

  const applyTemplate = (option) => {
    setTemplateKey(option.key);
    if (option.template) {
      setRoutineName(option.template.name);
      setLines(
        option.template.exercises.map((line) => ({
          exerciseId: line.id,
          sets: line.sets,
          reps: line.reps,
        }))
      );
    } else {
      setRoutineName("");
      setLines([]);
    }
    setSavedNote(false);
    setExportedNote(false);
  };

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
    if (!lines.length) return;
    setSaving(true);
    const saved = await workoutService.saveCustomRoutine({
      name: routineName || "My Routine",
      group: "Custom",
      description: "",
      exercises: lines.map((line) => ({
        exerciseId: line.exerciseId,
        sets: line.sets,
        reps: line.reps,
      })),
    });
    setRoutineName(saved.name);
    setSaving(false);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  const handleExport = async () => {
    if (!lines.length) return;
    setExporting(true);
    await exportWorkoutPdf({
      title: routineName || "Built workout",
      exercises: lines.map((line) => ({
        exerciseId: line.exerciseId,
        sets: line.sets,
        reps: line.reps,
      })),
    });
    setExporting(false);
    setExportedNote(true);
    setTimeout(() => setExportedNote(false), 2500);
  };

  const all = exercises || [];
  const exerciseById = new Map(all.map((ex) => [ex.id, ex]));
  const usedIds = new Set(lines.map((line) => line.exerciseId));

  const totalSets = lines.reduce((acc, line) => acc + line.sets, 0);

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
              Routine saved locally
            </Badge>
          )}
          {exportedNote && (
            <Badge variant="primary">
              <IconFileTypePdf className="h-3.5 w-3.5" />
              PDF exported
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

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Templates
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {templateOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => applyTemplate(option)}
                className={cn(
                  "rounded-[16px] border p-4 text-left shadow-subtle transition-colors",
                  templateKey === option.key
                    ? "border-primary/50 bg-primary-subtle/50"
                    : "border-sidebar-border bg-card hover:border-primary/40 hover:bg-primary-subtle/40"
                )}
              >
                <p className="font-display text-base font-bold text-foreground">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.template
                    ? `${option.template.exercises.length} exercises`
                    : "Start from scratch"}
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-border bg-card px-4 py-4 text-sm font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary-subtle/50"
          >
            <IconPlus className="h-4 w-4" />
            Create workout
          </button>
        </div>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-5">
            <div>
              <p className="font-display text-lg font-bold text-foreground">
                {routineName || "Built workout"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {lines.length} exercises · {totalSets} sets
              </p>
            </div>
            {lines.length > 0 && templateKey !== "free" && (
              <Badge variant="primary">{templateKey}</Badge>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-primary-subtle text-primary">
                <IconDumbbell className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Workout is empty</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Hit "Create workout" to pick exercises by group or search by
                  name, or load a template above.
                </p>
              </div>
              <Button onClick={() => setShowPicker(true)}>
                <IconPlus className="h-4 w-4" />
                Create workout
              </Button>
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
                          <p className="mt-1 text-xs font-medium text-neutral">
                            {exercise ? exercise.equipment : ""}
                          </p>
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
      </div>

      {showPicker && (
        <ExercisePicker
          exercises={all}
          usedIds={usedIds}
          onAdd={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}