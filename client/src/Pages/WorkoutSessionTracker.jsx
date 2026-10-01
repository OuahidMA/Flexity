import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlus,
  IconCheck,
  IconClock,
  IconFileTypePdf,
  IconDumbbell,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExercises, useRoutineTemplates } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { exportWorkoutPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const buildInitialLines = (requested, templates, prebuilt) => {
  if (requested && templates) {
    const t = templates.find((x) => x.group.toLowerCase() === requested);
    if (t) {
      return t.exercises.map((line) => ({
        exerciseId: line.exercise.id,
        sets: Array.from({ length: line.sets }, () => ({
          weight: "",
          reps: line.reps,
          done: false,
        })),
      }));
    }
  }
  if (prebuilt && prebuilt.lines && prebuilt.lines.length) {
    return prebuilt.lines;
  }
  return [];
};

function SessionLog({ requested, templates, exercises, prebuilt }) {
  const navigate = useNavigate();
  const routineName =
    (templates || []).find((x) => x.group.toLowerCase() === requested)?.name ||
    prebuilt?.title ||
    "Free Session";
  const [lines, setLines] = useState(() => buildInitialLines(requested, templates, prebuilt));
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [savedId, setSavedId] = useState(null);

  const template = (templates || []).find((x) => x.group.toLowerCase() === requested);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const addExercise = (exerciseId) => {
    setLines((prev) => [
      ...prev,
      {
        exerciseId,
        sets: [
          { weight: "", reps: 10, done: false },
          { weight: "", reps: 10, done: false },
          { weight: "", reps: 10, done: false },
        ],
      },
    ]);
  };

  const patchSet = (lineIndex, setIndex, patch) => {
    setLines((prev) =>
      prev.map((line, li) =>
        li !== lineIndex
          ? line
          : {
              ...line,
              sets: line.sets.map((s, si) => (si === setIndex ? { ...s, ...patch } : s)),
            }
      )
    );
  };

  const addSet = (lineIndex) => {
    setLines((prev) =>
      prev.map((line, li) =>
        li !== lineIndex
          ? line
          : { ...line, sets: [...line.sets, { weight: "", reps: 10, done: false }] }
      )
    );
  };

  const removeSet = (lineIndex, setIndex) => {
    setLines((prev) =>
      prev.map((line, li) =>
        li !== lineIndex ? line : { ...line, sets: line.sets.filter((_, si) => si !== setIndex) }
      )
    );
  };

  const doneCount = lines.reduce(
    (acc, line) => acc + line.sets.filter((s) => s.done).length,
    0
  );
  const totalSets = lines.reduce((acc, line) => acc + line.sets.length, 0);

  const handleEnd = async () => {
    if (!totalSets) return;
    const totalVolume = lines.reduce(
      (acc, line) => acc + line.sets.reduce((a, s) => a + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
      0
    );
    const byId = new Map((exercises || []).map((ex) => [ex.id, ex]));
    const saved = await workoutService.saveWorkout({
      title: routineName,
      completedAt: new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
      }),
      exercises: lines.length,
      volume: `${totalVolume.toLocaleString("en-US")} lbs`,
      duration: formatTime(elapsed),
      group: template?.group || "Mixed",
      lines: lines.map((line) => ({
        exerciseId: line.exerciseId,
        name: byId.get(line.exerciseId)?.name || "Exercise",
        sets: line.sets,
      })),
    });
    setSavedId(saved.id);
    setTimeout(() => navigate("/saved"), 1400);
  };

  const handleExport = async () => {
    if (!totalSets) return;
    const byId = new Map((exercises || []).map((ex) => [ex.id, ex]));
    await exportWorkoutPdf({
      title: routineName,
      group: template?.group || "Mixed",
      lines: lines.map((line) => ({
        name: byId.get(line.exerciseId)?.name || "Exercise",
        sets: line.sets,
      })),
    });
  };

  const available = (exercises || []).filter(
    (ex) => !lines.some((line) => line.exerciseId === ex.id)
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Button variant="white" onClick={handleExport} disabled={!totalSets}>
          <IconFileTypePdf className="h-4 w-4" />
          Export
        </Button>
        <Button
          onClick={handleEnd}
          disabled={!totalSets || !!savedId}
          className={savedId ? "" : "bg-success hover:bg-success/90"}
        >
          <IconCheck className="h-4 w-4" />
          {savedId ? "Saved" : "End & save"}
        </Button>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>Session timer</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your time while you move between lifts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-[12px] bg-primary-subtle px-3 py-2 font-display text-lg font-bold tabular-nums text-primary">
              <IconClock className="h-4 w-4" />
              {formatTime(elapsed)}
            </span>
            <Button
              variant={running ? "secondary" : "default"}
              className="shrink-0"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? (
                <>
                  <IconPlayerPause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <IconPlayerPlay className="h-4 w-4" />
                  {elapsed ? "Resume" : "Start"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!lines.length && !requested && (
        <Card className="mt-5">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <p className="text-base font-medium text-foreground">Empty tracking session</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Add movements below to build your log on the fly, or jump into a
              saved Push, Pull or Legs routine from the dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["push", "pull", "legs"].map((g) => (
                <Button key={g} variant="subtle" onClick={() => navigate(`/session?routine=${g}`)}>
                  Start {g} routine
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-5 space-y-4">
        {lines.length === 0 && requested && !templates && (
          <div className="h-24 animate-pulse rounded-[16px] bg-muted" />
        )}
        {lines.map((line, lineIndex) => {
          const exercise = (exercises || []).find((ex) => ex.id === line.exerciseId);
          return (
            <Card key={line.exerciseId + "-" + lineIndex}>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-base">{exercise ? exercise.name : "Exercise"}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {exercise ? `${exercise.targetMuscle} · ${exercise.equipment}` : ""}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {line.sets.filter((s) => s.done).length}/{line.sets.length} sets
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sidebar-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">Set</th>
                        <th className="px-2 py-2 font-medium">Weight (lbs)</th>
                        <th className="px-2 py-2 font-medium">Reps</th>
                        <th className="py-2 pl-2 text-right font-medium">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="border-b border-sidebar-border/60 last:border-0">
                          <td className="py-2.5 pr-2 text-muted-foreground">{setIndex + 1}</td>
                          <td className="px-2 py-2.5">
                            <input
                              type="number"
                              min={0}
                              value={set.weight}
                              onChange={(e) => patchSet(lineIndex, setIndex, { weight: e.target.value })}
                              className={cn(
                                "h-9 w-20 rounded-[10px] border bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring",
                                set.done ? "border-input text-muted-foreground" : "border-input text-foreground"
                              )}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <input
                              type="number"
                              min={0}
                              value={set.reps}
                              onChange={(e) => patchSet(lineIndex, setIndex, { reps: Number(e.target.value) || 0 })}
                              className={cn(
                                "h-9 w-16 rounded-[10px] border bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring",
                                set.done ? "border-input text-muted-foreground" : "border-input text-foreground"
                              )}
                            />
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              onClick={() => patchSet(lineIndex, setIndex, { done: !set.done })}
                              aria-label={`Mark set ${setIndex + 1} done`}
                              className={cn(
                                "grid h-9 w-9 place-items-center rounded-[10px] transition-colors",
                                set.done
                                  ? "bg-success-subtle text-success-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-secondary"
                              )}
                            >
                              <IconCheck className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => addSet(lineIndex)}>
                    <IconPlus className="h-3.5 w-3.5" />
                    Add set
                  </Button>
                  {line.sets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSet(lineIndex, line.sets.length - 1)}
                      className="text-muted-foreground"
                    >
                      Remove last
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {available.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle className="text-base">Add movement</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Superset something new on the fly.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {available.slice(0, 8).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-muted px-3 text-sm font-medium text-neutral transition-colors hover:bg-orange-100 hover:text-orange-800"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  {ex.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {doneCount} / {totalSets} sets completed
      </p>
    </>
  );
}

export default function WorkoutSessionTracker() {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("routine");
  const { data: templates } = useRoutineTemplates();
  const { data: exercises } = useExercises();
  const [prebuilt] = useState(() => workoutService.getBuildWorkout());

  const template = (templates || []).find((t) => t.group.toLowerCase() === requested);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              <IconDumbbell className="h-3.5 w-3.5" />
              {template
                ? template.name
                : requested && !templates
                  ? "Loading routine…"
                  : prebuilt?.title || "Free Session"}
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Workout Session
          </h1>
        </div>
      </div>

      <SessionLog
        key={requested || "free"}
        requested={requested}
        templates={templates}
        exercises={exercises}
        prebuilt={prebuilt}
      />
    </div>
  );
}