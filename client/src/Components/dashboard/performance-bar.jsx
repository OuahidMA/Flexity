/**
 * Compact percentage bar used inside tables and summary cards.
 *
 * @param {object} props
 * @param {number|string} props.value - Percentage; clamped to 0–100 and
 *   coerced so null/invalid input renders as 0 instead of NaN.
 * @returns {JSX.Element} Bar plus numeric percentage.
 */
export function PerformanceBar({ value }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden bg-surface-3">
        <div
          className="h-full bg-primary"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-ink-subtle tabular-nums">
        {clamped}%
      </span>
    </div>
  )
}
