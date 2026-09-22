import exercises from "./exercises";
import routineTemplates from "./routineTemplates";

const STORAGE_KEYS = {
  savedWorkouts: "flexboard.saved-workouts",
  customRoutines: "flexboard.custom-routines",
  customExercises: "flexboard.custom-exercises",
};

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
  } catch {
    // storage unavailable, keep in-memory only
  }
};

const MOCK_ACTIVITY = [
  { id: "act-1", type: "workout", title: "Push Day — Upper", detail: "6 exercises · 4,320 lbs", when: "Today · 07:42" },
  { id: "act-2", type: "routine", title: "Created Leg Day template", detail: "6 exercises saved", when: "Yesterday · 19:10" },
  { id: "act-3", type: "export", title: "Exported Push Day PDF", detail: "pull-routine.pdf", when: "Yesterday · 08:15" },
  { id: "act-4", type: "workout", title: "Pull Day — Back & Biceps", detail: "5 exercises · 5,100 lbs", when: "Mon · 18:03" },
];

const MOCK_WEEKLY_STATS = {
  volume: "52,400 lbs",
  workouts: 4,
  streak: 12,
  lastWorkout: "Push Day — Upper",
  sessionsThisWeek: [3, 4, 2, 5, 3, 4, 2],
};

const seedSavedWorkouts = [
  {
    id: "saved-1",
    title: "Push Day — Upper",
    completedAt: "Today · 07:42",
    exercises: 6,
    volume: "4,320 lbs",
    duration: "48 min",
    group: "Push",
  },
  {
    id: "saved-2",
    title: "Pull Day — Back & Biceps",
    completedAt: "Mon · 18:03",
    exercises: 5,
    volume: "5,100 lbs",
    duration: "55 min",
    group: "Pull",
  },
  {
    id: "saved-3",
    title: "Leg Day — Heavy",
    completedAt: "Sat · 09:20",
    exercises: 5,
    volume: "6,040 lbs",
    duration: "61 min",
    group: "Legs",
  },
];

const toCanonical = (ex) => {
  const primaryMuscles =
    Array.isArray(ex.primaryMuscles) && ex.primaryMuscles.length
      ? ex.primaryMuscles
      : [ex.targetMuscle].filter(Boolean);
  return {
    ...ex,
    category: ex.category || ex.group || "Other",
    primaryMuscles,
    secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
    targetMuscle: ex.targetMuscle || primaryMuscles[0] || "",
    equipment: ex.equipment || "Bodyweight",
  };
};

export const workoutService = {
  getExercises: async () => {
    await delay();
    const custom = readStorage(STORAGE_KEYS.customExercises, []);
    return [...exercises, ...custom].map(toCanonical);
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

  getGroups: async () => {
    await delay(120);
    return ["Push", "Pull", "Legs"];
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

  getCustomRoutines: async () => {
    await delay(160);
    return readStorage(STORAGE_KEYS.customRoutines, []);
  },

  saveCustomRoutine: async (routine) => {
    await delay(200);
    const existing = readStorage(STORAGE_KEYS.customRoutines, []);
    const next = [{ ...routine, id: routine.id || `routine-${Date.now()}` }, ...existing].slice(0, 20);
    writeStorage(STORAGE_KEYS.customRoutines, next);
    return next[0];
  },

  getRecentActivity: async () => {
    await delay(160);
    return MOCK_ACTIVITY;
  },

  getWeeklyStats: async () => {
    await delay(160);
    return MOCK_WEEKLY_STATS;
  },

  getSavedWorkouts: async () => {
    await delay();
    return readStorage(STORAGE_KEYS.savedWorkouts, seedSavedWorkouts);
  },

  saveWorkout: async (workout) => {
    await delay(220);
    const existing = readStorage(STORAGE_KEYS.savedWorkouts, seedSavedWorkouts);
    const next = [{ id: `saved-${Date.now()}`, ...workout }, ...existing];
    writeStorage(STORAGE_KEYS.savedWorkouts, next);
    return next[0];
  },

  deleteWorkout: async (id) => {
    await delay(160);
    const existing = readStorage(STORAGE_KEYS.savedWorkouts, seedSavedWorkouts);
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

  saveBuildWorkout: async (workout) => {
    await delay(80);
    try {
      sessionStorage.setItem(BUILD_WORKOUT_KEY, JSON.stringify(workout));
    } catch {
      // session storage unavailable, open an empty session
    }
    return workout;
  },
};