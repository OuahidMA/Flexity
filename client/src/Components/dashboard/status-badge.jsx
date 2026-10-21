/**
 * Maps status strings to badge colors shared across dashboards.
 *
 * Statuses can originate as booleans mapped to "Active"/"Inactive" or as raw
 * API values (sometimes title-cased by the page), so unknown values deliberately
 * fall back to the neutral outline style.
 */
import { Badge } from "@/components/ui/badge"

const VARIANTS = {
  Active: "success",
  Completed: "success",
  Paid: "success",
  Pending: "warning",
  Scheduled: "warning",
  Trial: "warning",
  Inactive: "secondary",
  Rest: "secondary",
  Paused: "secondary",
  Draft: "outline",
  Available: "success",
  "On my roster": "success",
  Assigned: "secondary",
}

/**
 * @param {object} props
 * @param {string} props.status - Display label (also used as the badge text).
 * @returns {JSX.Element} Badge tinted according to the status.
 */
export function StatusBadge({ status }) {
  return <Badge variant={VARIANTS[status] ?? "outline"}>{status}</Badge>
}
