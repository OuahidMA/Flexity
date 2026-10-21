/**
 * Tubelight navigation bar.
 *
 * A floating pill of tabs with a glowing, animated "tube" indicator. Hash
 * links scroll within the marketing page; any other URL is handled by React
 * Router so in-app destinations do not trigger a full reload.
 */
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export function NavBar({ items, className }) {
  const [activeTab, setActiveTab] = useState(items[0]?.name)
  const [hidden, setHidden] = useState(false)

  // Duck the bar while the reader scrolls down, bring it back on the way up.
  // The threshold keeps tiny trackpad jitter from flickering it, and the top of
  // the page always shows it again so it never feels lost.
  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY

      if (y <= 48) setHidden(false)
      else if (delta > 6) setHidden(true)
      else if (delta < -6) setHidden(false)

      lastY = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 left-1/2 z-50 mb-6 -translate-x-1/2 transition-transform duration-300 ease-out sm:top-0 sm:bottom-auto sm:pt-6",
        hidden
          ? "pointer-events-none translate-y-[300%] sm:translate-y-[-300%]"
          : "translate-y-0",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/5 px-1 py-1 shadow-lg backdrop-blur-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name
          const isHashLink = item.url.startsWith("#")
          const Component = isHashLink ? "a" : Link
          const linkProps = isHashLink
            ? { href: item.url }
            : { to: item.url }

          return (
            <Component
              key={item.name}
              {...linkProps}
              aria-label={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-primary/5"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary">
                    <div className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute top-0 left-2 h-4 w-4 rounded-full bg-primary/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </Component>
          )
        })}
      </div>
    </div>
  )
}

export default NavBar
