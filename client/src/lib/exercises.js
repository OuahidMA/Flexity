export const GROUPS = ["Push", "Pull", "Legs", "Abs"];

const exercises = [
  // Push
  { id: "push-1", name: "Barbell Bench Press", targetMuscle: "Chest", group: "Push", equipment: "Barbell" },
  { id: "push-2", name: "Incline Dumbbell Press", targetMuscle: "Upper Chest", group: "Push", equipment: "Dumbbells" },
  { id: "push-3", name: "Overhead Press", targetMuscle: "Shoulders", group: "Push", equipment: "Barbell" },
  { id: "push-4", name: "Dumbbell Lateral Raise", targetMuscle: "Shoulders", group: "Push", equipment: "Dumbbells" },
  { id: "push-5", name: "Cable Fly", targetMuscle: "Chest", group: "Push", equipment: "Cable" },
  { id: "push-6", name: "Triceps Pushdown", targetMuscle: "Triceps", group: "Push", equipment: "Cable" },
  { id: "push-7", name: "Close Grip Bench Press", targetMuscle: "Triceps", group: "Push", equipment: "Barbell" },
  { id: "push-8", name: "Arnold Press", targetMuscle: "Shoulders", group: "Push", equipment: "Dumbbells" },
  { id: "push-9", name: "Dips", targetMuscle: "Chest", group: "Push", equipment: "Bodyweight" },
  { id: "push-10", name: "Pec Deck Fly", targetMuscle: "Chest", group: "Push", equipment: "Machine" },

  // Pull
  { id: "pull-1", name: "Deadlift", targetMuscle: "Back", group: "Pull", equipment: "Barbell" },
  { id: "pull-2", name: "Weighted Pull-Up", targetMuscle: "Lats", group: "Pull", equipment: "Bodyweight" },
  { id: "pull-3", name: "Barbell Bent-Over Row", targetMuscle: "Back", group: "Pull", equipment: "Barbell" },
  { id: "pull-4", name: "Lat Pulldown", targetMuscle: "Lats", group: "Pull", equipment: "Cable" },
  { id: "pull-5", name: "Seated Cable Row", targetMuscle: "Back", group: "Pull", equipment: "Cable" },
  { id: "pull-6", name: "Face Pull", targetMuscle: "Rear Delts", group: "Pull", equipment: "Cable" },
  { id: "pull-7", name: "Barbell Curl", targetMuscle: "Biceps", group: "Pull", equipment: "Barbell" },
  { id: "pull-8", name: "Hammer Curl", targetMuscle: "Biceps", group: "Pull", equipment: "Dumbbells" },
  { id: "pull-9", name: "Single-Arm Dumbbell Row", targetMuscle: "Back", group: "Pull", equipment: "Dumbbells" },
  { id: "pull-10", name: "Barbell Shrug", targetMuscle: "Traps", group: "Pull", equipment: "Barbell" },

  // Legs
  { id: "legs-1", name: "Back Squat", targetMuscle: "Quads", group: "Legs", equipment: "Barbell" },
  { id: "legs-2", name: "Romanian Deadlift", targetMuscle: "Hamstrings", group: "Legs", equipment: "Barbell" },
  { id: "legs-3", name: "Leg Press", targetMuscle: "Quads", group: "Legs", equipment: "Machine" },
  { id: "legs-4", name: "Walking Lunge", targetMuscle: "Glutes", group: "Legs", equipment: "Dumbbells" },
  { id: "legs-5", name: "Leg Extension", targetMuscle: "Quads", group: "Legs", equipment: "Machine" },
  { id: "legs-6", name: "Lying Leg Curl", targetMuscle: "Hamstrings", group: "Legs", equipment: "Machine" },
  { id: "legs-7", name: "Seated Calf Raise", targetMuscle: "Calves", group: "Legs", equipment: "Machine" },
  { id: "legs-8", name: "Hip Thrust", targetMuscle: "Glutes", group: "Legs", equipment: "Barbell" },
  { id: "legs-9", name: "Bulgarian Split Squat", targetMuscle: "Quads", group: "Legs", equipment: "Dumbbells" },
  { id: "legs-10", name: "Standing Calf Raise", targetMuscle: "Calves", group: "Legs", equipment: "Machine" },
];

export default exercises;