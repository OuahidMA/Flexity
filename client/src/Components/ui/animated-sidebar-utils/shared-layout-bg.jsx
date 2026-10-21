import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const SharedLayoutBg = forwardRef(function SharedLayoutBg(
  { as: Component = "div", className, children, ...props },
  ref,
) {
  return (
    <Component ref={ref} className={cn("relative", className)} {...props}>
      {children}
    </Component>
  )
})
