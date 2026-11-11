/**
 * Scroll manager for client-side navigation.
 *
 * React Router's `Link` changes the URL without the browser's native hash
 * handling, so hash targets (e.g. `/#pricing` from the contact page) are never
 * scrolled to and a plain route change leaves the visitor at the previous
 * scroll position. This component fixes both cases for every route:
 *
 * - a URL with a hash scrolls the matching element into view, retrying across a
 *   few frames because a page may render its sections after an auth check;
 * - a URL without a hash returns the window to the top.
 *
 * It renders nothing.
 */
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/** Frames to wait for a lazily rendered hash target (roughly three seconds). */
const MAX_ATTEMPTS = 180

/**
 * @returns {null} No DOM output.
 */
export default function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash || hash === "#") {
      window.scrollTo(0, 0)
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    let attempts = 0
    let frame = 0

    const scrollToTarget = () => {
      const target = document.getElementById(id)

      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        })
        return
      }

      if (attempts < MAX_ATTEMPTS) {
        attempts += 1
        frame = window.requestAnimationFrame(scrollToTarget)
      }
    }

    scrollToTarget()

    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return null
}
