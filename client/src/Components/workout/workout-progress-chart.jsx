/**
 * Progressive-overload chart for one exercise.
 *
 * Weight is plotted as a line (heaviest set per session) against training
 * volume bars, so a lifter can see both intensity and total work climbing
 * session over session. The chart is rendered imperatively with Chart.js and is
 * rebuilt whenever the selected exercise or the active theme changes, because
 * canvas colours cannot inherit CSS variables.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js"
import { TrendingUp } from "lucide-react"

import { cn } from "cn"
import {
  buildExerciseProgress,
  formatProgressDate,
} from "@/lib/progress"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/data-state"
import { Label } from "@/components/ui/label"

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
)

// Used only before the stylesheet resolves (for example during the first paint).
const FALLBACK_TOKENS = {
  ink: "#ededed",
  inkMuted: "#a3a3a3",
  inkSubtle: "#8a8a8a",
  inkTertiary: "#707070",
  hairline: "#2e2e2e",
  surface1: "#212121",
  surface2: "#262626",
}

const TREND_BADGES = {
  progressing: { label: "Progressing", variant: "success" },
  plateau: { label: "Plateau", variant: "warning" },
  regressing: { label: "Regressing", variant: "destructive" },
  steady: { label: "Steady", variant: "outline" },
}

/**
 * Reads the semantic design tokens Chart.js needs from the live document.
 * A class change on `<html>` swaps every value, so consumers re-read on theme.
 *
 * @returns {Record<string, string>} Resolved canvas colours.
 */
function readTokens() {
  if (typeof window === "undefined") return FALLBACK_TOKENS

  const styles = window.getComputedStyle(document.documentElement)
  const read = (name, fallback) =>
    styles.getPropertyValue(name).trim() || fallback

  return {
    ink: read("--ink", FALLBACK_TOKENS.ink),
    inkMuted: read("--ink-muted", FALLBACK_TOKENS.inkMuted),
    inkSubtle: read("--ink-subtle", FALLBACK_TOKENS.inkSubtle),
    inkTertiary: read("--ink-tertiary", FALLBACK_TOKENS.inkTertiary),
    hairline: read("--hairline", FALLBACK_TOKENS.hairline),
    surface1: read("--surface-1", FALLBACK_TOKENS.surface1),
    surface2: read("--surface-2", FALLBACK_TOKENS.surface2),
  }
}

/**
 * Keeps the canvas palette in step with the next-themes class toggle.
 *
 * @returns {Record<string, string>} Current semantic colours.
 */
function useChartTokens() {
  const [tokens, setTokens] = useState(readTokens)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setTokens(readTokens())
    const observer = new MutationObserver(update)

    update()
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  return tokens
}

/**
 * Converts a hex design token to rgba so fills can stay translucent.
 *
 * @param {string} color - Hex or rgb() token value.
 * @param {number} alpha - Opacity between 0 and 1.
 * @returns {string} Canvas-safe colour.
 */
function withAlpha(color, alpha) {
  const value = String(color).trim()

  if (value.startsWith("#")) {
    const hex =
      value.length === 4
        ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
        : value

    if (hex.length >= 7) {
      const red = parseInt(hex.slice(1, 3), 16)
      const green = parseInt(hex.slice(3, 5), 16)
      const blue = parseInt(hex.slice(5, 7), 16)
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`
    }
  }

  return value
}

/**
 * @param {number} value - Weight change in kilograms.
 * @returns {string} Signed, one-decimal label, e.g. "+2.5 kg".
 */
function formatGain(value) {
  if (!Number.isFinite(value)) return "—"
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? "+" : ""}${rounded} kg`
}

/**
 * @param {number} value - Percentage change.
 * @returns {string} Signed percentage, e.g. "+4.2%".
 */
function formatPercent(value) {
  if (!Number.isFinite(value)) return "—"
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? "+" : ""}${rounded}%`
}

/**
 * Responsive progression card with an exercise switcher, trend summary, and a
 * mixed Chart.js bar/line canvas.
 *
 * @param {object} props
 * @param {Array<object>} [props.logs=[]] - Serialized progress logs.
 * @param {string} [props.title="Strength progression"] - Card heading.
 * @param {string} [props.description] - Supporting copy under the heading.
 * @param {string} [props.className] - Extra classes for the outer surface card.
 * @returns {JSX.Element} Chart.js progression card or its empty state.
 */
export function WorkoutProgressChart({
  logs = [],
  title = "Strength progression",
  description = "Heaviest set per session, shown against total training volume.",
  className,
}) {
  const groups = useMemo(() => buildExerciseProgress(logs), [logs])
  const [selectedKey, setSelectedKey] = useState(null)
  const selected =
    groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null
  const tokens = useChartTokens()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !selected) return undefined

    const font = {
      family: "Inter Variable, Inter, -apple-system, sans-serif",
    }
    const compact = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    })

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: selected.points.map((point) =>
          formatProgressDate(point.date)
        ),
        datasets: [
          {
            type: "bar",
            label: "Volume",
            data: selected.points.map((point) => point.volume),
            yAxisID: "yVolume",
            backgroundColor: withAlpha(tokens.ink, 0.1),
            hoverBackgroundColor: withAlpha(tokens.ink, 0.18),
            borderColor: withAlpha(tokens.ink, 0.18),
            borderWidth: 1,
            borderRadius: 2,
            maxBarThickness: 36,
            pointStyle: "rectRounded",
            order: 2,
          },
          {
            type: "line",
            label: "Top set (kg)",
            data: selected.points.map((point) => point.weight),
            yAxisID: "y",
            borderColor: tokens.ink,
            backgroundColor: withAlpha(tokens.ink, 0.08),
            pointBackgroundColor: tokens.ink,
            pointBorderColor: tokens.surface1,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            borderWidth: 2,
            tension: 0.35,
            spanGaps: true,
            fill: false,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            grid: { display: false },
            border: { color: tokens.hairline },
            ticks: {
              color: tokens.inkSubtle,
              font: { ...font, size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
          y: {
            beginAtZero: false,
            grace: "12%",
            position: "left",
            grid: { color: tokens.hairline, drawTicks: false },
            border: { display: false },
            ticks: {
              color: tokens.inkSubtle,
              font: { ...font, size: 11 },
              padding: 8,
              callback: (value) => `${value} kg`,
            },
            title: {
              display: true,
              text: "Top set (kg)",
              color: tokens.inkSubtle,
              font: { ...font, size: 11 },
            },
          },
          yVolume: {
            beginAtZero: true,
            position: "right",
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: tokens.inkTertiary,
              font: { ...font, size: 11 },
              padding: 8,
              maxTicksLimit: 4,
              callback: (value) => compact.format(value),
            },
            title: {
              display: true,
              text: "Volume (kg)",
              color: tokens.inkTertiary,
              font: { ...font, size: 11 },
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: tokens.inkSubtle,
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
              font: { ...font, size: 11 },
            },
          },
          tooltip: {
            backgroundColor: tokens.surface2,
            titleColor: tokens.ink,
            bodyColor: tokens.inkMuted,
            borderColor: tokens.hairline,
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            displayColors: false,
            titleFont: { ...font, size: 12, weight: "500" },
            bodyFont: { ...font, size: 12 },
            callbacks: {
              label: (context) => {
                const value = Number(context.parsed.y) || 0
                return context.dataset.yAxisID === "yVolume"
                  ? `Volume: ${value.toLocaleString()} kg`
                  : `Top set: ${value.toLocaleString()} kg`
              },
            },
          },
        },
      },
    })

    return () => chart.destroy()
  }, [selected, tokens])

  const trend = selected ? TREND_BADGES[selected.trend] : null

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-hairline bg-surface-1",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="size-4 text-ink-subtle"
              aria-hidden="true"
            />
            <h3 className="display-sm text-ink">{title}</h3>
          </div>
          <p className="caption mt-1 text-ink-subtle">{description}</p>
        </div>

        {selected && (
          <div className="w-full space-y-2 sm:w-56">
            <Label htmlFor="progress-chart-exercise">Exercise</Label>
            <select
              id="progress-chart-exercise"
              value={selected.key}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="h-9 w-full rounded-xs border border-hairline-strong bg-surface-1 px-2 text-[13px] text-ink transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {groups.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selected ? (
        <div className="p-5">
          <EmptyState
            title="No weighted workouts yet"
            description="Log a workout with a weight and your strength curve will appear here, session over session."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
            <div className="bg-surface-1 px-4 py-3">
              <p className="eyebrow text-ink-subtle">Latest top set</p>
              <p className="mt-1 text-[15px] font-medium text-ink tabular-nums">
                {selected.latestWeight !== null
                  ? `${selected.latestWeight} kg`
                  : "—"}
              </p>
              <p className="caption text-ink-subtle">
                best {selected.bestWeight ?? "—"} kg
              </p>
            </div>
            <div className="bg-surface-1 px-4 py-3">
              <p className="eyebrow text-ink-subtle">Change</p>
              <p
                className={cn(
                  "mt-1 text-[15px] font-medium tabular-nums",
                  selected.gain > 0
                    ? "text-semantic-success"
                    : selected.gain < 0
                      ? "text-destructive"
                      : "text-ink"
                )}
              >
                {formatGain(selected.gain)}
              </p>
              <p className="caption text-ink-subtle">
                {formatPercent(selected.gainPercent)} since first log
              </p>
            </div>
            <div className="bg-surface-1 px-4 py-3">
              <p className="eyebrow text-ink-subtle">Sessions</p>
              <p className="mt-1 text-[15px] font-medium text-ink tabular-nums">
                {selected.sessions}
              </p>
              <p className="caption text-ink-subtle">
                {Number(selected.totalVolume).toLocaleString()} kg volume
              </p>
            </div>
            <div className="bg-surface-1 px-4 py-3">
              <p className="eyebrow text-ink-subtle">Trend</p>
              <div className="mt-1.5">
                {trend && <Badge variant={trend.variant}>{trend.label}</Badge>}
              </div>
              <p className="caption mt-1 text-ink-subtle">
                {selected.plateau
                  ? "Same weight for 3 sessions"
                  : "Compared with your first session"}
              </p>
            </div>
          </div>

          <div className="h-64 w-full px-3 py-4 sm:h-72 sm:px-4">
            <canvas ref={canvasRef} role="img" aria-label={`${selected.name} progression chart`} />
          </div>
        </>
      )}
    </div>
  )
}

export default WorkoutProgressChart
