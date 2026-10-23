/**
 * Light / dark theme switch.
 *
 * The palette itself lives entirely in semantic tokens, so this control only
 * flips the `class` on `<html>` through next-themes. Both icons are rendered and
 * cross-faded with the `dark:` variant, which keeps the control correct on the
 * very first paint (no mounted-state flicker) and avoids a hydration mismatch if
 * the app is ever server-rendered.
 */
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { cn } from "cn"

/**
 * @param {object} props
 * @param {string} [props.className] - Extra classes for placement in a header.
 * @param {boolean} [props.showLabel=false] - Render the target mode as text.
 * @returns {JSX.Element} Icon (or labelled) theme toggle button.
 */
export function ThemeToggle({ className, showLabel = false }) {
  const { resolvedTheme, setTheme } = useTheme()

  // Keep the browser chrome (mobile address bar, PWA frame) in step with the
  // in-app canvas instead of pinning it to the initial dark value.
  useEffect(() => {
    if (!resolvedTheme) return

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? "#171717" : "#f9f9f8")
  }, [resolvedTheme])

  /**
   * `resolvedTheme` is only undefined before the provider mounts; a real click
   * only happens after that, but fall back to the dark default defensively.
   */
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Toggle light and dark mode"
      aria-label="Toggle light and dark mode"
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-sm border border-hairline bg-surface-1 text-ink-muted outline-none transition-colors hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        showLabel ? "px-3" : "w-9",
        className
      )}
    >
      <span className="relative grid size-4 place-items-center" aria-hidden="true">
        <Sun className="size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
      </span>
      {showLabel && (
        <>
          <span className="caption hidden text-ink-muted sm:inline dark:hidden">
            Dark
          </span>
          <span className="caption hidden text-ink-muted sm:inline dark:inline">
            Light
          </span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle
