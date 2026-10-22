/**
 * Fixed marketing header.
 *
 * Structure follows the Deepcon header pattern: a fixed translucent bar with a
 * blurred backdrop, the emerald wordmark tile on the left, navigation centred in
 * the bar and a single emerald CTA on the right. Below the `md` breakpoint the
 * navigation collapses into an animated sheet.
 *
 * Every colour comes from the semantic token layer, so the header follows the
 * active light/dark theme automatically.
 */
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { Dumbbell, Menu, X } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

const DEFAULT_NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

/**
 * Renders an internal route through the router and everything else as a plain
 * anchor, so hash links keep native browser behaviour.
 *
 * @param {object} props
 * @param {string} props.href - Route path, hash or absolute URL.
 * @param {string} [props.className] - Classes for the anchor.
 * @param {React.ReactNode} props.children - Anchor contents.
 * @returns {JSX.Element} The anchor.
 */
function HeaderLink({ href, className, children, ...props }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  )
}

/**
 * @param {object} props
 * @param {string} [props.logoSrc] - Optional logo image. Falls back to the
 *   Flexity wordmark when omitted.
 * @param {string} [props.logoAlt="Flexity"] - Alt text for the logo image.
 * @param {{label: string, href: string, external?: boolean}[]} [props.navItems]
 *   Anchors rendered in the centre of the bar.
 * @param {string} [props.signInLabel="Get started"] - CTA label.
 * @param {string} [props.signInHref="/login"] - CTA target.
 * @returns {JSX.Element} The marketing header.
 */
export default function FloatingHeader({
  logoSrc,
  logoAlt = "Flexity",
  navItems = DEFAULT_NAV_ITEMS,
  signInLabel = "Get started",
  signInHref = "/login",
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  // Escape closes the sheet.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mobileMenuOpen])

  const navItemClass =
    "rounded-sm px-3 py-2 cap-label no-underline text-ink-muted transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"

  const ctaClass =
    "inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 cap-label text-primary-foreground no-underline transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between px-6 py-3 lg:px-12">
        {/* Wordmark — the emerald tile is the brand's signature accent. */}
        <motion.a
          href="#top"
          aria-label="Flexity home"
          className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {logoSrc ? (
            <img
              alt={logoAlt}
              width={24}
              height={24}
              className="h-6 w-auto"
              src={logoSrc}
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Dumbbell className="size-4" aria-hidden="true" />
            </span>
          )}
          <span className="cap-label leading-none text-ink">Flexity</span>
        </motion.a>

        {/* Navigation — centred in the bar */}
        <motion.nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={navItemClass}
            >
              {item.label}
            </a>
          ))}
        </motion.nav>

        {/* Theme + CTA */}
        <motion.div
          className="hidden items-center gap-2 md:flex"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ThemeToggle />
          <HeaderLink href={signInHref} className={ctaClass}>
            {signInLabel}
          </HeaderLink>
        </motion.div>

        {/* Mobile theme + menu */}
        <motion.div
          className="flex items-center gap-1 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ThemeToggle />
          <motion.button
            type="button"
            className="-mr-2 grid size-11 place-items-center text-ink-muted transition-colors hover:text-ink"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {mobileMenuOpen ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-hairline bg-canvas md:hidden"
          >
            <nav className="flex flex-col gap-2 px-6 py-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className={navItemClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              <HeaderLink
                href={signInHref}
                className={`${ctaClass} mt-2 h-12 w-full`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {signInLabel}
              </HeaderLink>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
