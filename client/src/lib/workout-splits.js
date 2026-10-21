/**
 * Shared vocabulary for workout split types and weekly schedules.
 *
 * `dayOfWeek` follows JavaScript/FullCalendar numbering (0 = Sunday through
 * 6 = Saturday). UI lists are ordered Monday-first, which matches the default
 * `firstDay` used by the client calendar.
 */

export const SPLIT_TYPES = [
  {
    value: "push_pull_legs",
    label: "Push/Pull/Legs",
    parts: ["Push", "Pull", "Legs"],
  },
  {
    value: "full_body",
    label: "Full Body Split",
    parts: ["Full Body"],
  },
  {
    value: "upper_lower",
    label: "Upper/Lower Split",
    parts: ["Upper", "Lower"],
  },
  {
    value: "upper_lower_push_pull_legs",
    label: "Upper/Lower/Push/Pull/Legs",
    parts: ["Upper", "Lower", "Push", "Pull", "Legs"],
  },
]

export const WEEKDAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
]

// Default split rotation per weekday. Coaches can change any day to rest or to
// a different split part; these are only sensible starting values.
const DEFAULT_PATTERNS = {
  push_pull_legs: {
    1: "Push",
    2: "Pull",
    3: "Legs",
    4: "Rest",
    5: "Push",
    6: "Pull",
    0: "Rest",
  },
  full_body: {
    1: "Full Body",
    2: "Rest",
    3: "Full Body",
    4: "Rest",
    5: "Full Body",
    6: "Rest",
    0: "Rest",
  },
  upper_lower: {
    1: "Upper",
    2: "Lower",
    3: "Rest",
    4: "Upper",
    5: "Lower",
    6: "Rest",
    0: "Rest",
  },
  upper_lower_push_pull_legs: {
    1: "Upper",
    2: "Lower",
    3: "Push",
    4: "Pull",
    5: "Legs",
    6: "Rest",
    0: "Rest",
  },
}

/**
 * @param {string|null|undefined} value
 * @returns {{ value: string, label: string, parts: string[] }} Matching split.
 */
export function getSplit(value) {
  return (
    SPLIT_TYPES.find((split) => split.value === value) ?? SPLIT_TYPES[0]
  )
}

/**
 * @param {string|null|undefined} splitType
 * @returns {string} Human-readable split name.
 */
export function getSplitLabel(splitType) {
  return getSplit(splitType).label
}

/**
 * @param {string|null|undefined} splitType
 * @param {number} dayOfWeek - 0 (Sunday) through 6 (Saturday).
 * @returns {string} Default label ("Push", "Legs", "Rest", ...).
 */
export function getDefaultDayLabel(splitType, dayOfWeek) {
  const split = getSplit(splitType)
  return DEFAULT_PATTERNS[split.value]?.[dayOfWeek] ?? "Rest"
}

/**
 * Builds an editable week for the coach builder.
 *
 * @param {string|null|undefined} splitType
 * @returns {Array<{ dayOfWeek: number, isRest: boolean, label: string }>}
 */
export function buildDefaultWeek(splitType) {
  return WEEKDAYS.map((weekday) => {
    const label = getDefaultDayLabel(splitType, weekday.value)
    return {
      dayOfWeek: weekday.value,
      isRest: label === "Rest",
      label,
    }
  })
}

/**
 * @param {number} dayOfWeek - 0 (Sunday) through 6 (Saturday).
 * @param {{ short?: boolean }} [options]
 * @returns {string} Weekday name, or an empty string for an invalid value.
 */
export function getWeekdayLabel(dayOfWeek, { short = false } = {}) {
  const weekday = WEEKDAYS.find((item) => item.value === Number(dayOfWeek))
  if (!weekday) return ""
  return short ? weekday.short : weekday.label
}

/**
 * @param {string|null|undefined} scheduleMode
 * @returns {string} Display label for a day/week schedule.
 */
export function getScheduleModeLabel(scheduleMode) {
  return scheduleMode === "day" ? "Single day" : "Full week"
}
