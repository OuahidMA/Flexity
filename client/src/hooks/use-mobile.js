/**
 * Viewport helper for responsive UI (primarily the shadcn sidebar).
 * Matches the `md` breakpoint so JS-driven and CSS-driven layouts stay in sync.
 */
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Track whether the viewport is narrower than the mobile breakpoint.
 * Uses `matchMedia` for efficient change events, with an initial synchronous
 * read so the first render is correct instead of flashing the desktop layout.
 *
 * @returns {boolean} True when `window.innerWidth < 768`.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
