import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ArrowUpRight, Calendar, Dumbbell, ShieldCheck } from "lucide-react"

import Footer from "@/components/Footer"
import FloatingHeader from "@/components/ui/floating-header"
import PatternWavesBackground from "@/components/ui/PatternWavesBackground"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getRoleHome } from "@/lib/roles"

const ROLES = [
  {
    key: "admin",
    title: "Gym administrator",
    path: "/dashboard/gym",
    icon: ShieldCheck,
    description: "Manage members, coaches, subscriptions and one tenant from a single workspace."
  },
  {
    key: "coach",
    title: "Coach",
    path: "/dashboard/coach",
    icon: Dumbbell,
    description: "Browse all clients, select your roster, assign routines and track progress."
  },
  {
    key: "client",
    title: "Client",
    path: "/dashboard/client",
    icon: Calendar,
    description: "View assigned workouts, log sessions and follow progress trends."
  }
]

const ROLE_PREVIEW = {
  admin: {
    metrics: [
      ["Active members", "248", "+12 this month"],
      ["Coaches", "12", "3 on the floor"],
      ["Monthly revenue", "$18.4k", "+8.2% vs last month"]
    ],
    next: [
      ["Renew 3 memberships", "Due today"],
      ["Coach 1:1 review", "2:30 PM"],
      ["Payout review", "Friday"]
    ]
  },
  coach: {
    metrics: [
      ["Roster", "32", "4 new this week"],
      ["Routines", "18", "6 published"],
      ["Sessions this week", "47", "+9 vs last week"]
    ],
    next: [
      ["Lower body block", "Starts 9:00 AM"],
      ["Check-in: Maya R.", "12:15 PM"],
      ["Review week 4 logs", "4:00 PM"]
    ]
  },
  client: {
    metrics: [
      ["This week", "4", "of 5 sessions"],
      ["Current streak", "12 days", "Personal best"],
      ["Progress", "+8.2%", "Last 30 days"]
    ],
    next: [
      ["Upper body strength", "Today, 6:00 PM"],
      ["Mobility flow", "Tomorrow"],
      ["Weekly check-in", "Sunday"]
    ]
  }
}

const STAT_CALLOUTS = [
  { value: "248+", label: "Active members" },
  { value: "47", label: "Sessions this week" },
  { value: "12", label: "Coaches on the floor" }
]

const WEEKLY_LOAD = [38, 52, 44, 70, 58, 86, 64]

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
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <span className="text-sm tracking-[0.2em] uppercase">Loading</span>
      </div>
    )
  }

  const activeRoleData = ROLES.find(item => item.key === activeRole) ?? ROLES[1]
  const preview = ROLE_PREVIEW[activeRole] ?? ROLE_PREVIEW.coach

  return (
    <div id="top" className="flex min-h-screen flex-col bg-canvas text-ink selection:bg-primary selection:text-canvas">
      <FloatingHeader />

      <main className="flex-1 pt-24">
        <section className="relative min-h-[100lvh] w-full overflow-hidden bg-canvas">
          <div className="absolute inset-0">
            <PatternWavesBackground
              preset="silk"
              color="#ffed00"
              backgroundColor="#000000"
              fade="edges"
              interactive={false}
              pattern="dot"
              wave="silk"
              spacing={9}
              markSize={0.95}
              depth={0.95}
              light={0}
              shine={0.8}
              contrast={1.2}
              speed={0.35}
              scale={1}
              direction={20}
              opacity={1}
              fadeSize={0.5}
              characters=".:-=+*#%@"
              intro
              paused={false}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-16 pb-10 lg:px-12 lg:pt-24">
            <h1 className="max-w-4xl text-4xl leading-[0.95] uppercase sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-ink-subtle">A new era of </span>
              <span className="block text-primary">
                coaching
                <br />
                has arrived
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-[1.5] text-ink-muted sm:text-lg">
              Flexity brings programming, coaching and progress tracking together in one platform so you and your clients always know the next move.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                render={<Link to="/login" />}
                nativeButton={false}
                className="h-12 px-6 text-base"
              >
                Start free
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                variant="secondary"
                render={<a href="#product" />}
                nativeButton={false}
                className="h-12 px-6 text-base"
              >
                See product
              </Button>
            </div>
          </div>
        </section>

      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-[80rem] grid-cols-1 px-6 sm:grid-cols-3 lg:px-12">
          {STAT_CALLOUTS.map((stat, index) => (
            <div
              key={stat.label}
              className={`border-hairline py-10 sm:py-12 ${index > 0 ? "border-t sm:border-t-0 sm:border-l sm:pl-8" : ""} ${index < STAT_CALLOUTS.length - 1 ? "sm:pr-8" : ""}`}
            >
              <p className="text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] font-bold text-primary">
                {stat.value}
              </p>
              <p className="mt-3 text-[12px] font-bold tracking-[0.15em] text-ink-subtle uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="border-t border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
          <div className="mx-auto max-w-[44rem] text-center">
            <p className="text-[13px] font-bold tracking-[0.4px] text-primary uppercase">One command center</p>
            <h2 className="mt-4 text-[2rem] leading-[0.95] text-ink lg:text-[2.5rem]">
              Built for the floor and the front desk.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Admins run the business, coaches build the work, clients see the plan. Every role shares one source of truth.
            </p>
          </div>

          <div className="mt-12 rounded-sm border border-hairline bg-surface-1 p-3 lg:p-6">
            <div className="overflow-hidden rounded-xs border border-hairline bg-canvas">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <ShieldCheck className="size-4 text-primary" />
                  Flexity
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-surface-4" />
                  <span className="size-2 rounded-full bg-surface-3" />
                  <span className="size-2 rounded-full bg-hairline-strong" />
                </div>
              </div>

              <div className="grid lg:grid-cols-[14rem_1fr]">
                <aside className="hidden border-r border-hairline bg-surface-1 p-4 lg:block">
                  {["Overview", "Members", "Coaches", "Routines", "Exercises"].map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-center gap-3 rounded-xs px-3 py-2 text-sm ${index === 0 ? "bg-surface-2 text-ink" : "text-ink-subtle"}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {item}
                    </div>
                  ))}
                </aside>

                <div className="p-4 lg:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle">{activeRoleData.title}</p>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">Today at a glance</h3>
                    </div>
                    <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                      Live
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {preview.metrics.map(([label, value, detail]) => (
                      <div key={label} className="rounded-sm border border-hairline bg-surface-1 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle">{label}</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
                        <p className="mt-1 text-xs text-ink-muted">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                    <div className="rounded-sm border border-hairline bg-surface-1 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-ink">Weekly load</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle">Last 7 days</p>
                      </div>
                      <div className="mt-5 flex h-28 items-end gap-2">
                        {WEEKLY_LOAD.map((height, index) => (
                          <div key={index} className="flex h-full flex-1 items-end rounded-sm bg-surface-3/50">
                            <div className="w-full rounded-sm bg-primary" style={{ height: `${height}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-sm border border-hairline bg-surface-1 p-4">
                      <p className="text-sm font-bold text-ink">Up next</p>
                      <div className="mt-4 space-y-3">
                        {preview.next.map(([title, meta]) => (
                          <div key={title} className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-hairline bg-surface-2 text-ink-muted">
                              <ArrowRight className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm text-ink">{title}</p>
                              <p className="text-xs text-ink-subtle">{meta}</p>
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

      <section id="roles" className="border-t border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[72rem] px-6 lg:px-12">
          <div className="max-w-[36rem]">
            <p className="text-[13px] font-bold tracking-[0.4px] text-primary uppercase">Choose your workspace</p>
            <h2 className="mt-4 text-[2rem] leading-[0.95] text-ink lg:text-[2.5rem]">
              Three roles. One operating system.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="overflow-hidden rounded-sm border border-hairline bg-surface-1">
              {ROLES.map(item => {
                const active = activeRole === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveRole(item.key)}
                    className={`flex w-full items-start gap-4 border-b border-hairline px-5 py-5 text-left transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-surface-2" : "bg-transparent hover:bg-surface-2/60"}`}
                  >
                    <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xs border ${active ? "border-primary/30 bg-primary/10 text-primary" : "border-hairline bg-surface-2 text-ink-muted"}`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-[0.04em] ${active ? "text-ink" : "text-ink-muted"}`}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-subtle">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div id="get-started" className="rounded-sm border border-hairline bg-surface-1 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle">Selected workspace</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink">{activeRoleData.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{activeRoleData.description}</p>
              <div className="mt-6 space-y-3">
                <Button
                  className="h-11 w-full justify-between px-6"
                  onClick={() => navigate(activeRoleData.path)}
                >
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="secondary"
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

      <section className="bg-primary px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto flex max-w-[72rem] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[36rem]">
            <p className="text-[12px] font-bold tracking-[0.15em] text-canvas/70 uppercase">
              Get started
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,2.5rem)] leading-[0.95] text-canvas">
              Run your gym without the friction
            </h2>
            <p className="mt-4 text-base leading-relaxed text-canvas/80">
              One workspace for administrators, coaches and clients. Start with
              your team and scale from there.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              render={<Link to="/login" />}
              nativeButton={false}
              className="h-10 rounded-xs bg-canvas px-5 text-ink hover:bg-surface-2"
            >
              Get started
              <ArrowUpRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              render={<a href="#product" />}
              nativeButton={false}
              className="h-10 rounded-xs border-canvas/30 bg-transparent px-5 text-canvas hover:bg-canvas/10 hover:text-canvas"
            >
              See product
            </Button>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}
