import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/**
 * Text inputs: 6px radius, single hairline border, 44px minimum height so the
 * field clears the touch-target floor from DESIGN.md.
 */
function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-hairline bg-surface-1 px-3 py-2 text-base text-ink transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
