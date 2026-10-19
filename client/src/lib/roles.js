/**
 * Role metadata shared by routing and navigation.
 *
 * `ROLE_HOME` is the landing route for each role; `ROLE_LABELS` is the
 * human-readable name shown in the layout header and sidebar.
 */

export const ROLE_LABELS = {
  super_admin: "Platform Super Admin",
  gym_admin: "Gym Administrator",
  coach: "Coach",
  client: "Client",
}

export const ROLE_HOME = {
  super_admin: "/dashboard",
  gym_admin: "/dashboard/gym",
  coach: "/dashboard/coach",
  client: "/dashboard/client",
}

/**
 * Resolve the dashboard landing page for a role.
 *
 * @param {string|null|undefined} role - One of the four platform roles.
 * @returns {string} Role-specific path, falling back to the shared dashboard.
 */
export function getRoleHome(role) {
  return ROLE_HOME[role] ?? "/dashboard"
}

/**
 * Resolve the display label for a role.
 *
 * @param {string|null|undefined} role - One of the four platform roles.
 * @returns {string} Display label, falling back to "Workspace".
 */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? "Workspace"
}
