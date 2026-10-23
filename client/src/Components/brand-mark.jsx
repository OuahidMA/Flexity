/**
 * Flexity brand mark.
 *
 * The supplied artwork is a square, gold-on-charcoal bitmap rather than a
 * transparent glyph, so it is rendered as a small rounded tile instead of a
 * gold plate with an icon. Keeping one component means the navbar, dashboard
 * shell and login screen all show the same mark at the same shape.
 */
import { cn } from "cn"

import logo from "@/assets/logo.png"

/**
 * @param {object} props
 * @param {string} [props.className] - Size overrides, e.g. `size-6`.
 * @param {string} [props.alt] - Alternative text. Empty by default because the
 *   mark always sits next to the visible product or workspace name.
 * @returns {JSX.Element} The logo tile.
 */
export function BrandMark({ className, alt = "" }) {
  return (
    <img
      src={logo}
      alt={alt}
      width={32}
      height={32}
      draggable={false}
      className={cn(
        "size-8 shrink-0 rounded-sm object-contain select-none",
        className
      )}
    />
  )
}

export default BrandMark
