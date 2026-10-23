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

/**
 * Builds one chronological series per exercise for the progression chart.
 *
 * Multiple logs of the same exercise on the same day (for example two routine
 * lines) collapse into a single session: the point is the heaviest set lifted
 * that day and the bar is the combined volume. Exercises that were only ever
 * logged as bodyweight are omitted because they have no weight to plot.
 *
 * @param {Array<object>} logs - Serialized progress logs, any order.
 * @returns {Array<object>} Exercise series, most recently trained first.
 */
export function buildExerciseProgress(logs) {
  const groups = new Map()

  for (const log of logs ?? []) {
    const exerciseName = String(log.exerciseName ?? "").trim()
    const groupKey = log.exerciseId
      ? `id:${log.exerciseId}`
      : `name:${exerciseName.toLowerCase()}`
    const dateKey = progressDateKey(log.date)

    if (!groupKey || !dateKey) continue

    let group = groups.get(groupKey)

    if (!group) {
      group = {
        key: groupKey,
        name: exerciseName || "Exercise",
        primaryMuscle: log.primaryMuscle ?? "",
        sessions: new Map(),
        totalVolume: 0,
      }
      groups.set(groupKey, group)
    }

    // Logs snapshot the exercise name, so prefer the newest non-empty snapshot.
    if (exerciseName) group.name = exerciseName
    if (log.primaryMuscle) group.primaryMuscle = log.primaryMuscle

    const weights = (log.trackingData ?? [])
      .map((set) => set.weight)
      .filter(
        (weight) => weight !== null && weight !== undefined && Number.isFinite(Number(weight))
      )
      .map(Number)
    const topWeight = weights.length > 0 ? Math.max(...weights) : null
    const volume = Number(log.volume) || 0

    const session = group.sessions.get(dateKey) ?? {
      date: dateKey,
      weight: null,
      volume: 0,
    }

    if (topWeight !== null) {
      session.weight =
        session.weight === null ? topWeight : Math.max(session.weight, topWeight)
    }

    session.volume += volume
    group.sessions.set(dateKey, session)
    group.totalVolume += volume
  }

  return [...groups.values()]
    .map(({ sessions, ...group }) => {
      const points = [...sessions.values()].sort((first, second) =>
        first.date.localeCompare(second.date)
      )
      const weightedPoints = points.filter((point) => point.weight !== null)
      const firstWeight = weightedPoints[0]?.weight ?? null
      const latestWeight = weightedPoints.at(-1)?.weight ?? null
      const bestWeight =
        weightedPoints.length > 0
          ? Math.max(...weightedPoints.map((point) => point.weight))
          : null
      const gain =
        firstWeight !== null && latestWeight !== null
          ? latestWeight - firstWeight
          : 0
      const gainPercent = firstWeight ? (gain / firstWeight) * 100 : 0
      // Three identical sessions in a row means the lifter has stalled even
      // though the volume may still be climbing.
      const recent = weightedPoints.slice(-3)
      const plateau =
        recent.length === 3 &&
        recent.every((point) => point.weight === recent[0].weight)
      const trend = plateau
        ? "plateau"
        : gain > 0
          ? "progressing"
          : gain < 0
            ? "regressing"
            : "steady"

      return {
        ...group,
        points,
        weightedPoints,
        firstWeight,
        latestWeight,
        bestWeight,
        gain,
        gainPercent,
        plateau,
        trend,
        sessions: points.length,
        lastDate: points.at(-1)?.date ?? "",
      }
    })
    .filter((group) => group.weightedPoints.length > 0)
    .sort((first, second) => second.lastDate.localeCompare(first.lastDate))
}
