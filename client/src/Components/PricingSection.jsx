/**
 * Pricing — membership levels.
 *
 * DESIGN.md treatment: three flat cards plus a borderless schedule column on
 * the canvas, one inverted canvas-night featured tier, 1px hairlines and 6px action radii. The gold
 * is reserved for the single filled CTA and the featured card carries the only
 * dark surface. Copy is sentence case — no pill buttons, no uppercase tracking
 * and no second accent colour. Every surface reads the semantic token layer,
 * so the section follows the active light/dark theme automatically.
 */
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { Video } from "lucide-react"

import { Button } from "@/components/ui/button"

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    description: "Flexibility at your fingertips.",
    price: "$1499.99",
    period: "/mo",
    subtext: "Pause or cancel anytime",
    highlighted: false,
    features: [
      "Unlimited requests",
      "Unlimited brands",
      "Unlimited users",
      "Unlimited assets",
      "Pause or cancel anytime",
    ],
  },
  {
    id: "quarterly",
    name: "Quarterly",
    description: "Save 10%",
    price: "$1349.99",
    period: "/mo",
    subtext: "Paid quarterly",
    highlighted: false,
    features: [
      "Unlimited requests",
      "Unlimited brands",
      "Unlimited users",
      "Unlimited assets",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    description: "Save 20%",
    price: "$1199.99",
    period: "/mo",
    subtext: "Paid annually",
    highlighted: true,
    features: [
      "Unlimited requests",
      "Unlimited brands",
      "Unlimited users",
      "Unlimited assets",
    ],
  },
]

const SCHEDULE_CALL = {
  title: "Schedule a call",
  description:
    "Get your answers. Schedule a call and learn more about how this all works and how it helps you.",
}

/**
 * @param {object} props
 * @param {(typeof PLANS)[number]} props.plan - Plan content.
 * @param {number} props.index - Position in the grid, used to stagger motion.
 * @returns {JSX.Element} A single pricing card.
 */
function PlanCard({ plan, index }) {
  const featured = plan.highlighted

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={`flex flex-col rounded-lg border p-8 ${
        featured
          ? "border-on-dark/15 bg-canvas-night text-on-dark shadow-[var(--shadow-level-2)]"
          : "border-hairline bg-surface-1 shadow-[var(--shadow-level-1)]"
      }`}
    >
      <h3 className={`cap-label ${featured ? "text-on-dark" : "text-ink"}`}>
        {plan.name}
      </h3>

      <p
        className={`caption mt-2 min-h-5 ${
          featured ? "text-on-dark/70" : "text-ink-subtle"
        }`}
      >
        {plan.description}
      </p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
        <span className={`display-md ${featured ? "text-on-dark" : "text-ink"}`}>
          {plan.price}
        </span>
        <span
          className={`caption ${featured ? "text-on-dark/60" : "text-ink-subtle"}`}
        >
          {plan.period}
        </span>
      </p>

      <p
        className={`caption mt-1 ${featured ? "text-on-dark/60" : "text-ink-subtle"}`}
      >
        {plan.subtext}
      </p>

      <div className="mt-6 flex flex-col items-stretch gap-1">
        <Button
          variant={featured ? "primary" : "secondary-outline"}
          render={<Link to="/login" />}
          nativeButton={false}
          className="w-full"
        >
          Get started
        </Button>
        <Button
          variant="link"
          render={<Link to="/login" />}
          nativeButton={false}
          className={`justify-start px-0 ${
            featured
              ? "text-on-dark/70 hover:text-on-dark"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Book a call
        </Button>
      </div>

      <div
        className={`mt-7 border-t pt-6 ${
          featured ? "border-on-dark/15" : "border-hairline"
        }`}
      >
        <p className={`eyebrow ${featured ? "text-on-dark" : "text-ink"}`}>
          Includes
        </p>
        <ul className="mt-4 space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className={`flex items-start gap-3 caption ${
                featured ? "text-on-dark/70" : "text-ink-muted"
              }`}
            >
              <span
                className={`mt-2 size-1 shrink-0 rounded-full ${
                  featured ? "bg-on-dark/40" : "bg-ink-tertiary"
                }`}
                aria-hidden="true"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  )
}

/**
 * @param {object} props
 * @param {string} [props.title] - Section heading.
 * @param {string} [props.subtitle] - Supporting line under the heading.
 * @returns {JSX.Element} The pricing section.
 */
export default function PricingSection({
  title = "Membership levels",
  subtitle = "Choose a plan that fits your needs.",
}) {
  return (
    <section id="pricing" className="border-b border-hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-ink-subtle">Pricing</p>
          <h2 className="display-lg mt-5 text-ink">{title}</h2>
          <p className="body-lg mt-5 text-ink-muted">{subtitle}</p>
        </div>

        {/* 4-up → 2-up → 1-up, per DESIGN.md's collapsing strategy. */}
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}

          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="flex flex-col p-8"
          >
            <div className="grid size-12 place-items-center rounded-md border border-hairline bg-surface-1 text-ink-muted">
              <Video className="size-5" aria-hidden="true" />
            </div>

            <h3 className="cap-label mt-6 text-ink">{SCHEDULE_CALL.title}</h3>

            <p className="body-md mt-3 text-ink-muted">
              {SCHEDULE_CALL.description}
            </p>

            <Button
              variant="link"
              render={<Link to="/login" />}
              nativeButton={false}
              className="mt-6 justify-start px-0 text-ink-muted hover:text-ink"
            >
              Book a call
            </Button>
          </motion.article>
        </div>
      </div>
    </section>
  )
}
