/**
 * Site-wide footer — a wordmark closing band.
 *
 * A transparent band closing the marketing pages, with the brand set as a
 * giant, bottom-cropped wordmark.
 *
 * Top: a copyright label over a hairline, glassy square social buttons and the
 * two-line company line; then link columns with accent labels over hairlines.
 * Bottom: the wordmark, fitted to the full width, one span per letter. Every
 * letter paints a slice of one section-sized ink ramp, so the word reads as a
 * single block.
 *
 * Theming: every colour is a scoped custom property mapped onto the app's
 * dark palette (charcoal canvas, gold accent, champagne wordmark). Colour props
 * still override.
 *
 * Interaction: columns, hairlines and letters rise the first time the footer
 * is seen.
 *
 * No dependencies beyond React and the router: icons are inline SVG and the
 * wordmark is live text in whatever sans the page has.
 */
import * as React from "react"
import { Link } from "react-router-dom"

// #region maths
// Pure: colour, fitting and baseline maths.

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/** "#3d6bff" / "#36f" → "61, 107, 255". Anything unparseable falls back. */
const hexToRgb = (hex, fallback = "212, 175, 55") => {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec((hex || "").trim())
  if (!m) return fallback
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const n = parseInt(h, 16)
  return ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255)
}

/**
 * Font size (px) that makes a word measured at 100px span `target` px. A short
 * word would grow into a tower, so it is capped at `cap` px. Bad input is 0.
 */
const fitSize = (measuredAt100, target, cap) => {
  if (!(measuredAt100 > 0) || !(target > 0)) return 0
  const size = (100 * target) / measuredAt100
  return cap > 0 ? Math.min(size, cap) : size
}

/**
 * Where the baseline sits in a `line-height: 1` box, as a fraction of the font
 * size, from the font's ascent and descent at 100px. The line box is 100px; the
 * content area is centred in it. Missing metrics fall back to a typical 0.8.
 */
const baselineAt = (ascent, descent) => {
  if (!(ascent > 0) || !(descent >= 0)) return 0.8
  return clamp(((100 - ascent - descent) / 2 + ascent) / 100, 0.5, 1.2)
}

/** Visible wordmark height: down to the baseline, plus `cut` em below it. */
const wordHeight = (fontSize, baseline, cut) =>
  Math.max(0, fontSize * (baseline + clamp(Number.isFinite(cut) ? cut : 0, -0.4, 0.4)))

// #endregion

const DEFAULT_SOCIALS = []

const DEFAULT_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Member management", href: "#product" },
      { label: "Coach workspaces", href: "#roles" },
      { label: "Client progress", href: "#product" },
      { label: "Exercise library", href: "#product" },
      { label: "Routine builder", href: "#product" },
      { label: "Gym analytics", href: "#product" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "Product", href: "#product" },
      { label: "Get started", href: "#get-started" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

const DEFAULT_CREDITS = [
  { lead: "The operating system for ", label: "modern gyms." },
  { lead: "Admins. Coaches. Clients." },
]

const DEFAULT_LEGAL = [
  { label: "Privacy Policy", href: "#" },
  { label: "Cookies Policy", href: "#" },
]

const SANS =
  '"Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const ICONS = {
  x: (
    <path
      d="M17.6 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.5-5.9-5.2 5.9H3.2l6.7-7.7L2.8 3.5h5.9l4.1 5.4 4.8-5.4Zm-1 15.3h1.6L7.9 5.1H6.2l10.4 13.7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  ),
  linkedin: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V16M12 16v-5.5M12 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.4V16" />
      <circle cx="8" cy="7.7" r=".55" fill="currentColor" />
    </g>
  ),
  youtube: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="4" />
      <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7Z" />
    </g>
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.1" cy="6.9" r=".6" fill="currentColor" stroke="none" />
    </g>
  ),
  github: (
    <path
      d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  dribbble: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.6 4.2c3.4 4.4 5.4 9.6 6.1 15.6M3.6 10.6c5.6.3 10.4-1 13.9-4.4M5.6 17.6c3.4-4.2 8.6-5.6 14.8-3.6" />
    </g>
  ),
}

/** Baseline of the wordmark's actual font, read off a canvas. */
const measureBaseline = (family, weight, text) => {
  try {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return 0.8
    ctx.font = weight + " 100px " + family
    const m = ctx.measureText(text)
    return baselineAt(m.fontBoundingBoxAscent, m.fontBoundingBoxDescent)
  } catch {
    return 0.8
  }
}

const isIconName = (v) => typeof v === "string" && v in ICONS

// One scoped stylesheet. Every rule sits under .bwf; element resets go through
// :where(.bwf) so they never out-rank the component's own classes or yours.
const CSS =
  // Palette: the app's charcoal + champagne workspace, dark only.
  ".bwf{" +
  "--bwf-bg:var(--canvas);--bwf-bg-rgb:23,23,23;" +
  "--bwf-ink:var(--ink);--bwf-ink-rgb:237,237,237;" +
  "--bwf-muted:var(--ink-muted);" +
  "--bwf-acc:212,175,55;--bwf-accink:#d4af37;--bwf-hover:#ffffff;--bwf-onacc:23,23,23;" +
  "--bwf-wt:#f0e2b4;--bwf-wf:#6f5c22;" +
  "--bwf-sans:" + SANS + ";" +
  "--bwf-ww:500;" +
  "--bwf-top:0px;--bwf-bot:100%;" +
  "position:relative;isolation:isolate;overflow:hidden;container-type:inline-size;background:transparent;color:var(--bwf-ink);font-family:var(--bwf-sans);-webkit-font-smoothing:antialiased;touch-action:pan-y}" +
  ":where(.bwf) a{color:inherit;text-decoration:none}" +
  ":where(.bwf) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ":where(.bwf) ul{list-style:none;margin:0;padding:0}" +
  ":where(.bwf) p{margin:0}" +
  ".bwf svg{max-width:none;display:block}" +
  ".bwf .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  // The top rule: a hairline of accent separating the band from the page.
  ".bwf-rule{position:absolute;left:0;right:0;top:0;height:1px;z-index:3;background:linear-gradient(90deg,rgba(var(--bwf-acc),.15),rgba(var(--bwf-acc),.55),rgba(var(--bwf-acc),.15))}" +
  // Layout.
  ".bwf-inner{position:relative;z-index:2;box-sizing:border-box;max-width:80rem;margin:0 auto;padding:clamp(48px,8.5cqw,104px) clamp(24px,6cqw,48px) 0;display:grid;grid-template-columns:minmax(0,1.62fr) minmax(0,.86fr) minmax(0,.86fr);column-gap:clamp(24px,4cqw,48px);row-gap:44px}" +
  ".bwf-label{font-size:12px;line-height:1;letter-spacing:.01em;color:var(--bwf-accink);padding-bottom:13px;position:relative;display:block}" +
  ".bwf-label::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,rgba(var(--bwf-acc),.55),rgba(var(--bwf-acc),.28));transform-origin:0 50%;transform:scaleX(var(--bwf-line,1));transition:transform 1.1s cubic-bezier(.2,.7,.1,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-label::after{--bwf-line:0}" +
  ".bwf-col{min-width:0}" +
  ".bwf-col:nth-child(1){max-width:420px}" +
  ".bwf-fade{transition:opacity .9s ease var(--bwf-d,0ms),translate .9s cubic-bezier(.2,.7,.1,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-fade{opacity:0;translate:0 14px}" +
  // Socials: glassy squares with a lit top edge.
  ".bwf-socials{display:flex;gap:16px;margin-top:13px}" +
  ".bwf-soc{position:relative;width:31px;height:31px;display:grid;place-items:center;border-radius:5px;color:rgba(var(--bwf-ink-rgb),.62);background:linear-gradient(180deg,rgba(var(--bwf-ink-rgb),.09),rgba(var(--bwf-ink-rgb),.025));box-shadow:inset 0 0 0 1px rgba(var(--bwf-ink-rgb),.16),inset 0 1px 0 rgba(var(--bwf-ink-rgb),.14),0 6px 14px -8px rgba(0,0,0,.8);transition:color .25s,box-shadow .35s,translate .35s cubic-bezier(.2,.8,.2,1),background .35s}" +
  ".bwf-soc svg{width:17px;height:17px}" +
  ".bwf-soc:hover,.bwf-soc:focus-visible{color:var(--bwf-hover);translate:0 -2px;background:linear-gradient(180deg,rgba(var(--bwf-acc),.32),rgba(var(--bwf-acc),.08));box-shadow:inset 0 0 0 1px rgba(var(--bwf-acc),.75),inset 0 1px 0 rgba(var(--bwf-ink-rgb),.3),0 10px 26px -8px rgba(var(--bwf-acc),.75)}" +
  ".bwf-soc:focus-visible{outline:none}" +
  ".bwf-tip{position:absolute;z-index:5;left:50%;top:calc(100% + 9px);translate:-50% -4px;white-space:nowrap;font-size:11px;line-height:1;padding:6px 8px;border-radius:4px;background:rgba(var(--bwf-acc),.95);color:rgb(var(--bwf-onacc));opacity:0;pointer-events:none;transition:opacity .2s,translate .25s}" +
  ".bwf-tip::after{content:'';position:absolute;left:50%;bottom:100%;margin-left:-4px;border:4px solid transparent;border-bottom-color:rgba(var(--bwf-acc),.95)}" +
  ".bwf-soc:hover .bwf-tip,.bwf-soc:focus-visible .bwf-tip{opacity:1;translate:-50% 0}" +
  // Credits.
  ".bwf-credits{margin-top:21px;font-size:14px;line-height:1.5;color:var(--bwf-muted)}" +
  ".bwf-credits p+p{margin-top:2px}" +
  ".bwf-credits b{font-weight:400;color:var(--bwf-ink)}" +
  ".bwf-credits a{color:var(--bwf-ink);background:linear-gradient(rgb(var(--bwf-acc)),rgb(var(--bwf-acc))) 0 100%/0 1px no-repeat;transition:background-size .35s cubic-bezier(.2,.8,.2,1),color .25s}" +
  ".bwf-credits a:hover,.bwf-credits a:focus-visible{background-size:100% 1px;color:var(--bwf-hover);outline:none}" +
  ".bwf-credits .bwf-legal{display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;margin-top:14px;font-size:13px}" +
  ".bwf-legal .bwf-dot{color:var(--bwf-muted);opacity:.7}" +
  // Link columns.
  ".bwf-links{margin-top:13px;display:flex;flex-direction:column;gap:0}" +
  ".bwf-link{position:relative;display:inline-flex;align-items:center;gap:8px;padding:6px 0;font-size:14.5px;line-height:21px;color:rgba(var(--bwf-ink-rgb),.78);transition:color .25s}" +
  ".bwf-link-t{display:inline-block;transition:translate .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link::before{content:'';position:absolute;left:0;top:50%;width:6px;height:1px;margin-top:0;background:rgb(var(--bwf-acc));transform:scaleX(0);transform-origin:0 50%;transition:transform .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link svg{width:12px;height:12px;opacity:0;translate:-6px 0;color:var(--bwf-accink);transition:opacity .25s,translate .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link:hover,.bwf-link:focus-visible{color:var(--bwf-hover);outline:none}" +
  ".bwf-link:hover::before,.bwf-link:focus-visible::before{transform:scaleX(1)}" +
  ".bwf-link:hover .bwf-link-t,.bwf-link:focus-visible .bwf-link-t{translate:12px 0}" +
  ".bwf-link:hover svg,.bwf-link:focus-visible svg{opacity:1;translate:10px 0}" +
  ".bwf-link:focus-visible .bwf-link-t{text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(var(--bwf-acc),.8)}" +
  // The wordmark. Each letter paints the section-sized background, shifted
  // back by its own offset, so the ramp lines up with the rest of the word.
  ".bwf-word{position:relative;z-index:1;overflow:hidden;margin-top:clamp(28px,7cqw,96px)}" +
  // Compact: same composition with a tighter vertical rhythm.
  ".bwf-compact .bwf-inner{padding-top:clamp(32px,5.5cqw,64px);row-gap:32px}" +
  ".bwf-compact .bwf-word{margin-top:clamp(16px,4cqw,56px)}" +
  ".bwf-compact .bwf-credits{margin-top:16px}" +
  ".bwf-word-box{padding:0 clamp(24px,6cqw,48px);max-width:80rem;margin:0 auto;box-sizing:border-box}" +
  ".bwf-word-in{display:inline-flex;white-space:nowrap;font-weight:var(--bwf-ww);line-height:1;letter-spacing:-.045em;user-select:none;-webkit-user-select:none}" +
  ".bwf-lw{display:inline-block;translate:0 0;transition:translate 1.25s cubic-bezier(.16,.84,.2,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-lw{translate:0 85%}" +
  ".bwf-l{display:inline-block;color:transparent;-webkit-background-clip:text;background-clip:text;background-repeat:no-repeat;background-size:var(--bwf-rw) var(--bwf-rh);background-position:calc(var(--bwf-x) * -1) calc(var(--bwf-y) * -1);" +
  "background-image:linear-gradient(180deg,var(--bwf-wt) var(--bwf-top),var(--bwf-wf) var(--bwf-bot))}" +
  // The foot sinks into the canvas.
  ".bwf-foot{position:absolute;left:0;right:0;bottom:0;height:34%;z-index:2;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(var(--bwf-bg-rgb),.55) 55%,var(--bwf-bg))}" +
  "@container (max-width: 760px){.bwf-inner{grid-template-columns:minmax(0,1fr) minmax(0,1fr);row-gap:40px}.bwf-col:nth-child(1){grid-column:1 / -1;max-width:none}}" +
  "@media (prefers-reduced-motion: reduce){.bwf .bwf-lw,.bwf .bwf-fade,.bwf .bwf-label::after,.bwf .bwf-soc,.bwf .bwf-link-t,.bwf .bwf-link svg{transition:none!important;animation:none!important}.bwf[data-in='false'] .bwf-lw,.bwf[data-in='false'] .bwf-fade{translate:none;opacity:1}.bwf[data-in='false'] .bwf-label::after{--bwf-line:1}}"

const Arrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 9.5l7-7M4 2.5h5.5V8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * One footer link. Internal routes go through the router, section hashes are
 * routed home first (so they work from `/contact` too), and everything else is
 * a plain anchor.
 *
 * @param {object} props
 * @param {string} [props.href] - Route, hash target or external URL.
 * @param {string} props.label - Accessible name reported to `onLinkClick`.
 * @param {(label: string, href?: string) => void} [props.onLinkClick]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element} The link.
 */
function FooterLink({ href = "#", label, onLinkClick, className, children, ...rest }) {
  /** `#` and missing hrefs never touch the host page's URL hash. */
  const handleClick = (event) => {
    if (!href || href === "#") event.preventDefault()
    onLinkClick?.(label, href)
  }

  if (href.startsWith("#") && href.length > 1) {
    return (
      <Link to={`/${href}`} className={className} onClick={handleClick} {...rest}>
        {children}
      </Link>
    )
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link to={href} className={className} onClick={handleClick} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      {...(/^https?:/.test(href) ? { target: "_blank", rel: "noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

/**
 * @param {object} props
 * @param {string} [props.brand] - Copyright holder and default wordmark.
 * @param {string} [props.wordmark] - What the giant wordmark spells.
 * @param {string} [props.company] - Label in the copyright row.
 * @param {number} [props.year]
 * @param {Array<{label: string, href?: string, icon: string | React.ReactNode}>} [props.socials]
 * @param {Array<{lead?: string, label?: string, href?: string, tail?: string}>} [props.credits]
 * @param {Array<{title: string, links: Array<{label: string, href?: string}>}>} [props.columns]
 * @param {Array<{label: string, href?: string}>} [props.legalLinks]
 * @param {(label: string, href?: string) => void} [props.onLinkClick]
 * @param {number} [props.cut] - Where the bottom edge cuts the wordmark, in em below its baseline.
 * @param {string} [props.background] - Overrides the themed canvas.
 * @param {string} [props.ink]
 * @param {string} [props.muted]
 * @param {string} [props.accent] - Beam, hairlines and lit edge.
 * @param {string} [props.wordTop] - Wordmark fill at its top.
 * @param {string} [props.wordFoot] - Wordmark fill at its foot.
 * @param {string} [props.fontSans]
 * @param {number} [props.wordWeight]
 * @param {boolean} [props.compact=false] - Tighter vertical rhythm for pages that do not want a full closing band.
 * @param {string} [props.className]
 * @returns {JSX.Element} The site footer.
 */
export default function Footer({
  brand = "Flexity",
  wordmark,
  company,
  year = new Date().getFullYear(),
  socials = DEFAULT_SOCIALS,
  credits = DEFAULT_CREDITS,
  columns = DEFAULT_COLUMNS,
  legalLinks = DEFAULT_LEGAL,
  onLinkClick,
  cut = 0.14,
  background,
  ink,
  muted,
  accent,
  wordTop,
  wordFoot,
  fontSans = SANS,
  wordWeight = 500,
  compact = false,
  className = "",
}) {
  const word = (wordmark ?? brand).trim() || brand
  const letters = React.useMemo(() => Array.from(word), [word])

  const rootRef = React.useRef(null)
  const wordRef = React.useRef(null)
  const innerRef = React.useRef(null)
  const [size, setSize] = React.useState(0)
  const [base, setBase] = React.useState(0.8)
  const [seen, setSeen] = React.useState(false)

  // Fit the wordmark to the column width, then tell every letter where it sits
  // inside the section so its slice of the ink ramp lines up with the rest of
  // the word.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const box = wordRef.current
    const inner = innerRef.current
    if (!root || !box || !inner) return
    let frame = 0
    const fit = () => {
      const wb = inner.parentElement ?? box
      const pad = parseFloat(getComputedStyle(wb).paddingLeft) || 0
      const target = wb.clientWidth - pad * 2
      inner.style.fontSize = "100px"
      const measured = inner.offsetWidth
      setBase(measureBaseline(getComputedStyle(inner).fontFamily, wordWeight, word))
      const next = fitSize(measured, target, target * 0.42)
      inner.style.fontSize = next + "px"
      setSize(next)
      place()
    }
    const place = () => {
      const r = root.getBoundingClientRect()
      root.style.setProperty("--bwf-rw", r.width + "px")
      root.style.setProperty("--bwf-rh", r.height + "px")
      const spans = inner.querySelectorAll(".bwf-l")
      let top = 0
      spans.forEach((s, i) => {
        // offsetLeft/Top chains ignore the reveal translate, so the ramp is
        // already aligned while the letters are still rising.
        let x = 0
        let y = 0
        let el = s
        while (el && el !== root) {
          x += el.offsetLeft
          y += el.offsetTop
          el = el.offsetParent
        }
        s.style.setProperty("--bwf-x", x + "px")
        s.style.setProperty("--bwf-y", y + "px")
        if (i === 0) top = y
      })
      root.style.setProperty("--bwf-top", top + "px")
      root.style.setProperty("--bwf-bot", top + (parseFloat(inner.style.fontSize) || 0) * 0.92 + "px")
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    }
    fit()
    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    let alive = true
    document.fonts?.ready.then(() => alive && schedule())
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [word, fontSans, wordWeight])

  // Reveal once, the first time the footer is on screen.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.12 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])

  // Colour overrides only touch the variables they name, so the themed
  // defaults keep working for everything else.
  const vars = {
    "--bwf-sans": fontSans,
    "--bwf-ww": String(wordWeight),
    ...(background
      ? { "--bwf-bg": background, "--bwf-bg-rgb": hexToRgb(background, "242, 242, 239") }
      : null),
    ...(ink ? { "--bwf-ink": ink, "--bwf-ink-rgb": hexToRgb(ink, "23, 23, 23") } : null),
    ...(muted ? { "--bwf-muted": muted } : null),
    ...(accent ? { "--bwf-acc": hexToRgb(accent) } : null),
    ...(wordTop ? { "--bwf-wt": wordTop } : null),
    ...(wordFoot ? { "--bwf-wf": wordFoot } : null),
  }

  const label = company ?? brand
  // Staggered reveal, in document order. Delays are derived from each item's
  // position, so rendering stays a pure pass over the tree.
  const delay = (index) => ({ "--bwf-d": index * 70 + "ms" })
  const columnDelay = (ci) =>
    2 + socials.length + credits.length + legalLinks.length + ci * 10

  return (
    <footer
      ref={rootRef}
      className={"bwf " + (compact ? "bwf-compact " : "") + className}
      style={vars}
      data-in={seen || reduced ? "true" : "false"}
    >
      <style>{CSS}</style>
      <div className="bwf-rule" aria-hidden="true" />

      <div className="bwf-inner">
        <div className="bwf-col">
          <p className="bwf-label" style={delay(0)}>
            © {year} {label}
          </p>
          {socials.length > 0 && (
            <ul className="bwf-socials">
              {socials.map((s, i) => (
                <li key={s.label + i} className="bwf-fade" style={delay(1 + i)}>
                  <FooterLink
                    className="bwf-soc"
                    href={s.href}
                    label={s.label}
                    onLinkClick={onLinkClick}
                    aria-label={s.label}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {isIconName(s.icon) ? ICONS[s.icon] : s.icon}
                    </svg>
                    <span className="bwf-tip" aria-hidden="true">
                      {s.label}
                    </span>
                  </FooterLink>
                </li>
              ))}
            </ul>
          )}
          {credits.length > 0 && (
            <div className="bwf-credits">
              {credits.map((c, i) => (
                <p key={i} className="bwf-fade" style={delay(1 + socials.length + i)}>
                  {c.lead}
                  {c.label ? (
                    c.href ? (
                      <FooterLink href={c.href} label={c.label} onLinkClick={onLinkClick}>
                        {c.label}
                      </FooterLink>
                    ) : (
                      <b>{c.label}</b>
                    )
                  ) : null}
                  {c.tail}
                </p>
              ))}
              {legalLinks.length > 0 && (
                <p className="bwf-legal bwf-fade" style={delay(2 + socials.length + credits.length)}>
                  {legalLinks.map((l, i) => (
                    <React.Fragment key={l.label + i}>
                      {i > 0 && (
                        <span className="bwf-dot" aria-hidden="true">
                          &bull;
                        </span>
                      )}
                      <FooterLink href={l.href} label={l.label} onLinkClick={onLinkClick}>
                        {l.label}
                      </FooterLink>
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>

        {columns.map((col, ci) => (
          <nav key={col.title + ci} className="bwf-col" aria-label={col.title}>
            <p className="bwf-label" style={delay(columnDelay(ci))}>
              {col.title}
            </p>
            <ul className="bwf-links">
              {col.links.map((l, li) => (
                <li key={l.label + li} className="bwf-fade" style={delay(columnDelay(ci) + 1 + li)}>
                  <FooterLink
                    className="bwf-link"
                    href={l.href}
                    label={l.label}
                    onLinkClick={onLinkClick}
                  >
                    <span className="bwf-link-t">{l.label}</span>
                    <Arrow />
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div
        ref={wordRef}
        className="bwf-word"
        style={{ height: size ? wordHeight(size, base, cut) : "calc(" + (0.8 + cut) * 26 + "cqw)" }}
      >
        <p className="sr-only">{word}</p>
        <div className="bwf-word-box">
          <div ref={innerRef} className="bwf-word-in" aria-hidden="true">
            {letters.map((ch, i) => (
              <span key={i} className="bwf-lw" style={{ "--bwf-d": 260 + i * 75 + "ms" }}>
                <span className="bwf-l">
                  {ch === " " ? "\u00a0" : ch}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="bwf-foot" aria-hidden="true" />
      </div>
    </footer>
  )
}
