/**
 * Compact KPI tile for dashboard summary grids (members, routines, volume, …).
 * Presentation only: callers format the values and supply the optional trend.
 */
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "cn"

/**
 * Dashboard KPI tile.
 *
 * @param {object} props
 * @param {string} props.label - Metric name.
 * @param {React.ReactNode} props.value - Already-formatted primary value.
 * @param {string} [props.hint] - Secondary context (e.g. "of 12 total").
 * @param {React.ComponentType} [props.icon] - Optional icon component.
 * @param {React.ReactNode} [props.trend] - Change indicator, if provided.
 * @param {"up"|"down"} [props.trendDirection="up"] - Selects arrow and color;
 *   down trends are shown in red.
 * @returns {JSX.Element} Bordered metric card.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  trendDirection = "up",
}) {
  const TrendIcon = trendDirection === "down" ? ArrowDownRight : ArrowUpRight

  return (
    <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface-1 p-5 transition-colors hover:border-hairline-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-ink-subtle">
            {label}
          </p>
          <p className="display-md mt-3 text-ink">
            {value}
          </p>
        </div>
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-muted">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 caption",
              trendDirection === "down"
                ? "text-destructive"
                : "text-semantic-success"
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend}
          </span>
        )}
        {hint && (
          <span className="caption text-ink-subtle">{hint}</span>
        )}
      </div>
    </div>
  )
}
