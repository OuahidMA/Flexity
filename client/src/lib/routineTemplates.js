const routineTemplates = [
  {
    id: "template-push",
    name: "Push Day",
    group: "Push",
    description: "Chest, shoulders and triceps volume block.",
    exercises: [
      { id: "push-1", sets: 4, reps: 8 },
      { id: "push-2", sets: 3, reps: 10 },
      { id: "push-3", sets: 4, reps: 8 },
      { id: "push-4", sets: 3, reps: 12 },
      { id: "push-6", sets: 3, reps: 12 },
      { id: "push-9", sets: 3, reps: 10 },
    ],
  },
  {
    id: "template-pull",
    name: "Pull Day",
    group: "Pull",
    description: "Back, lats and biceps strength focus.",
    exercises: [
      { id: "pull-1", sets: 3, reps: 5 },
      { id: "pull-4", sets: 4, reps: 10 },
      { id: "pull-3", sets: 3, reps: 10 },
      { id: "pull-5", sets: 3, reps: 12 },
      { id: "pull-7", sets: 3, reps: 10 },
      { id: "pull-8", sets: 3, reps: 12 },
    ],
  },
  {
    id: "template-legs",
    name: "Leg Day",
    group: "Legs",
    description: "Quads, hamstrings and glutes with heavy compounds.",
    exercises: [
      { id: "legs-1", sets: 4, reps: 8 },
      { id: "legs-2", sets: 3, reps: 10 },
      { id: "legs-3", sets: 3, reps: 12 },
      { id: "legs-4", sets: 3, reps: 10 },
      { id: "legs-6", sets: 3, reps: 12 },
      { id: "legs-8", sets: 3, reps: 10 },
    ],
  },
];

export default routineTemplates;