/**
 * Pricing — three membership tiers over a subtle particle field.
 *
 * Structure follows the Sonarly pricing layout: a centred header, a
 * monthly/yearly segmented toggle and three plan cards with the middle tier
 * outlined as the recommendation. Everything is expressed with the semantic
 * token layer, so the section follows the active light/dark theme, and the
 * single filled action is the Gold VIP CTA. The particle canvas is clipped to
 * this section and sits behind the cards.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Particles } from "@/components/ui/particles"
import { ShineBorder } from "@/components/ui/shine-border"

/** Gold particles, matching the app's `--primary-deep` accent. */
const PARTICLE_COLOR = "#b3922c"

/** Gold ramp for the animated border on the recommended plan. */
const SHINE_COLORS = [
  "var(--primary)",
  "var(--primary-soft)",
  "var(--primary-deep)",
]

const PRICING_DATA = {
  monthly: {
    solo: { price: "$29", period: "/month" },
    studio: { price: "$79", period: "/month" },
    enterprise: { price: "Custom", period: "" },
  },
  yearly: {
    solo: { price: "$24", period: "/month" },
    studio: { price: "$64", period: "/month" },
    enterprise: { price: "Custom", period: "" },
  },
}

/**
 * @param {(typeof PRICING_DATA)["monthly"]} pricing - Prices for the active
 *   billing period.
 * @returns {Array<object>} The three plan cards.
 */
function buildPlans(pricing) {
  return [
    {
      id: "solo",
      name: "Solo",
      subtitle: "For independent coaches getting started",
      price: pricing.solo.price,
      period: pricing.solo.period,
      cta: "Get started",
      ctaHref: "/login",
      highlighted: false,
      features: [
        "Up to 25 active clients",
        "1 coach seat",
        "Workout library and routines",
        "Client calendar and check-ins",
        "30 days of progress history",
      ],
    },
    {
      id: "studio",
      name: "Studio",
      subtitle: "For growing gyms running a full coaching team",
      price: pricing.studio.price,
      period: pricing.studio.period,
      cta: "Start 14-day free trial",
      ctaHref: "/login",
      highlighted: true,
      features: [
        "Up to 150 active clients",
        "Up to 5 coach seats",
        "Unlimited routines and exercises",
        "Progress analytics and exports",
        "Member billing and renewals",
        "Priority support",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: "For multi-location gym groups",
      price: pricing.enterprise.price,
      period: pricing.enterprise.period,
      cta: "Let's talk",
      ctaHref: "/contact",
      highlighted: false,
      features: [
        "Unlimited clients",
        "Unlimited coach seats",
        "Every location on one account",
        "Guided migration and onboarding",
        "Dedicated account manager",
        "Single sign-on and audit logs",
      ],
    },
  ]
}

const BILLING_PERIODS = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly", badge: "Save 20%" },
]

/**
 * @param {object} props
 * @param {string} [props.title] - Section heading.
 * @param {string} [props.subtitle] - Supporting line under the heading.
 * @returns {JSX.Element} The pricing section.
 */
export default function PricingSection({
  title = "Choose your plan",
  subtitle = "Start small and scale as you grow. Flexity fits a single coach as well as a multi-location gym group.",
}) {
  const [billingPeriod, setBillingPeriod] = useState("monthly")
  const plans = buildPlans(PRICING_DATA[billingPeriod])

  return (
    <section
      id="pricing"
      className="relative isolate overflow-hidden border-b border-hairline bg-canvas py-24 lg:py-32"
    >
      <Particles
        className="absolute inset-0 z-0"
        quantity={120}
        ease={80}
        color={PARTICLE_COLOR}
        refresh
      />

      <div className="relative z-10 mx-auto max-w-[80rem] px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-ink-subtle">Pricing</p>
          <h2 className="display-lg mt-5 text-ink">{title}</h2>
          <p className="body-lg mt-5 text-ink-muted">{subtitle}</p>

          <div
            role="group"
            aria-label="Billing period"
            className="mt-8 inline-flex rounded-sm border border-hairline bg-surface-2 p-1"
          >
            {BILLING_PERIODS.map((period) => {
              const active = billingPeriod === period.id

              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setBillingPeriod(period.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-xs px-5 py-2 cap-label transition-colors ${
                    active
                      ? "bg-surface-1 text-ink shadow-[var(--shadow-level-1)]"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {period.label}
                  {period.badge && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-on-primary">
                      {period.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-lg border border-hairline bg-surface-1 p-8 ${
                plan.highlighted
                  ? "shadow-[var(--shadow-level-2)]"
                  : "shadow-[var(--shadow-level-1)]"
              }`}
            >
              {plan.highlighted && (
                <ShineBorder
                  borderWidth={2}
                  duration={10}
                  shineColor={SHINE_COLORS}
                  aria-hidden="true"
                />
              )}

              <h3 className="display-sm text-ink">{plan.name}</h3>
              <p className="caption mt-2 text-ink-subtle">{plan.subtitle}</p>

              <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
                <span className="display-md text-ink">{plan.price}</span>
                {plan.period && (
                  <span className="caption text-ink-subtle">{plan.period}</span>
                )}
              </p>

              <Button
                variant={plan.highlighted ? "primary" : "secondary-outline"}
                size="lg"
                render={<Link to={plan.ctaHref} />}
                nativeButton={false}
                className="mt-6 w-full"
              >
                {plan.cta}
              </Button>

              <div className="mt-8 flex-1 border-t border-hairline pt-6">
                <p className="eyebrow text-ink-subtle">What&apos;s included</p>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 caption text-ink-muted"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-ink-tertiary"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
