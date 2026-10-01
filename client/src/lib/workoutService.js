import exercises, { normalizeCategory } from "./exercises";
import routineTemplates from "./routineTemplates";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const STORAGE_KEYS = {
  savedWorkouts: "flexboard.saved-workouts",
  customExercises: "flexboard.custom-exercises",
};

// Routines saved by older builds live under their own key. They are folded into
// savedWorkouts on first read so nothing the user already created is lost.
const LEGACY_ROUTINES_KEY = "flexboard.custom-routines";

export const BUILD_WORKOUT_KEY = "flexboard.build-workout";

const delay = (ms = 320) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // storage unavailable, keep in-memory only
    return false;
  }
};

const LEGACY_SAVED_WORKOUT_IDS = new Set(["saved-1", "saved-2", "saved-3"]);

// Populated by getExercises so routines saved without network access can still
// resolve human-readable exercise names in the Saved Workouts list and the PDF.
const exerciseNameCache = new Map();

const rememberExerciseNames = (list) => {
  (list || []).forEach((exercise) => {
    if (exercise?.id && exercise?.name) {
      exerciseNameCache.set(String(exercise.id), exercise.name);
    }
  });
};

const resolveExerciseName = (line) => {
  const id = line?.exerciseId ?? line?.id ?? null;
  return (
    line?.name ||
    line?.exerciseName ||
    line?.exercise?.name ||
    (id != null ? exerciseNameCache.get(String(id)) : null) ||
    "Exercise"
  );
};

/**
 * Accepts planned lines ({ sets: 3, reps: 10 }) and tracked session lines
 * ({ sets: [{ weight, reps, done }] }) so both can be listed and exported.
 */
const toRoutineLines = (rawLines) =>
  (Array.isArray(rawLines) ? rawLines : []).map((line) => {
    const name = resolveExerciseName(line);

    if (Array.isArray(line?.sets)) {
      return {
        exerciseId: line?.exerciseId ?? null,
        name,
        sets: line.sets.length,
        reps: line.sets[0]?.reps ?? 0,
        sets_: line.sets,
      };
    }

    return {
      exerciseId: line?.exerciseId ?? null,
      name,
      sets: Number(line?.sets) || 0,
      reps: Number(line?.reps) || 0,
    };
  });

/**
 * Routines and completed sessions now share one store. Routines are normalized
 * into the same shape the Saved Workouts cards render, with `kind` telling the
 * two apart.
 */
const normalizeRoutine = (routine) => {
  const lines = toRoutineLines(routine?.exercises);
  const totalSets = lines.reduce((total, line) => total + line.sets, 0);
  const totalVolume = lines.reduce(
    (total, line) => total + line.sets * line.reps,
    0
  );
  const name = String(routine?.name || routine?.title || "Untitled routine").trim();

  return {
    id: routine?.id || `routine-${Date.now()}`,
    kind: "routine",
    title: name || "Untitled routine",
    name: name || "Untitled routine",
    group: routine?.group || "Custom",
    description: routine?.description || "",
    lines,
    exercises: lines.length,
    totalSets,
    volume: `${totalVolume.toLocaleString("en-US")} lbs`,
    duration: "",
    savedAt: routine?.savedAt || new Date().toISOString(),
    completedAt:
      routine?.completedAt ||
      new Date(routine?.savedAt || Date.now()).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
  };
};

const MIGRATION_FLAG_KEY = "flexboard.routines-migrated";

/**
 * One-time move of routines saved under the old key into savedWorkouts.
 *
 * The flag and the legacy key are both cleared once the move succeeds. Without
 * that, the migration would re-run on every read and resurrect entries the user
 * had since deleted.
 */
const migrateLegacyRoutines = (workouts) => {
  if (readStorage(MIGRATION_FLAG_KEY, false) === true) return workouts;

  const stored = readStorage(LEGACY_ROUTINES_KEY, []);
  if (!Array.isArray(stored) || stored.length === 0) {
    writeStorage(MIGRATION_FLAG_KEY, true);
    return workouts;
  }

  const knownIds = new Set(workouts.map((workout) => workout.id));
  const knownTitles = new Set(
    workouts.filter((workout) => workout.kind === "routine").map((w) => w.title)
  );

  const migrated = stored
    .map(normalizeRoutine)
    .filter((routine) => !knownIds.has(routine.id) && !knownTitles.has(routine.title));

  const next = [...migrated, ...workouts];
  const written = writeStorage(STORAGE_KEYS.savedWorkouts, next);
  if (written) {
    writeStorage(LEGACY_ROUTINES_KEY, []);
    writeStorage(MIGRATION_FLAG_KEY, true);
    return next;
  }

  // Storage rejected the write, so keep the legacy copy and retry next read.
  return workouts;
};

const readSavedWorkouts = () => {
  const stored = readStorage(STORAGE_KEYS.savedWorkouts, []);
  const workouts = Array.isArray(stored) ? stored : [];
  const filtered = workouts.filter(
    (workout) => !LEGACY_SAVED_WORKOUT_IDS.has(workout?.id)
  );
  if (filtered.length !== workouts.length) {
    writeStorage(STORAGE_KEYS.savedWorkouts, filtered);
  }
  return migrateLegacyRoutines(filtered);
};

const toCanonical = (exercise) => {
  const primarySource = exercise.primary_muscles ?? exercise.primaryMuscles;
  const primaryMuscles = (
    Array.isArray(primarySource) ? primarySource : [primarySource]
  ).filter(Boolean);
  const secondarySource =
    exercise.secondary_muscles ?? exercise.secondaryMuscles;
  const secondaryMuscles = (
    Array.isArray(secondarySource) ? secondarySource : [secondarySource]
  ).filter(Boolean);
  const equipment = Array.isArray(exercise.equipment)
    ? exercise.equipment.filter(Boolean).join(", ")
    : exercise.equipment;

  if (!primaryMuscles.length && exercise.targetMuscle) {
    primaryMuscles.push(exercise.targetMuscle);
  }

  return {
    ...exercise,
    id: exercise.id || exercise._id,
    category: normalizeCategory(exercise.category || exercise.group) || "Other",
    primaryMuscles,
    secondaryMuscles,
    equipment: equipment || "",
    targetMuscle: exercise.targetMuscle || primaryMuscles[0] || "",
  };
};

export const workoutService = {
  getExercises: async (signal) => {
    const response = await fetch(`${API_BASE_URL}/api/exercises`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    }).catch((error) => {
      if (error.name === "AbortError") {
        throw error;
      }
      throw new Error("Unable to reach the exercise service.");
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.message || `Exercise request failed (${response.status}).`
      );
    }
    if (!Array.isArray(payload)) {
      throw new Error("The exercise service returned an invalid response.");
    }

    const custom = readStorage(STORAGE_KEYS.customExercises, []);
    const all = [...payload, ...custom].map(toCanonical);
    rememberExerciseNames(all);
    return all;
  },

  saveExercise: async (exercise) => {
    await delay(200);
    const existing = readStorage(STORAGE_KEYS.customExercises, []);
    const next = [{ id: `custom-${Date.now()}`, custom: true, ...exercise }, ...existing].slice(0, 100);
    writeStorage(STORAGE_KEYS.customExercises, next);
    return next[0];
  },

  deleteExercise: async (id) => {
    await delay(160);
    const existing = readStorage(STORAGE_KEYS.customExercises, []);
    const next = existing.filter((e) => e.id !== id);
    writeStorage(STORAGE_KEYS.customExercises, next);
    return id;
  },

  getRoutineTemplates: async () => {
    await delay();
    return routineTemplates.map((t) => ({
      ...t,
      exercises: t.exercises.map((line) => ({
        ...line,
        exercise: exercises.find((e) => e.id === line.id),
      })),
    }));
  },

  saveCustomRoutine: async (routine) => {
    await delay(200);
    const existing = readSavedWorkouts();
    const record = normalizeRoutine(routine);
    const sameId = existing.findIndex((workout) => workout.id === record.id);
    const next =
      sameId >= 0
        ? existing.map((workout, index) => (index === sameId ? record : workout))
        : [record, ...existing].slice(0, 50);
    writeStorage(STORAGE_KEYS.savedWorkouts, next);
    return record;
  },

  getSavedWorkouts: async () => {
    await delay();
    return readSavedWorkouts();
  },

  saveWorkout: async (workout) => {
    await delay(220);
    const existing = readSavedWorkouts();
    const id = `saved-${Date.now()}`;
    const lines = toRoutineLines(workout.lines);
    const totalSets = lines.reduce((total, line) => total + line.sets, 0);
    const record = {
      ...workout,
      id,
      kind: "session",
      title: workout.title || "Workout",
      group: workout.group || "Mixed",
      exercises: Number(workout.exercises) || lines.length,
      totalSets: Number(workout.totalSets) || totalSets,
      lines,
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...existing];
    writeStorage(STORAGE_KEYS.savedWorkouts, next);
    return record;
  },

  deleteWorkout: async (id) => {
    await delay(160);
    const existing = readSavedWorkouts();
    const next = existing.filter((w) => w.id !== id);
    writeStorage(STORAGE_KEYS.savedWorkouts, next);
    return id;
  },

  getBuildWorkout: () => {
    try {
      const raw = sessionStorage.getItem(BUILD_WORKOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};