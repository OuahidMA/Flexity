/**
 * Gym administrator overview.
 *
 * One `/gym/overview` request supplies all data on the page: aggregate stats,
 * the newest client accounts, and a short coach roster. The page only reads this
 * payload; navigation links lead to the full member/coach management screens.
 */
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Users,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useApiData } from "@/hooks/useApiData"
import { formatPin } from "@/lib/pins"
import { ErrorState, LoadingState } from "@/components/dashboard/data-state"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * @param {string|null|undefined} value - ISO timestamp.
 * @returns {string} Localized short date, or an em dash when missing.
 */
function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * @returns {JSX.Element} Aggregate stats, recent members, coach roster, branding.
 */
export default function GymDashboard() {
  const { gymBranding } = useAuth()
  const { data, loading, error, refresh } = useApiData("/gym/overview")

  if (loading) return <LoadingState label="Loading gym overview..." />
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={refresh}
      />
    )
  }

  // Defensive defaults keep the dashboard renderable if the overview payload is
  // partial (for example, a brand-new gym with no members/coaches yet).
  const stats = data?.stats ?? {
    members: 0,
    coaches: 0,
    activeMembers: 0,
    routines: 0,
  }
  const recentMembers = data?.recentMembers ?? []
  const coaches = data?.coaches ?? []
  const gymName = data?.gym?.name ?? "Your gym"
  const pendingMembers = Math.max(stats.members - stats.activeMembers, 0)
  const activeShare = stats.members
    ? Math.round((stats.activeMembers / stats.members) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={gymName}
        title="Gym overview"
        description={`Managing ${stats.members} clients and ${stats.coaches} coaches.`}
        actions={
          <Button
            className="gap-2"
            nativeButton={false}
            render={<Link to="/dashboard/gym/members" />}
          >
            <Users className="size-4" />
            Manage members
          </Button>
        }
      />

      {/* Tenant-level KPIs. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active members"
          value={stats.activeMembers}
          hint={`of ${stats.members} total`}
          icon={Users}
        />
        <StatCard
          label="Coaches"
          value={stats.coaches}
          hint="on the roster"
          icon={Dumbbell}
        />
        <StatCard
          label="Total members"
          value={stats.members}
          hint="registered clients"
          icon={CalendarDays}
        />
        <StatCard
          label="Routines"
          value={stats.routines}
          hint="built by your coaches"
          icon={ClipboardList}
        />
      </div>

      {/* Management surface: direct routes to the two operational rosters and
          a live read on how much of the membership is fully onboarded. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          to="/dashboard/gym/members"
          className="group rounded-lg border border-hairline bg-surface-1 p-5 shadow-[var(--shadow-level-1)] transition-colors hover:border-hairline-strong"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-muted">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <ArrowUpRight
              className="size-4 text-ink-tertiary transition-colors group-hover:text-ink"
              aria-hidden="true"
            />
          </div>
          <h3 className="cap-label mt-5 text-ink">Members</h3>
          <p className="caption mt-1.5 text-ink-subtle">
            Onboard clients, issue setup PINs and keep every plan current.
          </p>
        </Link>

        <Link
          to="/dashboard/gym/coaches"
          className="group rounded-lg border border-hairline bg-surface-1 p-5 shadow-[var(--shadow-level-1)] transition-colors hover:border-hairline-strong"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-hairline bg-surface-2 text-ink-muted">
              <Dumbbell className="size-4" aria-hidden="true" />
            </span>
            <ArrowUpRight
              className="size-4 text-ink-tertiary transition-colors group-hover:text-ink"
              aria-hidden="true"
            />
          </div>
          <h3 className="cap-label mt-5 text-ink">Coaches</h3>
          <p className="caption mt-1.5 text-ink-subtle">
            Invite coaches, review specialities and balance client rosters.
          </p>
        </Link>

        <div className="rounded-lg border border-hairline bg-surface-1 p-5 shadow-[var(--shadow-level-1)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cap-label text-ink">Member mix</h3>
            <Badge variant="secondary">{activeShare}% active</Badge>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-4">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${activeShare}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="eyebrow text-ink-subtle">Active</dt>
              <dd className="display-sm mt-1 text-ink">
                {stats.activeMembers}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-subtle">Onboarding</dt>
              <dd className="display-sm mt-1 text-ink">{pendingMembers}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent activity and tenant context. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <div>
              <h3 className="display-sm text-ink">Newest members</h3>
              <p className="caption mt-1 text-ink-subtle">
                Latest client accounts across your gym
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to="/dashboard/gym/members" />}
            >
              View all
            </Button>
          </div>

          {recentMembers.length === 0 ? (
            <div className="px-6 py-12 text-center caption text-ink-subtle">
              No clients yet.{" "}
              <Link
                to="/dashboard/gym/members"
                className="cap-label text-ink transition-colors hover:text-ink-muted"
              >
                Add your first member
              </Link>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 px-5">Member</TableHead>
                  <TableHead className="h-12 px-5">Setup PIN</TableHead>
                  <TableHead className="h-12 px-5">Coach</TableHead>
                  <TableHead className="h-12 px-5">Status</TableHead>
                  <TableHead className="h-12 px-5 text-right">
                    Joined
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-5 py-4">
                      <p className="text-[13px] font-medium text-ink">
                        {member.name || "—"}
                      </p>
                      <p className="mt-0.5 caption text-ink-subtle">
                        {member.email || "Awaiting setup"}
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {member.setupRequired ? (
                        <span className="text-[13px] font-medium tracking-[0.16em] text-ink tabular-nums">
                          {formatPin(member.pin)}
                        </span>
                      ) : (
                        <span className="caption text-ink-subtle">Activated</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-ink-subtle">
                      {member.coachName || "Unassigned"}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <StatusBadge
                        status={
                          member.setupRequired
                            ? "Pending"
                            : member.active
                              ? "Active"
                              : "Inactive"
                        }
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right text-ink-subtle">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="space-y-4">
          {/* Compact roster preview; the full list lives on the coaches page. */}
          <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="display-sm text-ink">Coach roster</h3>
              <CalendarDays className="size-4 text-ink-subtle" aria-hidden="true" />
            </div>

            {coaches.length === 0 ? (
              <p className="px-5 py-6 caption text-ink-subtle">
                No coaches yet. Invite one from the coaches page.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 px-5">Coach</TableHead>
                    <TableHead className="h-10 px-5 text-right">Clients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.slice(0, 5).map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell className="px-5 py-3">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {coach.name || coach.email}
                        </p>
                        <p className="truncate caption text-ink-subtle">
                          {coach.speciality || "Coach"}
                        </p>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Badge variant="secondary">{coach.clients}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="border-t border-hairline p-3">
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<Link to="/dashboard/gym/coaches" />}
              >
                Manage coaches
              </Button>
            </div>
          </div>

          {/* Active tenant theme tokens hydrated by AuthContext. */}
          <div className="rounded-lg border border-hairline bg-surface-1 p-5">
            <h3 className="display-sm text-ink">Gym branding</h3>
            <div className="mt-4 flex gap-2">
              {[
                gymBranding.primaryColor,
                gymBranding.secondaryColor,
                gymBranding.accentColor,
              ].map((color) => (
                <div key={color} className="flex-1">
                  <div
                    className="h-10 border border-hairline"
                    style={{ backgroundColor: color }}
                  />
                  <p className="eyebrow mt-1.5 leading-none text-ink-subtle tabular-nums">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
