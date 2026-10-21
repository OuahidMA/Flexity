import * as React from "react"

import { cn } from "cn"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="label"
    className={cn(
      "flex items-center gap-2 text-sm leading-none font-bold select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
