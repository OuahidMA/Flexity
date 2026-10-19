/**
 * Shared loading/error/empty placeholders used by dashboard pages so async
 * states look consistent across every role workspace.
 */
import { AlertCircle, Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * @param {object} props
 * @param {string} [props.label="Loading..."] - Context-specific status text.
 * @returns {JSX.Element} Centered spinner with uppercase status label.
 */
export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-[10px] tracking-[0.24em] text-[#7D7D7D] uppercase">
      <Loader2 className="size-4 animate-spin text-white" />
      {label}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} [props.message] - Error text from the failed request.
 * @param {() => void} [props.onRetry] - When provided, renders a retry button
 *   that callers wire to `useApiData().refresh`.
 * @returns {JSX.Element} Inline error panel.
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 border border-[#262626] bg-[#181818] p-6 text-center">
      <AlertCircle className="size-6 text-[#F04438]" />
      <p className="max-w-md text-sm text-[#7D7D7D]">
        {message || "Unable to load this data. Please try again."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} props.title - Short empty-state heading.
 * @param {string} [props.description] - Explanation of what will appear here.
 * @param {React.ReactNode} [props.action] - Optional CTA (usually a link/button).
 * @returns {JSX.Element} Dashed empty panel.
 */
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 border border-dashed border-[#3a3a3a] bg-[#181818] p-8 text-center">
      <Inbox className="size-6 text-[#494949]" />
      <p className="text-sm font-normal tracking-[0.08em] text-white uppercase">
        {title}
      </p>
      {description && (
        <p className="max-w-md text-sm text-[#7D7D7D]">{description}</p>
      )}
      {action}
    </div>
  )
}
