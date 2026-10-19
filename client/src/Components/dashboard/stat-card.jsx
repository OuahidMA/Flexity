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
    <div className="relative overflow-hidden border border-[#262626] bg-[#202020] p-5 transition-colors hover:border-[#3a3a3a]">
      <div className="absolute inset-x-0 top-0 h-px bg-[#3a3a3a]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-normal tracking-[0.24em] text-[#7D7D7D] uppercase">
            {label}
          </p>
          <p className="mt-3 text-4xl leading-none font-normal tracking-[-0.03em] text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center border border-[#3a3a3a] bg-black text-[#7D7D7D]">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-normal tracking-[0.06em] uppercase",
              trendDirection === "down" ? "text-[#F04438]" : "text-white"
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend}
          </span>
        )}
        {hint && (
          <span className="text-[#7D7D7D]">{hint}</span>
        )}
      </div>
    </div>
  )
}
