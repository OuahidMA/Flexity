/**
 * Browser-local persistence for coach-defined exercises and client progress.
 *
 * These records intentionally never reach the API. Each value is namespaced by
 * the signed-in user id so multiple accounts sharing a browser stay isolated.
 * localStorage can throw (private mode, quota); reads fall back to an empty
 * collection and writes fail silently so the UI keeps working.
 */

const STORAGE_PREFIX = "flexity"

/**
 * @param {string} scope - Logical collection name.
 * @param {string|null|undefined} userId - Owner of the collection.
 * @returns {string} Namespaced localStorage key.
 */
function storageKey(scope, userId) {
  return `${STORAGE_PREFIX}:${scope}:${userId || "anonymous"}`
}

/**
 * @param {string} key - localStorage key.
 * @param {*} fallback - Value returned when nothing valid is stored.
 * @returns {*} Parsed value or the fallback.
 */
function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback

    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

/**
 * @param {string} key - localStorage key.
 * @param {*} value - JSON-serializable value.
 */
function writeJson(key, value) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota/private-mode failures must not break the page.
  }
}

/**
 * Builds a 24-character hex id so a local exercise id is accepted wherever the
 * server expects an ObjectId (for example `Routine.exercises[].exerciseId`).
 *
 * @returns {string} ObjectId-compatible hex string.
 */
export function createLocalId() {
  let id = ""

  while (id.length < 24) {
    id += Math.floor(Math.random() * 16).toString(16)
  }

  return id
}

/**
 * @param {string|null|undefined} userId
 * @returns {Array<object>} Custom exercises saved in this browser.
 */
export function getLocalExercises(userId) {
  const stored = readJson(storageKey("exercises", userId), [])
  return Array.isArray(stored) ? stored : []
}

/**
 * Normalizes the create-exercise form into the shape the library renders.
 *
 * @param {{ name?: string, primaryMuscle?: string, secondaryMuscles?: string|string[] }} values
 * @returns {object} Local custom exercise.
 */
export function buildLocalExercise(values) {
  const secondaryMuscles = Array.isArray(values.secondaryMuscles)
    ? values.secondaryMuscles
    : String(values.secondaryMuscles ?? "")
        .split(",")
        .map((muscle) => muscle.trim())
        .filter(Boolean)

  return {
    id: createLocalId(),
    name: String(values.name ?? "").trim(),
    primaryMuscle: String(values.primaryMuscle ?? "").trim(),
    secondaryMuscles,
    isCustom: true,
    isLocal: true,
    // Defaults keep the details dialog and cards safe to render.
    description: "",
    category: "",
    bodyPart: "",
    equipment: "",
    difficulty: "",
    instructions: [],
    tips: [],
    goals: [],
    tags: [],
    targetMuscles: { primary: [], secondary: [] },
  }
}

/**
 * @param {string|null|undefined} userId
 * @param {object} exercise - Result of `buildLocalExercise`.
 * @returns {Array<object>} Updated collection.
 */
export function addLocalExercise(userId, exercise) {
  const next = [...getLocalExercises(userId), exercise]
  writeJson(storageKey("exercises", userId), next)
  return next
}

/**
 * @param {string|null|undefined} userId
 * @param {string} id - Local exercise id.
 * @returns {Array<object>} Updated collection.
 */
export function removeLocalExercise(userId, id) {
  const next = getLocalExercises(userId).filter(
    (exercise) => exercise.id !== id
  )
  writeJson(storageKey("exercises", userId), next)
  return next
}

/**
 * @param {string|null|undefined} userId
 * @returns {Array<object>} Progress entries, newest first.
 */
export function getProgressLogs(userId) {
  const stored = readJson(storageKey("progress", userId), [])
  return Array.isArray(stored) ? stored : []
}

/**
 * Stores one logged session and returns the refreshed, newest-first list.
 *
 * @param {string|null|undefined} userId
 * @param {object} log - `{ date, exerciseName, primaryMuscle, sets, volume }`.
 * @returns {Array<object>} Updated collection.
 */
export function addProgressLog(userId, log) {
  const next = [log, ...getProgressLogs(userId)].sort(
    (first, second) => new Date(second.date) - new Date(first.date)
  )

  writeJson(storageKey("progress", userId), next)
  return next
}
