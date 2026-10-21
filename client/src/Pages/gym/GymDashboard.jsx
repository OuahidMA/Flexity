/**
 * Gym administrator overview.
 *
 * One `/gym/overview` request supplies all data on the page: aggregate stats,
 * the newest client accounts, and a short coach roster. The page only reads this
 * payload; navigation links lead to the full member/coach management screens.
 */
import { Link } from "react-router-dom"
import { CalendarDays, ClipboardList, Dumbbell, Users } from "lucide-react"

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

      {/* Recent activity and tenant context. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="text-sm font-bold">Newest members</h3>
              <p className="mt-1 text-xs text-muted-foreground">
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
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No clients yet.{" "}
              <Link
                to="/dashboard/gym/members"
                className="font-bold text-primary hover:text-primary-hover"
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
                      <p className="font-bold">{member.name || "—"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {member.email || "Awaiting setup"}
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {member.setupRequired ? (
                        <span className="font-mono text-xs font-bold tracking-[0.16em]">
                          {formatPin(member.pin)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Activated
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
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
                    <TableCell className="px-5 py-4 text-right text-muted-foreground">
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
          <div className="border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Coach roster</h3>
              <CalendarDays className="size-4 text-muted-foreground" />
            </div>

            {coaches.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No coaches yet. Invite one from the coaches page.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {coaches.slice(0, 5).map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {coach.name || coach.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {coach.speciality || "Coach"}
                      </p>
                    </div>
                    <Badge variant="secondary">{coach.clients} clients</Badge>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="mt-4 w-full"
              nativeButton={false}
              render={<Link to="/dashboard/gym/coaches" />}
            >
              Manage coaches
            </Button>
          </div>

          {/* Active tenant theme tokens hydrated by AuthContext. */}
          <div className="border bg-card p-5">
            <h3 className="text-sm font-bold">Gym branding</h3>
            <div className="mt-4 flex gap-2">
              {[
                gymBranding.primaryColor,
                gymBranding.secondaryColor,
                gymBranding.accentColor,
              ].map((color) => (
                <div key={color} className="flex-1">
                  <div
                    className="h-10 border"
                    style={{ backgroundColor: color }}
                  />
                  <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
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
