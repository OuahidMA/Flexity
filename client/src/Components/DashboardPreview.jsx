/**
 * Reusable product preview.
 *
 * The same dashboard shell powers the hero and the Features section: browser
 * chrome, an optional sidebar, a role switcher and either the default metric
 * panels or a custom panel supplied by the caller. Every surface is a semantic
 * token, so the mockup follows the active light/dark theme.
 */
import { useState } from "react"
import { ArrowRight, Calendar, Dumbbell, ShieldCheck } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"

const ROLES = [
  { key: "admin", title: "Gym administrator", icon: ShieldCheck },
  { key: "coach", title: "Coach", icon: Dumbbell },
  { key: "client", title: "Client", icon: Calendar },
]

const ROLE_LABELS = {
  admin: "Admin",
  coach: "Coach",
  client: "Client",
}

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

const WEEKLY_LOAD = [38, 52, 44, 70, 58, 86, 64]

const SIDEBAR_PREVIEW = ["Overview", "Members", "Coaches", "Routines", "Exercises"]

/**
 * @param {object} props
 * @param {boolean} [props.sidebar=true] - Show the workspace navigation rail.
 * @param {boolean} [props.roleSwitcher=true] - Show the Admin / Coach / Client switch.
 * @param {React.ReactNode} [props.children] - Replaces the default metric and
 *   chart panels inside the dashboard. Useful for embedding a table.
 * @param {string} [props.className] - Extra classes for the outer frame.
 * @returns {JSX.Element} The dashboard preview.
 */
export default function DashboardPreview({
  sidebar = true,
  roleSwitcher = true,
  children,
  className = "",
}) {
  const [activeRole, setActiveRole] = useState("coach")

  const activeRoleData = ROLES.find((item) => item.key === activeRole) ?? ROLES[1]
  const preview = ROLE_PREVIEW[activeRole] ?? ROLE_PREVIEW.coach

  return (
    <div
      className={`rounded-lg border border-hairline bg-surface-1 p-2 shadow-[var(--shadow-level-2)] lg:p-3 ${className}`}
    >
      <div className="overflow-hidden rounded-md border border-hairline bg-canvas-soft">
        {/* Browser chrome */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface-1 px-4 py-3">
          <div className="flex items-center gap-2.5 cap-label text-ink">
            <BrandMark className="size-6" />
            Flexity
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-surface-4" />
            <span className="size-2 rounded-full bg-surface-3" />
            <span className="size-2 rounded-full bg-hairline-strong" />
          </div>
        </div>

        <div className={sidebar ? "grid lg:grid-cols-[14rem_1fr]" : "grid"}>
          {sidebar && (
            <aside
              className="hidden border-r border-hairline bg-surface-2 p-4 lg:block"
              aria-hidden="true"
            >
              {SIDEBAR_PREVIEW.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-sm px-3 py-2 cap-label ${
                    index === 0 ? "bg-surface-2 text-ink" : "text-ink-subtle"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {item}
                </div>
              ))}
            </aside>
          )}

          <div className="min-w-0 p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-ink-subtle">{activeRoleData.title}</p>
                <h3 className="display-sm mt-2 text-ink">Today at a glance</h3>
              </div>

              {roleSwitcher && (
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
                        {ROLE_LABELS[item.key]}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {children ? (
              <div className="mt-6">{children}</div>
            ) : (
              <>
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
                      <p className="cap-label text-ink">Weekly load</p>
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
                    <p className="cap-label text-ink">Up next</p>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
