/**
 * Marketing landing page.
 *
 * Built to DESIGN.md: structured surface panels separated by 1px hairlines,
 * sentence-case display type and the single emerald accent reserved for actions
 * and highlights. Every surface is a semantic token, so the page reads as a
 * crisp white SaaS site in light mode and a charcoal product surface in dark
 * mode. No gradients, no pill buttons, no uppercase tracking.
 */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarCheck,
  Check,
  CreditCard,
  Dumbbell,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"

import Footer from "@/components/Footer"
import FloatingHeader from "@/components/ui/floating-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getRoleHome } from "@/lib/roles"

const ROLES = [
  {
    key: "admin",
    title: "Gym administrator",
    path: "/dashboard/gym",
    icon: ShieldCheck,
    description:
      "Manage members, coaches, subscriptions and one tenant from a single workspace.",
  },
  {
    key: "coach",
    title: "Coach",
    path: "/dashboard/coach",
    icon: Dumbbell,
    description:
      "Browse all clients, select your roster, assign routines and track progress.",
  },
  {
    key: "client",
    title: "Client",
    path: "/dashboard/client",
    icon: Calendar,
    description:
      "View assigned workouts, log sessions and follow progress trends.",
  },
]

const ROLE_PREVIEW = {
  admin: {
    metrics: [
      ["Active members", "248", "+12 this month"],
      ["Coaches", "12", "3 on the floor"],
      ["Monthly revenue", "$18.4k", "+8.2% vs last month"],
    ],
    next: [
      ["Renew 3 memberships", "Due today"],
      ["Coach 1:1 review", "2:30 PM"],
      ["Payout review", "Friday"],
    ],
  },
  coach: {
    metrics: [
      ["Roster", "32", "4 new this week"],
      ["Routines", "18", "6 published"],
      ["Sessions this week", "47", "+9 vs last week"],
    ],
    next: [
      ["Lower body block", "Starts 9:00 AM"],
      ["Check-in: Maya R.", "12:15 PM"],
      ["Review week 4 logs", "4:00 PM"],
    ],
  },
  client: {
    metrics: [
      ["This week", "4", "of 5 sessions"],
      ["Current streak", "12 days", "Personal best"],
      ["Progress", "+8.2%", "Last 30 days"],
    ],
    next: [
      ["Upper body strength", "Today, 6:00 PM"],
      ["Mobility flow", "Tomorrow"],
      ["Weekly check-in", "Sunday"],
    ],
  },
}

const STAT_CALLOUTS = [
  { value: "248+", label: "Active members" },
  { value: "47", label: "Sessions this week" },
  { value: "12", label: "Coaches on the floor" },
]

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

const PRICING_TIERS = [
  {
    name: "Coach",
    price: "$39",
    cadence: "per coach / month",
    description: "For independent coaches running their own roster.",
    features: [
      "Up to 25 active clients",
      "Routine builder and exercise library",
      "Progress tracking and session logs",
      "Email support",
    ],
    cta: "Start with Coach",
    featured: false,
  },
  {
    name: "Gym",
    price: "$129",
    cadence: "per location / month",
    description: "For gyms with a front desk and a small coaching team.",
    features: [
      "Unlimited members and coaches",
      "Memberships, renewals and payouts",
      "Role-based dashboards for every team",
      "Calendar and check-ins",
      "Priority support",
    ],
    cta: "Start with Gym",
    featured: true,
  },
  {
    name: "Chain",
    price: "Custom",
    cadence: "per organisation",
    description: "For multi-location operators with their own rules.",
    features: [
      "Everything in Gym",
      "Multi-location roll-ups",
      "Single sign-on and audit log",
      "Data export and API access",
      "Named onboarding",
    ],
    cta: "Talk to us",
    featured: false,
  },
]

const FAQS = [
  {
    question: "How long does it take to get running?",
    answer:
      "Most gyms are live the same day. Import your member list, invite your coaches and start publishing routines immediately — there is no migration project to schedule.",
  },
  {
    question: "What do my clients need?",
    answer:
      "A phone or a browser. Clients sign in to a workspace built just for them: their assigned workouts, the calendar and their own progress. No downloads, no training.",
  },
  {
    question: "Can I bring my existing members and routines?",
    answer:
      "Yes. Members import from a CSV in a few clicks, and existing exercises and routines can be added to the shared library or mapped across coaches.",
  },
  {
    question: "How do subscriptions and billing work?",
    answer:
      "Each location manages its own members, plans and renewals from the admin workspace. You see upcoming renewals and payouts in one rail instead of in a spreadsheet.",
  },
  {
    question: "Is my gym's data isolated?",
    answer:
      "Every gym is a separate tenant. Coaches and clients only ever see the members and routines assigned to them, and nothing crosses between locations.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Monthly plans can be cancelled whenever you like and stay active until the end of the period. Annual plans are handled the same way, with no exit fees.",
  },
]

const WEEKLY_LOAD = [38, 52, 44, 70, 58, 86, 64]

const SIDEBAR_PREVIEW = ["Overview", "Members", "Coaches", "Routines", "Exercises"]

export default function Home() {
  const { isAuthenticated, loading, role } = useAuth()
  const navigate = useNavigate()
  const [activeRole, setActiveRole] = useState("coach")

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getRoleHome(role), { replace: true })
    }
  }, [navigate, isAuthenticated, loading, role])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas text-ink-muted">
        <span className="eyebrow">Loading</span>
      </div>
    )
  }

  const activeRoleData = ROLES.find((item) => item.key === activeRole) ?? ROLES[1]
  const preview = ROLE_PREVIEW[activeRole] ?? ROLE_PREVIEW.coach

  return (
    <div id="top" className="flex min-h-svh flex-col bg-canvas text-ink">
      <FloatingHeader />

      <main className="flex-1">
        {/* Hero — dark canvas, structured type and one emerald action. */}
        <section className="relative overflow-hidden border-b border-hairline bg-canvas">
          <div className="mx-auto max-w-[80rem] px-6 pt-32 pb-14 lg:px-12 lg:pt-40 lg:pb-20">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-3 py-1 eyebrow text-ink-muted">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                The gym operating system
              </p>

              <h1 className="display-xxl mt-6 text-ink">
                One workspace for your whole gym.
              </h1>

              <p className="body-lg mt-8 max-w-2xl text-ink-muted">
                Memberships, coaching and client progress in one calm system.
                Every role sees exactly what it needs — nothing more, nothing
                scattered across spreadsheets and group chats.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  render={<Link to="/login" />}
                  nativeButton={false}
                >
                  Start free
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary-outline"
                  size="lg"
                  render={<a href="#features" />}
                  nativeButton={false}
                >
                  Explore the platform
                </Button>
              </div>

              <p className="mt-6 flex items-center gap-2 caption text-ink-subtle">
                <Check className="size-3.5 text-primary" aria-hidden="true" />
                No credit card required · Live the same day
              </p>
            </div>
          </div>

          {/* Product panel — the workspace preview, framed by a single hairline. */}
          <div id="product" className="mx-auto max-w-[80rem] px-6 pb-20 lg:px-12">
            <div className="rounded-lg border border-hairline bg-surface-1 p-2 shadow-[var(--shadow-level-2)] lg:p-3">
              <div className="overflow-hidden rounded-md border border-hairline bg-canvas-soft">
                <div className="flex items-center justify-between border-b border-hairline bg-surface-1 px-4 py-3">
                  <div className="flex items-center gap-2.5 cap-label text-ink">
                    <span className="grid size-6 place-items-center rounded-sm bg-primary text-primary-foreground">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                    </span>
                    Flexity
                  </div>
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="size-2 rounded-full bg-surface-4" />
                    <span className="size-2 rounded-full bg-surface-3" />
                    <span className="size-2 rounded-full bg-hairline-strong" />
                  </div>
                </div>

                <div className="grid lg:grid-cols-[14rem_1fr]">
                  <aside
                    className="hidden border-r border-hairline bg-surface-2 p-4 lg:block"
                    aria-hidden="true"
                  >
                    {SIDEBAR_PREVIEW.map((item, index) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 rounded-sm px-3 py-2 cap-label ${index === 0 ? "bg-surface-2 text-ink" : "text-ink-subtle"}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {item}
                      </div>
                    ))}
                  </aside>

                  <div className="p-4 lg:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="eyebrow text-ink-subtle">
                          {activeRoleData.title}
                        </p>
                        <h3 className="display-sm mt-2 text-ink">
                          Today at a glance
                        </h3>
                      </div>

                      {/* Role switcher — the product preview follows the reader. */}
                      <div
                        className="flex items-center gap-1 rounded-md border border-hairline bg-surface-1 p-1"
                        role="group"
                        aria-label="Preview workspace"
                      >
                        {ROLES.map((item) => {
                          const active = item.key === activeRole
                          const Icon = item.icon

                          return (
                            <button
                              key={item.key}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setActiveRole(item.key)}
                              className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 caption transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                                active
                                  ? "bg-surface-2 text-ink"
                                  : "text-ink-subtle hover:bg-surface-2 hover:text-ink"
                              }`}
                            >
                              <Icon className="size-3.5" aria-hidden="true" />
                              {item.key === "admin"
                                ? "Admin"
                                : item.key === "coach"
                                  ? "Coach"
                                  : "Client"}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {preview.metrics.map(([label, value, detail]) => (
                        <div
                          key={label}
                          className="rounded-md border border-hairline bg-surface-1 p-4"
                        >
                          <p className="eyebrow leading-none text-ink-subtle">
                            {label}
                          </p>
                          <p className="display-sm mt-3 text-ink">{value}</p>
                          <p className="caption mt-1 text-ink-muted">{detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                      <div className="rounded-md border border-hairline bg-surface-1 p-4">
                        <div className="flex items-center justify-between">
                          <p className="cap-label text-ink">
                            Weekly load
                          </p>
                          <p className="eyebrow leading-none text-ink-subtle">
                            Last 7 days
                          </p>
                        </div>
                        <div className="mt-5 flex h-28 items-end gap-2">
                          {WEEKLY_LOAD.map((height, index) => (
                            <div
                              key={index}
                              className="flex h-full flex-1 items-end rounded-sm bg-surface-3"
                            >
                              <div
                                className="w-full rounded-sm bg-primary-soft"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border border-hairline bg-surface-1 p-4">
                        <p className="cap-label text-ink">
                          Up next
                        </p>
                        <div className="mt-4 space-y-3">
                          {preview.next.map(([title, meta]) => (
                            <div key={title} className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-2 text-ink-subtle">
                                <ArrowRight className="size-3.5" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-ink">
                                  {title}
                                </p>
                                <p className="caption text-ink-subtle">{meta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features — structured surface panels on the charcoal canvas. */}
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

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.title}
                    className="rounded-lg border border-hairline bg-surface-1 p-8 shadow-[var(--shadow-level-1)] transition-colors hover:border-hairline-strong"
                  >
                    <div className="grid size-10 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <h3 className="display-sm mt-6 text-ink">{feature.title}</h3>
                    <p className="body-md mt-3 text-ink-muted">
                      {feature.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Numbers — the same metric panels the dashboards use. */}
        <section className="border-b border-hairline py-24 lg:py-32">
          <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
            <div className="grid gap-4 sm:grid-cols-3">
              {STAT_CALLOUTS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-hairline bg-surface-1 p-8 shadow-[var(--shadow-level-1)]"
                >
                  <p className="display-lg text-ink">{stat.value}</p>
                  <p className="eyebrow mt-3 leading-none text-ink-subtle">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles — a switchable list, one item active at a time. */}
        <section id="roles" className="border-b border-hairline py-24 lg:py-32">
          <div className="mx-auto max-w-[72rem] px-6 lg:px-12">
            <div className="max-w-2xl">
              <p className="eyebrow text-ink-subtle">Choose your workspace</p>
              <h2 className="display-lg mt-5 text-ink">
                Three roles. One operating system.
              </h2>
              <p className="body-lg mt-5 text-ink-muted">
                Admins run the business, coaches build the work, clients see the
                plan. Every role shares one source of truth.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1 shadow-[var(--shadow-level-1)]">
                {ROLES.map((item) => {
                  const active = activeRole === item.key
                  const Icon = item.icon

                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveRole(item.key)}
                      className={`relative flex w-full items-start gap-4 border-b border-hairline px-5 py-5 text-left transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                        active ? "bg-surface-2" : "hover:bg-surface-2/60"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-0.5 bg-primary"
                        />
                      ) : null}
                      <div
                        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border ${
                          active
                            ? "border-hairline-strong bg-surface-3 text-ink"
                            : "border-hairline bg-surface-2 text-ink-muted"
                        }`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p
                          className={`cap-label ${active ? "text-ink" : "text-ink-muted"}`}
                        >
                          {item.title}
                        </p>
                        <p className="caption mt-1 text-ink-subtle">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div
                id="get-started"
                className="rounded-lg border border-hairline bg-surface-1 p-6"
              >
                <p className="eyebrow text-ink-subtle">Selected workspace</p>
                <h3 className="display-sm mt-3 text-ink">{activeRoleData.title}</h3>
                <p className="caption mt-3 text-ink-muted">
                  {activeRoleData.description}
                </p>
                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    className="h-11 w-full justify-between px-6"
                    onClick={() => navigate(activeRoleData.path)}
                  >
                    Open dashboard
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="secondary-outline"
                    className="h-11 w-full px-6"
                    onClick={() => navigate("/login")}
                  >
                    Sign in to Flexity
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing — three panels, one inverted featured tier. */}
        <section id="pricing" className="border-b border-hairline py-24 lg:py-32">
          <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
            <div className="max-w-2xl">
              <p className="eyebrow text-ink-subtle">Pricing</p>
              <h2 className="display-lg mt-5 text-ink">
                Pay for the rooms you run.
              </h2>
              <p className="body-lg mt-5 text-ink-muted">
                Every plan includes the full platform. You only change how many
                people and how many locations you bring.
              </p>
            </div>

            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col rounded-lg border p-8 ${
                    tier.featured
                      ? "border-on-dark/15 bg-canvas-night text-on-dark shadow-[var(--shadow-level-2)]"
                      : "border-hairline bg-surface-1 shadow-[var(--shadow-level-1)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className={`cap-label ${
                        tier.featured ? "text-on-dark" : "text-ink"
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {tier.featured && (
                      <span className="rounded-full bg-primary px-3 py-1 eyebrow leading-none text-primary-foreground">
                        Most popular
                      </span>
                    )}
                  </div>

                  <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`display-md ${
                        tier.featured ? "text-on-dark" : "text-ink"
                      }`}
                    >
                      {tier.price}
                    </span>
                    <span
                      className={`caption ${
                        tier.featured ? "text-on-dark/60" : "text-ink-subtle"
                      }`}
                    >
                      {tier.cadence}
                    </span>
                  </p>

                  <p
                    className={`body-md mt-4 ${
                      tier.featured ? "text-on-dark/70" : "text-ink-muted"
                    }`}
                  >
                    {tier.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-3 caption ${
                          tier.featured ? "text-on-dark/70" : "text-ink-muted"
                        }`}
                      >
                        <Check
                          className={`mt-0.5 size-4 shrink-0 ${
                            tier.featured ? "text-primary" : "text-ink"
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-1">
                    <Button
                      variant={tier.featured ? "primary" : "secondary-outline"}
                      render={<Link to="/login" />}
                      nativeButton={false}
                      className="w-full"
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — a hairline-divided accordion. */}
        <section id="faq" className="border-b border-hairline py-24 lg:py-32">
          <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
              <div>
                <p className="eyebrow text-ink-subtle">FAQ</p>
                <h2 className="display-lg mt-5 text-ink">
                  Questions, answered.
                </h2>
                <p className="body-lg mt-5 text-ink-muted">
                  Still unsure? Open a workspace and find out for yourself.
                </p>
              </div>

              <div className="rounded-lg border border-hairline bg-surface-1 px-6 shadow-[var(--shadow-level-1)]">
                {FAQS.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-b border-hairline last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 display-sm text-ink transition-colors hover:text-ink-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                      <span>{faq.question}</span>
                      <Plus
                        className="size-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="body-md max-w-2xl pb-7 text-ink-muted">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing band — a raised panel with the last emerald action. */}
        <section className="border-b border-hairline bg-canvas-soft px-6 py-20 text-ink lg:px-12 lg:py-28">
          <div className="mx-auto flex max-w-[72rem] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-ink-subtle">Get started</p>
              <h2 className="display-lg mt-5 text-ink">
                Run your gym without the friction
              </h2>
              <p className="body-lg mt-5 text-ink-muted">
                One workspace for administrators, coaches and clients. Start with
                your team and scale from there.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              render={<Link to="/login" />}
              nativeButton={false}
              className="self-start"
            >
              Get started
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
