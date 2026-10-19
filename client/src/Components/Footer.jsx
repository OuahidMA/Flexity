/**
 * Marketing footer for public pages.
 *
 * All copy, links, and the call-to-action are prop-driven with sensible defaults,
 * so the same component can be reused for branded landing pages. The newsletter
 * form is intentionally local-only (no API call) and just acknowledges signup.
 */
import { useState } from "react"
import { ArrowUpRight, Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const COLORS = {
  background: "#000000",
  surface: "#202020",
  text: "#FFFFFF",
  textMuted: "#7D7D7D",
  accent: "#FFC000",
  accentHover: "#917300",
  border: "#202020",
}

const defaultColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Workouts", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Community", href: "#" },
      { label: "Support", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
]

const defaultSocialLinks = [
  { label: "X", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "GitHub", href: "#" },
]

const defaultLegalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
]

/**
 * @param {object} props
 * @param {string} [props.brand] - Brand name used in the logo, copyright, CTA,
 *   and oversized watermark.
 * @param {string} [props.description] - Short brand blurb.
 * @param {Array<{ title: string, links: Array<{ label: string, href: string }> }>}
 *   [props.columns] - Link columns.
 * @param {Array<{ label: string, href: string }>} [props.socialLinks]
 * @param {Array<{ label: string, href: string }>} [props.legalLinks]
 * @param {string} [props.ctaHeading] - Closing call-to-action heading.
 * @param {string} [props.ctaButtonText]
 * @param {string} [props.ctaButtonHref]
 * @returns {JSX.Element} Footer with newsletter, navigation, and CTA sections.
 */
export default function Footer({
  brand = "Flexity",
  description = "Build strength, track progress and stay consistent with a training platform designed to move at your pace.",
  columns = defaultColumns,
  socialLinks = defaultSocialLinks,
  legalLinks = defaultLegalLinks,
  ctaHeading = "Ready to get stronger?",
  ctaButtonText = "Start training",
  ctaButtonHref = "#",
}) {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const year = new Date().getFullYear()

  // Local success state only; the form deliberately does not call the API yet.
  function handleSubscribe(event) {
    event.preventDefault()
    if (!email) return
    setSubscribed(true)
    setEmail("")
  }

  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: COLORS.background, color: COLORS.text }}
    >
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <a href="#" className="inline-flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-none"
                style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
              >
                <Dumbbell className="size-5" />
              </span>
              <span className="text-xl font-semibold tracking-tight uppercase">
                {brand}
              </span>
            </a>

            <p
              className="mt-5 max-w-xs text-sm leading-relaxed"
              style={{ color: COLORS.textMuted }}
            >
              {description}
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 max-w-sm">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <div
                className="flex items-stretch border"
                style={{ borderColor: COLORS.border }}
              >
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#7D7D7D]"
                />
                <Button
                  type="submit"
                  className="h-11 rounded-none px-5 text-xs font-semibold tracking-[0.15em] uppercase"
                  style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
                >
                  Join
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
              {subscribed && (
                <p className="mt-2 text-xs" style={{ color: COLORS.accent }}>
                  You&apos;re on the list.
                </p>
              )}
            </form>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8"
          >
            {columns.map((column) => (
              <div key={column.title}>
                <h3
                  className="text-xs font-semibold tracking-[0.2em] uppercase"
                  style={{ color: COLORS.textMuted }}
                >
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm transition-colors hover:text-[#FFC000]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div
          className="mt-14 flex flex-col gap-6 border-t py-8 md:flex-row md:items-center md:justify-between"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              &copy; {year} {brand}. All rights reserved.
            </p>
            <span
              className="hidden h-4 w-px sm:block"
              style={{ backgroundColor: COLORS.surface }}
            />
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:text-[#FFC000]"
                    style={{ color: COLORS.textMuted }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex flex-wrap items-center gap-4">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={cn(
                    "text-xs font-semibold tracking-[0.15em] uppercase transition-colors",
                    "hover:text-[#FFC000]",
                  )}
                  style={{ color: COLORS.textMuted }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t py-10 md:flex-row md:items-center"
          style={{ borderColor: COLORS.border }}
        >
          <p className="text-lg font-medium tracking-tight uppercase">
            {ctaHeading}
          </p>
          <Button
            render={<a href={ctaButtonHref} />}
            nativeButton={false}
            className="h-11 rounded-none px-6 text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
          >
            {ctaButtonText}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </div>

      <div aria-hidden="true" className="select-none overflow-hidden">
        <span
          className="block whitespace-nowrap text-center font-black tracking-tighter text-white/5 uppercase"
          style={{ fontSize: "clamp(64px, 18vw, 280px)", lineHeight: 0.85 }}
        >
          {brand}
        </span>
      </div>
    </footer>
  )
}
