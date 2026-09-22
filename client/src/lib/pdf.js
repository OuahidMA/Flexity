const delay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function exportWorkoutPdf(routine) {
  await delay();
  const filename = `${slugify(routine.title || routine.name || "workout")}.pdf`;
  return {
    ok: true,
    filename,
    size: `${(360 + routine.exercises * 17).toFixed(0)} KB`,
    generatedAt: new Date().toISOString(),
  };
}