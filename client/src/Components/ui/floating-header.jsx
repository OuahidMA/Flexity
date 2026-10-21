// ============================================================================
// CUSTOMIZATION - edit these values to fit your brand
// ============================================================================

/**
 * Custom brand colors.
 * - Grayscale text uses Tailwind semantic colors (text-ink, text-ink-subtle...)
 * - Only brand-unique colors are defined here
 */
const COLORS = {
  light: {
    background: "rgba(255, 255, 255, 0.8)",
    border: "rgba(0, 0, 0, 0.1)",
    text: "#000000",
    navText: "#374151", // gray-700
    navTextHover: "#000000",
    buttonBg: "#000000",
    buttonText: "#FFFFFF",
    buttonHover: "#1f2937", // gray-800
  },
  dark: {
    background: "rgba(0, 0, 0, 0.8)",
    border: "rgba(255, 255, 255, 0.12)",
    text: "#FFFFFF",
    navText: "rgba(255, 255, 255, 0.72)",
    navTextHover: "#FFFFFF",
    buttonBg: "#ffed00",
    buttonText: "#000000",
    buttonHover: "#e6d200",
  },
}

// ============================================================================
// END CUSTOMIZATION
// ============================================================================

import { motion, AnimatePresence } from "motion/react"
import { useState } from "react"
import { Menu, X, Dumbbell } from "lucide-react"

/**
 * Fixed glass-like marketing header with centered nav links,
 * a primary CTA button and an animated mobile menu.
 *
 * @param {{mode?: "light" | "dark", navItems?: {label: string, href: string, external?: boolean}[], signInLabel?: string, signInHref?: string}} props
 * @returns {JSX.Element}
 */
export default function FloatingHeader({
  mode = "dark",
  navItems = [
    { label: "Home", href: "#top" },
    { label: "Product", href: "#product" },
    { label: "Roles", href: "#roles" },
  ],
  signInLabel = "Get started",
  signInHref = "/login",
}) {
  const colors = COLORS[mode]
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div className="mx-auto flex max-w-[976px] items-center justify-between px-6 py-3">
        {/* Logo */}
        <motion.a
          href="#top"
          className="flex items-center gap-2 py-1 no-underline transition-opacity duration-200 hover:opacity-80"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dumbbell
            className="h-6 w-6"
            style={{ color: colors.text }}
            aria-hidden="true"
          />
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Flexity
          </span>
        </motion.a>

        {/* Navigation - center positioned */}
        <motion.nav
          className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2"
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
              className="px-3 py-1.5 text-sm no-underline transition-colors duration-200"
              style={{ color: colors.navText }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = colors.navTextHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = colors.navText)
              }
            >
              {item.label}
            </a>
          ))}
        </motion.nav>

        {/* Sign In Button - Desktop */}
        <motion.div
          className="hidden md:flex items-center gap-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <a
            href={signInHref}
            className="rounded-xs px-4 py-1.5 text-sm font-bold no-underline transition-colors duration-200"
            style={{
              backgroundColor: colors.buttonBg,
              color: colors.buttonText,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.buttonHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = colors.buttonBg)
            }
          >
            {signInLabel}
          </a>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 transition-colors"
          style={{ color: colors.navText }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = colors.navTextHover)
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navText)}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              backgroundColor: mode === "light" ? "#FFFFFF" : "#000000",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <nav className="flex flex-col px-6 py-4 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="px-3 py-2 text-sm no-underline transition-colors duration-200"
                  style={{ color: colors.navText }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href={signInHref}
                className="mt-2 rounded-xs px-4 py-2 text-sm font-bold text-center no-underline transition-colors duration-200"
                style={{
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {signInLabel}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
