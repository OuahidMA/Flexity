/**
 * Role-aware dashboard navigation.
 *
 * Navigation is rendered with the animated sidebar primitives. Every role sees
 * only the destinations its route guards allow, and the footer exposes the
 * signed-in identity plus sign-out.
 */
import {
  BarChart3,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarRail,
} from "@/components/ui/animated-sidebar"

// Each role only sees the sections it can actually reach (mirrors the route
// guards in App.jsx). Unknown roles fall back to the client navigation.
const NAV_BY_ROLE = {
  super_admin: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
  ],
  gym_admin: [
    {
      label: "Overview",
      to: "/dashboard/gym",
      icon: LayoutDashboard,
      end: true,
    },
    { label: "Members", to: "/dashboard/gym/members", icon: Users },
    { label: "Coaches", to: "/dashboard/gym/coaches", icon: Dumbbell },
  ],
  coach: [
    { label: "My Clients", to: "/dashboard/coach", icon: UserCheck, end: true },
    { label: "All Clients", to: "/dashboard/coach/all-clients", icon: Users },
    { label: "Exercises", to: "/dashboard/coach/exercises", icon: ShieldCheck },
    { label: "Routines", to: "/dashboard/coach/routines", icon: ClipboardList },
    { label: "Account", to: "/dashboard/account", icon: UserCircle },
  ],
  client: [
    {
      label: "My Workouts",
      to: "/dashboard/client",
      icon: Dumbbell,
      end: true,
    },
    { label: "Progress", to: "/dashboard/client/progress", icon: BarChart3 },
    { label: "Account", to: "/dashboard/account", icon: UserCircle },
  ],
}

const ACCOUNT_PATH = "/dashboard/account"

export function AppSidebar(props) {
  const { user, role, gymBranding, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.client
  const setupRequired = Boolean(user?.setupRequired)

  const isSuperAdmin = role === "super_admin"
  const brandName = isSuperAdmin ? "Flexity" : user?.profile?.name || "Workspace"
  const displayName = user?.profile?.name || user?.email || "Account"

  function isActive(item) {
    return item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  }

  return (
    <AnimatedSidebar
      ariaLabel="Dashboard navigation"
      collapsible="icon"
      panelClassName="border-hairline bg-canvas"
      {...props}
    >
      <AnimatedSidebarHeader className="border-hairline border-b p-3 pb-2">
        <div className="flex min-h-11 items-center gap-3 overflow-hidden px-2">
          {gymBranding.logoUrl ? (
            <img
              src={gymBranding.logoUrl}
              alt={brandName}
              className="size-8 shrink-0 object-contain"
            />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center bg-primary text-canvas">
              <Dumbbell className="size-4" />
            </span>
          )}
          <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
            <p className="truncate text-sm font-bold tracking-[0.16em] text-ink uppercase">
              {brandName}
            </p>
            <p className="truncate text-[9px] tracking-[0.24em] text-ink-tertiary uppercase">
              {isSuperAdmin ? "Platform console" : "Gym workspace"}
            </p>
          </div>
          <AnimatedSidebarClose className="ml-auto text-ink-subtle hover:bg-surface-2 md:hidden">
            <X aria-hidden="true" className="size-4" />
          </AnimatedSidebarClose>
        </div>
      </AnimatedSidebarHeader>

      <AnimatedSidebarContent className="px-2 pt-2">
        <AnimatedSidebarGroup>
          <AnimatedSidebarGroupLabel className="text-ink-tertiary">
            Navigation
          </AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                // Pending members can only reach the account page until they
                // replace their setup PIN with real credentials.
                const locked = setupRequired && item.to !== ACCOUNT_PATH

                return (
                  <AnimatedSidebarMenuItem key={item.to}>
                    <AnimatedSidebarMenuButton
                      isActive={isActive(item)}
                      icon={<Icon className="size-4" />}
                      disabled={locked}
                      badge={
                        locked ? (
                          <Lock className="size-3.5" aria-hidden="true" />
                        ) : undefined
                      }
                      onSelect={() => navigate(item.to)}
                      className="text-ink-subtle hover:text-ink"
                    >
                      {item.label}
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                )
              })}
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      </AnimatedSidebarContent>

      <AnimatedSidebarFooter className="gap-3 border-hairline p-3">
        <div className="flex min-h-11 items-center gap-3 overflow-hidden rounded-xs px-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-canvas">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
            <span className="block truncate text-sm font-bold text-ink">
              {displayName}
            </span>
            <span className="block truncate text-[10px] tracking-[0.18em] text-ink-tertiary uppercase">
              {role?.replace("_", " ") ?? "Workspace"}
            </span>
          </span>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="grid size-8 shrink-0 place-items-center rounded-xs text-ink-subtle outline-none transition-colors hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring group-data-[state=collapsed]/sidebar:hidden"
          >
            <LogOut aria-hidden="true" className="size-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </AnimatedSidebarFooter>

      <AnimatedSidebarRail />
    </AnimatedSidebar>
  )
}
