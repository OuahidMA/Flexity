import { useEffect, useState } from "react";
import { workoutService } from "@/lib/workoutService";

function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetcher().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}

export function useExercises(refreshKey) {
  return useAsync(workoutService.getExercises, [refreshKey]);
}

export function useRoutineTemplates() {
  return useAsync(workoutService.getRoutineTemplates);
}

export function useCustomRoutines(refreshKey) {
  return useAsync(workoutService.getCustomRoutines, [refreshKey]);
}

export function useRecentActivity() {
  return useAsync(workoutService.getRecentActivity);
}

export function useWeeklyStats() {
  return useAsync(workoutService.getWeeklyStats);
}

export function useSavedWorkouts(refreshKey) {
  return useAsync(workoutService.getSavedWorkouts, [refreshKey]);
}