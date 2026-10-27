/**
 * Site-wide footer.
 *
 * DESIGN.md's footer spec: a canvas-soft band separated by a single hairline,
 * caption type for the legal row and sentence-case link columns. The oversized
 * wordmark closes the page in both light and dark mode.
 */
import { Link } from "react-router-dom"
import { motion } from "motion/react"

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

/**
 * Renders an internal route as a `Link` and everything else as an anchor.
 *
 * @param {object} props
 * @param {string} props.href - Route or hash target.
 * @param {string} props.className - Anchor classes.
 * @param {React.ReactNode} props.children - Link content.
 * @returns {JSX.Element} The anchor.
 */
function FooterAnchor({ href, className, children }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

/**
 * @param {object} props
 * @param {object} [props.companyInfo]
 * @param {object} [props.servicesColumn]
 * @param {object} [props.pagesColumn]
 * @param {string} [props.copyrightYear]
 * @param {string} [props.copyrightText]
 * @param {Array<{label: string, href: string}>} [props.legalLinks]
 * @param {Array<{label: string, href: string}>} [props.socialLinks]
 * @param {string} [props.largeLogo]
 * @returns {JSX.Element} The site footer.
 */
export default function Footer({
  companyInfo = defaultCompanyInfo,
  servicesColumn = defaultServicesColumn,
  pagesColumn = defaultPagesColumn,
  copyrightYear = "2026",
  copyrightText = "Flexity",
  legalLinks = defaultLegalLinks,
  socialLinks = defaultSocialLinks,
  largeLogo = "Flexity",
}) {
  return (
    <footer className="relative w-full overflow-hidden border-t border-hairline bg-canvas-soft text-ink">
      <div className="mx-auto max-w-[80rem] px-6 pt-16 pb-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="cap-label leading-none text-ink">
              {companyInfo.name}
            </p>
            {companyInfo.address.map((line, index) => (
              <p key={index} className="caption mt-1 text-ink-muted">
                {line}
              </p>
            ))}
            <p className="caption mt-4 text-ink-subtle">{companyInfo.vatNumber}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <p className="eyebrow leading-none text-ink-subtle">
              Platform
            </p>
            <ul className="mt-4 space-y-2">
              {servicesColumn.links.map((link, index) => (
                <li key={index}>
                  <FooterAnchor
                    href={link.href}
                    className="caption leading-none text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
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
            <p className="eyebrow leading-none text-ink-subtle">
              Navigate
            </p>
            <ul className="mt-4 space-y-2">
              {pagesColumn.links.map((link, index) => (
                <li key={index}>
                  <FooterAnchor
                    href={link.href}
                    className="caption leading-none text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {link.label}
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-6 md:flex-row md:items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-center gap-2 caption text-ink-subtle">
            <span>
              &copy; {copyrightText} {copyrightYear}. All rights reserved
            </span>
            {legalLinks.map((link, index) => (
              <span key={index} className="flex items-center gap-2">
                <span aria-hidden="true">&bull;</span>
                <FooterAnchor
                  href={link.href}
                  className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {link.label}
                </FooterAnchor>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 caption text-ink-subtle">
            {socialLinks.map((link, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">&bull;</span>}
                <FooterAnchor
                  href={link.href}
                  className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {link.label}
                </FooterAnchor>
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Oversized wordmark — the closing frame of the page. */}
      <motion.div
        className="relative w-full overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        viewport={{ once: true }}
        aria-hidden="true"
      >
        <div
          className="display-xxl select-none text-center whitespace-nowrap text-ink-tertiary/70"
          style={{ marginBottom: "-0.12em" }}
        >
          {largeLogo}
        </div>
      </motion.div>
    </footer>
  )
}
