import { cva } from "class-variance-authority"

import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[2px] border px-2.5 py-0.5 text-[10px] font-normal tracking-[0.12em] uppercase whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-[#3a3a3a] bg-[#181818] text-white",
        destructive:
          "border-[#F04438]/40 bg-[#F04438]/10 text-[#FFA198]",
        success:
          "border-[#7D7D7D]/50 bg-[#202020] text-white",
        warning:
          "border-[#7D7D7D]/40 bg-[#202020] text-[#E6E6E6]",
        outline: "border-[#494949] bg-transparent text-[#E6E6E6]",
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
