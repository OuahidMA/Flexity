import { cva } from "class-variance-authority"

import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xs border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-hairline-strong bg-surface-2 text-ink",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
        success: "border-semantic-success/40 bg-semantic-success/10 text-semantic-success",
        warning: "border-semantic-warning/40 bg-semantic-warning/10 text-semantic-warning",
        outline: "border-hairline-strong bg-transparent text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge }
