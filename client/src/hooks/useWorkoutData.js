import { useEffect, useState } from "react";
import { workoutService } from "@/lib/workoutService";

function useAsync(fetcher, refreshKey) {
  const [state, setState] = useState({
    data: null,
    error: null,
    requestKey: refreshKey,
    complete: false,
  });
  const loading = !state.complete || state.requestKey !== refreshKey;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetcher(controller.signal)
      .then((result) => {
        if (active) {
          setState({
            data: result,
            error: null,
            requestKey: refreshKey,
            complete: true,
          });
        }
      })
      .catch((requestError) => {
        if (active && requestError.name !== "AbortError") {
          setState((current) => ({
            ...current,
            error:
              requestError instanceof Error
                ? requestError
                : new Error("Unable to load data."),
            requestKey: refreshKey,
            complete: true,
          }));
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fetcher, refreshKey]);

  return { data: state.data, loading, error: state.error };
}

export function useExercises(refreshKey) {
  return useAsync(workoutService.getExercises, refreshKey);
}

export function useRoutineTemplates() {
  return useAsync(workoutService.getRoutineTemplates);
}

export function useSavedWorkouts(refreshKey) {
  return useAsync(workoutService.getSavedWorkouts, refreshKey);
}
