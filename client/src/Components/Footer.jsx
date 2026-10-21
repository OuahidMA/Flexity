import { Link } from "react-router-dom"
import { motion } from "motion/react"

const COLORS = {
  background: "#000000",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.72)",
  accent: "#ffed00",
  buttonBg: "#ffed00",
  buttonText: "#000000",
  buttonAccent: "#ffed00",
  border: "#1f1f1f",
}

const defaultCompanyInfo = {
  name: "Flexity",
  address: [
    "The operating system for modern gyms.",
    "Admins. Coaches. Clients.",
  ],
  vatNumber: "One workspace. Every role.",
}

const defaultServicesColumn = {
  links: [
    { label: "Member management", href: "#product" },
    { label: "Coach workspaces", href: "#roles" },
    { label: "Client progress", href: "#product" },
    { label: "Exercise library", href: "#product" },
    { label: "Routine builder", href: "#product" },
    { label: "Gym analytics", href: "#product" },
  ],
}

const defaultPagesColumn = {
  links: [
    { label: "Home", href: "/" },
    { label: "Product", href: "#product" },
    { label: "Roles", href: "#roles" },
    { label: "Get started", href: "#get-started" },
    { label: "Sign in", href: "/login" },
  ],
}

const defaultLegalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Cookies Policy", href: "#" },
]

const defaultSocialLinks = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "YouTube", href: "#" },
]

function FooterAnchor({ href, className, style, children }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  )
}

export default function Footer({
  companyInfo = defaultCompanyInfo,
  servicesColumn = defaultServicesColumn,
  pagesColumn = defaultPagesColumn,
  ctaHeading = "Run your gym ",
  ctaHighlight = "without the friction",
  ctaHeadingEnd = ".",
  ctaButtonText = "Get started",
  ctaButtonHref = "/login",
  copyrightYear = "2026",
  copyrightText = "Flexity",
  legalLinks = defaultLegalLinks,
  socialLinks = defaultSocialLinks,
  largeLogo = "Flexity",
}) {
  return (
    <footer
      className="relative w-full overflow-hidden border-t border-hairline"
      style={{ backgroundColor: COLORS.background, color: COLORS.text }}
    >
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-bold" style={{ color: COLORS.text }}>
              {companyInfo.name}
            </p>
            {companyInfo.address.map((line, index) => (
              <p key={index} className="text-sm" style={{ color: COLORS.textMuted }}>
                {line}
              </p>
            ))}
            <p className="mt-4 text-sm" style={{ color: COLORS.textMuted }}>
              {companyInfo.vatNumber}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <ul className="space-y-1">
              {servicesColumn.links.map((link, index) => (
                <li key={index}>
                  <FooterAnchor
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: COLORS.text }}
                  >
                    {link.label}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <ul className="space-y-1">
              {pagesColumn.links.map((link, index) => (
                <li key={index}>
                  <FooterAnchor
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: COLORS.text }}
                  >
                    {link.label}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:max-w-xs"
          >
            <p className="text-lg font-bold leading-tight" style={{ color: COLORS.text }}>
              {ctaHeading}
              <span className="relative inline">
                <span className="relative z-10">{ctaHighlight}</span>
                <span
                  className="absolute bottom-0 left-0 h-[3px] w-full"
                  style={{ backgroundColor: COLORS.accent }}
                />
              </span>
              {ctaHeadingEnd}
            </p>
            <FooterAnchor
              href={ctaButtonHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xs border px-5 py-2.5 text-sm font-bold no-underline transition-colors hover:bg-primary hover:text-primary-foreground"
              style={{
                borderColor: COLORS.text,
                color: COLORS.text,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS.buttonAccent }}
              />
              {ctaButtonText}
            </FooterAnchor>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center"
          style={{ borderColor: COLORS.border }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-center gap-1 text-sm" style={{ color: COLORS.textMuted }}>
            <span>&copy; {copyrightText} {copyrightYear}. All rights reserved</span>
            {legalLinks.map((link, index) => (
              <span key={index} className="flex items-center">
                <span className="mx-2">&bull;</span>
                <FooterAnchor
                  href={link.href}
                  className="transition-opacity hover:opacity-60"
                >
                  {link.label}
                </FooterAnchor>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-sm" style={{ color: COLORS.textMuted }}>
            {socialLinks.map((link, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">&bull;</span>}
                <FooterAnchor
                  href={link.href}
                  className="transition-opacity hover:opacity-60"
                >
                  {link.label}
                </FooterAnchor>
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="relative w-full overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        viewport={{ once: true }}
        aria-hidden="true"
      >
        <div
          className="select-none whitespace-nowrap text-center font-bold uppercase leading-none tracking-tighter"
          style={{
            color: COLORS.text,
            fontSize: "clamp(80px, 18vw, 280px)",
            lineHeight: 0.85,
            marginBottom: "-0.1em",
          }}
        >
          {largeLogo}
        </div>
      </motion.div>
    </footer>
  )
}
