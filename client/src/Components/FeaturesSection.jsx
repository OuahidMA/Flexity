/**
 * Features — product screen first, capability cards below.
 *
 * The top of the section is the app screen. Underneath, the six capabilities
 * sit in a compact card grid, so the section reads as one continuous product
 * story. Every surface is a semantic token and follows the active light/dark
 * theme.
 */
import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"

import DashboardPreview from "@/components/DashboardPreview"

const FEATURES = [
  {
    title: "Member management",
    description:
      "Every member, plan and renewal in one roster. Search, edit and check someone in without leaving the page.",
    icon: Users,
  },
  {
    title: "Programming",
    description:
      "Build routines from a shared exercise library, then publish them to a coach's clients in a couple of clicks.",
    icon: Dumbbell,
  },
  {
    title: "Session scheduling",
    description:
      "One calendar for one-to-one sessions, classes and check-ins. Clients always see the next move.",
    icon: CalendarCheck,
  },
  {
    title: "Progress tracking",
    description:
      "Every logged set, rep and weight flows into a trend line you can read at a glance.",
    icon: TrendingUp,
  },
  {
    title: "Role-based access",
    description:
      "Administrators, coaches and clients each get their own workspace, with nothing they should not see.",
    icon: ShieldCheck,
  },
  {
    title: "Billing and plans",
    description:
      "Subscriptions, renewals and payouts sit beside the roster, so month end is a lookup rather than a rebuild.",
    icon: CreditCard,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="border-b border-hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-ink-subtle">What you get</p>
          <h2 className="display-lg mt-5 text-ink">
            Everything a gym needs, in one place.
          </h2>
          <p className="body-lg mt-5 text-ink-muted">
            Six pieces that cover the front desk, the coaching floor and the
            training floor — no spreadsheets, no scattered group chats.
          </p>
        </div>

        {/* App screen — the product surface, also the `#product` anchor. */}
        <div id="product" className="mt-12">
          <DashboardPreview />
        </div>

        {/* Capability cards — compact panels beneath the app screen. */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="rounded-lg border border-hairline bg-surface-1 p-6 shadow-[var(--shadow-level-1)] transition-colors hover:border-hairline-strong"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-muted">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <h3 className="cap-label text-ink">{feature.title}</h3>
                </div>
                <p className="caption mt-3 text-ink-muted">
                  {feature.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
