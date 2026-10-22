/* eslint-disable react-refresh/only-export-components */
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import { cn } from "cn"

/**
 * Buttons follow the DESIGN.md button spec: a 6px square-ish radius, hairline
 * borders and the `button-md` label tier. On the dark canvas the primary is the
 * signature emerald `button-primary-green`; every other action stays a
 * hairline-outlined or ghost control so the emerald stays scarce.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent bg-clip-padding cap-label whitespace-nowrap no-underline transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** DESIGN.md `button-primary-green` — the signature emerald CTA. */
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
        /** DESIGN.md `button-secondary-outline` — hairline on a surface panel. */
        "secondary-outline":
          "border-hairline-strong bg-surface-1 text-ink hover:bg-surface-2 hover:text-ink",
        outline:
          "border-hairline-strong bg-transparent text-ink hover:bg-surface-2 hover:text-ink aria-expanded:bg-surface-2 aria-expanded:text-ink",
        secondary:
          "border-hairline-strong bg-surface-2 text-ink hover:bg-surface-3 hover:text-ink aria-expanded:bg-surface-3 aria-expanded:text-ink",
        ghost:
          "text-ink-muted hover:bg-surface-2 hover:text-ink aria-expanded:bg-surface-2 aria-expanded:text-ink",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-ink hover:text-ink-muted",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 gap-1 px-2 text-[11px]",
        sm: "h-8 gap-1.5 px-3 text-[12px]",
        lg: "h-12 gap-2 px-6 text-sm",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
