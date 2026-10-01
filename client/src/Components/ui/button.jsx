import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[12px] border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-orange-500 focus-visible:ring-3 focus-visible:ring-orange-500/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='size-'])]:text-inherit",
  {
    variants: {
      variant: {
        default:
          "bg-orange-600 text-white shadow-micro hover:bg-orange-700 focus-visible:bg-orange-700",
        outline:
          "border-orange-700 bg-background text-orange-700 hover:bg-orange-100 dark:bg-transparent",
        subtle:
          "bg-orange-100 px-2 py-2 text-orange-700 hover:bg-orange-200 hover:text-orange-800",
        white:
          "bg-background text-foreground shadow-subtle hover:bg-muted dark:bg-popover",
        secondary:
          "bg-muted text-foreground hover:bg-secondary dark:bg-muted",
        ghost:
          "text-neutral hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-orange-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-4 py-[13px]",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-9 gap-1.5 px-3 text-sm",
        lg: "h-12 gap-2 px-5",
        icon: "size-11 px-0",
        "icon-sm": "size-9 px-0",
        "icon-xs": "size-8 px-0",
        "icon-lg": "size-12 px-0",
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
      {...props} />
  );
}

export { Button }