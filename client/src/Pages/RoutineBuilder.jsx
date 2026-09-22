import { useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconClipboardList,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExercises, useRoutineTemplates } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { exportWorkoutPdf } from "@/lib/pdf";

const blankDraft = {
  name: "",
  group: "",
  description: "",
  exercises: [],
};

export default function RoutineBuilder() {
  const { data: templates, loading: templatesLoading } = useRoutineTemplates();
  const { data: exercises } = useExercises();
  const [draft, setDraft] = useState(blankDraft);
  const [saved, setSaved] = useState(false);
  const [pdfState, setPdfState] = useState(false);

  const loadTemplate = (template) => {
    setDraft({
      name: template.name,
      group: template.group,
      description: template.description,
      exercises: template.exercises.map((line) => ({
        exerciseId: line.id,
        sets: line.sets,
        reps: line.reps,
      })),
    });
    setSaved(false);
  };

  const startBlank = () => {
    setDraft({ ...blankDraft });
    setSaved(false);
  };

  const addExercise = (exerciseId) => {
    setDraft((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseId, sets: 3, reps: 10 }],
    }));
    setSaved(false);
  };

  const updateLine = (index, patch) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
    setSaved(false);
  };

  const removeLine = (index) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft.exercises.length) return;
    const savedRoutine = await workoutService.saveCustomRoutine(draft);
    setDraft((prev) => ({ ...prev, name: savedRoutine.name }));
    setSaved(true);
  };

  const handleExport = async () => {
    await exportWorkoutPdf({ title: draft.name || "Untitled routine", exercises: draft.exercises });
    setPdfState(true);
    setTimeout(() => setPdfState(false), 2500);
  };

  const usedIds = new Set(draft.exercises.map((line) => line.exerciseId));
  const available = (exercises || []).filter((ex) => !usedIds.has(ex.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Routine Builder
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Pre-build Push, Pull and Legs templates and save them for any session.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="white" onClick={handleExport} disabled={!draft.exercises.length || pdfState}>
            <IconFileTypePdf className="h-4 w-4" />
            {pdfState ? "Exported" : "Export PDF"}
          </Button>
          <Button onClick={handleSave} disabled={!draft.exercises.length}>
            <IconCheck className="h-4 w-4" />
            {saved ? "Saved" : "Save routine"}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Templates
          </p>
          <div className="mt-3 grid gap-3">
            <button
              onClick={startBlank}
              className="group rounded-[16px] border border-sidebar-border bg-background p-5 text-left shadow-subtle transition-colors hover:border-primary/40 hover:bg-primary-subtle/40"
            >
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary-subtle text-primary">
                <IconPlus className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">Blank routine</p>
              <p className="mt-1 text-sm text-muted-foreground">Start from scratch, add exercises manually.</p>
            </button>
            {templatesLoading
              ? [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-32 animate-pulse rounded-[16px] bg-muted" />
                ))
              : (templates || []).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="group rounded-[16px] border border-sidebar-border bg-background p-5 text-left shadow-subtle transition-colors hover:border-primary/40 hover:bg-primary-subtle/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary-subtle text-primary">
                        <IconClipboardList className="h-5 w-5" />
                      </div>
                      <Badge variant={template.group === "Push" ? "primary" : template.group === "Pull" ? "neutral" : "success"}>
                        {template.group}
                      </Badge>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-foreground">{template.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    <p className="mt-3 text-xs font-medium text-neutral">
                      {template.exercises.length} exercises
                    </p>
                  </button>
                ))}
          </div>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="w-full">
              <CardTitle>Routine details</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Name your routine and tune sets and reps per movement.
              </p>
            </div>
            {saved && (
              <Badge variant="success">
                <IconCheck className="h-3.5 w-3.5" />
                Saved locally
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <label className="block">
              <span className="text-sm font-medium text-neutral">Routine name</span>
              <input
                value={draft.name}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, name: e.target.value }));
                  setSaved(false);
                }}
                placeholder="e.g. Upper Body Strength"
                className="mt-1.5 h-11 w-full rounded-[12px] border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30"
              />
            </label>

            <div className="mt-5">
              {draft.exercises.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-medium text-neutral">No exercises yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick from a template or add movements below.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-sidebar-border rounded-[12px] border border-sidebar-border">
                  {draft.exercises.map((line, index) => {
                    const exercise = (exercises || []).find((ex) => ex.id === line.exerciseId);
                    return (
                      <div key={line.exerciseId + index} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-5 text-sm text-muted-foreground">{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {exercise ? exercise.name : "Unknown exercise"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exercise ? exercise.targetMuscle : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={line.sets}
                            onChange={(e) => updateLine(index, { sets: Number(e.target.value) })}
                            className="h-9 rounded-[10px] border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
                            aria-label={`Sets for ${exercise?.name || "exercise"}`}
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>{n} sets</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={line.reps}
                            min={1}
                            onChange={(e) => updateLine(index, { reps: Number(e.target.value) })}
                            className="h-9 w-14 rounded-[10px] border border-input bg-background px-2 text-center text-sm text-foreground outline-none focus:border-ring"
                            aria-label={`Reps for ${exercise?.name || "exercise"}`}
                          />
                          <button
                            onClick={() => removeLine(index)}
                            aria-label={`Remove ${exercise?.name || "exercise"}`}
                            className="grid h-8 w-8 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5">
              <span className="text-sm font-medium text-neutral">Add exercise</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {available.slice(0, 8).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-muted px-3 text-sm font-medium text-neutral transition-colors hover:bg-primary-subtle hover:text-primary"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    {ex.name}
                  </button>
                ))}
                {available.length > 8 && (
                  <span className="inline-flex h-9 items-center px-2 text-sm text-muted-foreground">
                    +{available.length - 8} more
                  </span>
                )}
                {available.length === 0 && (
                  <span className="text-sm text-muted-foreground">All exercises added.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}