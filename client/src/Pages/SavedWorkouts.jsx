import { useState } from "react";
import {
  IconFileTypePdf,
  IconTrash,
  IconFolderOpen,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSavedWorkouts } from "@/hooks/useWorkoutData";
import { workoutService } from "@/lib/workoutService";
import { exportWorkoutPdf } from "@/lib/pdf";
import { CATEGORY_BADGE_VARIANT, normalizeCategory } from "@/lib/exercises";

export default function SavedWorkouts() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportingId, setExportingId] = useState(null);
  const [exportError, setExportError] = useState(null);
  const { data: workouts, loading } = useSavedWorkouts(refreshKey);

  const handleExport = async (workout) => {
    setExportingId(workout.id);
    setExportError(null);
    try {
      await exportWorkoutPdf({
        title: workout.title,
        group: workout.group,
        description: workout.description,
        duration: workout.duration,
        lines: workout.lines || [],
      });
    } catch {
      setExportError("Could not export PDF. Try again.");
    } finally {
      setTimeout(() => setExportingId(null), 1800);
    }
  };

  const handleDelete = async (id) => {
    await workoutService.deleteWorkout(id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Saved / Offline Workouts
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">
            Workouts stored locally on this device for quick offline access and
            PDF export.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary-subtle text-primary">
              <IconFolderOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Offline storage</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Exports render as {workouts ? workouts.length : "—"} cards.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(3)].map((_, idx) => (
              <div key={idx} className="h-48 animate-pulse rounded-[16px] bg-muted" />
            ))
          : (workouts || []).map((workout) => (
              <Card key={workout.id} className="flex flex-col">
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg">{workout.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{workout.completedAt}</p>
                  </div>
                  <Badge variant={CATEGORY_BADGE_VARIANT[normalizeCategory(workout.group)] || "outline"}>
                    {workout.group}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="grid grid-cols-3 gap-3 rounded-[12px] bg-muted/60 px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Exercises</p>
                      <p className="mt-0.5 text-base font-semibold text-foreground">
                        {workout.exercises}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="mt-0.5 text-base font-semibold text-foreground">
                        {workout.volume || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="mt-0.5 text-base font-semibold text-foreground">
                        {workout.duration || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleExport(workout)}
                    >
                      {exportingId === workout.id ? (
                        <>
                          <IconCheck className="h-4 w-4" />
                          Exported
                        </>
                      ) : (
                        <>
                          <IconFileTypePdf className="h-4 w-4" />
                          Export PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(workout.id)}
                      aria-label={`Delete ${workout.title}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {exportError && (
        <Card className="mt-6">
          <CardContent className="px-6 py-4 text-sm text-destructive">
            {exportError}
          </CardContent>
        </Card>
      )}

      {!loading && workouts && workouts.length === 0 && (
        <Card className="mt-6">
          <CardContent className="px-6 py-10 text-center">
            <p className="text-base font-medium text-foreground">No saved workouts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save a routine from the dashboard or the routine builder, or finish a
              tracked session, and it will appear here ready for export.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}