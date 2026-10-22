import * as React from "react"

import { cn } from "cn"

/** Form labels are micro-caps so every control in the system shouts in caps. */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="label"
    className={cn(
      "flex items-center gap-2 cap-label text-ink-muted select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
