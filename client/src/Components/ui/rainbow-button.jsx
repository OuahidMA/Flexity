/* eslint-disable react-refresh/only-export-components */
/**
 * RainbowButton — the MagicUI animated-gradient button, retuned to the Flexity
 * gold palette: the upstream rainbow stops are replaced with gold/yellow, so the
 * CTA keeps the brand's single gold accent while picking up the moving shine.
 *
 * The gradient itself lives in the `gold-shimmer` utility in `index.css`: an
 * animated gold gradient across the face plus a blurred copy behind it that
 * acts as the glow. The component follows the project's Base UI `render`
 * convention, so it can be a router link:
 *
 *   <RainbowButton render={<Link to="/login" />} nativeButton={false}>
 *     Get started
 *   </RainbowButton>
 */
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const rainbowButtonVariants = cva(
  cn(
    "group relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
    "rounded-sm border border-gold-2/70 cap-label whitespace-nowrap text-on-primary no-underline",
    "gold-shimmer animate-rainbow outline-none",
    "transition-[filter,translate] duration-200 hover:brightness-110 active:translate-y-px active:brightness-95",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-11 px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const RainbowButton = ({ className, size, render, ...props }) => (
  <ButtonPrimitive
    data-slot="button"
    render={render}
    className={cn(rainbowButtonVariants({ size, className }))}
    {...props}
  />
)

RainbowButton.displayName = "RainbowButton"

export { RainbowButton, rainbowButtonVariants }
