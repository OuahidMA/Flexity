import { cva } from "class-variance-authority";
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-sm font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "bg-success-subtle text-success-foreground",
        neutral: "bg-secondary text-secondary-foreground",
        primary: "bg-primary-subtle text-primary",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border bg-background text-neutral",
        push: "bg-category-push text-category-push-ink",
        pull: "bg-category-pull text-category-pull-ink",
        legs: "bg-category-legs text-category-legs-ink",
      },
    },
    defaultVariants: {
      variant: "neutral",
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
  );
}

export { Badge }