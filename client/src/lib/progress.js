/**
 * Shared formatting helpers for client and coach progress views.
 *
 * Progress dates are stored as UTC midnight, so every formatter pins the
 * timezone to UTC. Without that, clients west of UTC would see a workout logged
 * on Monday as Sunday.
 */

const DATE_OPTIONS = { month: "short", day: "numeric" }

/**
 * @returns {string} Today's date as a local `yyyy-mm-dd` input value.
 */
export function todayInputValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * @param {string|Date|null|undefined} value - Stored progress date.
 * @param {{ year?: boolean }} [options] - Include the year in the label.
 * @returns {string} Localized date, or an em dash when missing/invalid.
 */
export function formatProgressDate(value, { year = false } = {}) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-US", {
    ...DATE_OPTIONS,
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
}

/**
 * @param {string|Date|null|undefined} value - Stored progress date.
 * @returns {string} `yyyy-mm-dd` key in UTC, or an empty string.
 */
export function progressDateKey(value) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 10)
}

/**
 * Compares a stored progress date with a `yyyy-mm-dd` form value.
 *
 * @param {string|Date|null|undefined} value - Stored progress date.
 * @param {string} inputValue - Date picked in the logger.
 * @returns {boolean} True when both refer to the same UTC day.
 */
export function isProgressDate(value, inputValue) {
  if (!value || !inputValue) return false
  return progressDateKey(value) === inputValue
}

/**
 * @param {number|null|undefined} weight - Null means "None" (bodyweight).
 * @returns {string} Display label for a single set's weight.
 */
export function formatProgressWeight(weight) {
  return weight == null ? "None" : `${weight} kg`
}

/**
 * Summarizes a log's per-set reps or intervals, e.g. "10 / 10 / 8" or "30s / 30s".
 *
 * @param {object} log - Serialized progress log.
 * @returns {string} Slash-separated set values.
 */
export function formatMetricSummary(log) {
  const sets = log?.trackingData ?? []

  if (sets.length === 0) return "—"

  if (log.trackingType === "time") {
    return sets.map((set) => `${set.timeSec ?? 0}s`).join(" / ")
  }

  return sets.map((set) => set.reps ?? 0).join(" / ")
}

/**
 * Summarizes a log's per-set weights, e.g. "60 / 60 / 55 kg" or "None".
 *
 * @param {object} log - Serialized progress log.
 * @returns {string} Slash-separated set weights.
 */
export function formatWeightSummary(log) {
  const sets = log?.trackingData ?? []

  if (sets.length === 0) return "—"
  if (sets.every((set) => set.weight == null)) return "None"

  const values = sets.map((set) => (set.weight == null ? "None" : set.weight))
  return `${values.join(" / ")} kg`
}

/**
 * @param {Array<object>} logs - Serialized progress logs.
 * @returns {Array<{ date: string, volume: number }>} Volume per logged day, oldest first.
 */
export function buildDailyVolume(logs) {
  const totals = new Map()

  for (const log of logs ?? []) {
    const key = progressDateKey(log.date)

    if (!key) continue

    totals.set(key, (totals.get(key) ?? 0) + (log.volume || 0))
  }

  return [...totals.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, volume]) => ({ date, volume }))
}
