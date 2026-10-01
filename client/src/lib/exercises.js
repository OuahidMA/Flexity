export const GROUPS = ["Push", "Pull", "Legs"];

export const CATEGORY_BADGE_VARIANT = {
  Push: "push",
  Pull: "pull",
  Legs: "legs",
};

const GROUP_LOOKUP = new Map(GROUPS.map((group) => [group.toLowerCase(), group]));

export const normalizeCategory = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return GROUP_LOOKUP.get(raw.toLowerCase()) ?? raw;
};

const exercises = [];

export default exercises;
