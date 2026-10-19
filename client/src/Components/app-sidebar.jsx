/**
 * Role-aware dashboard navigation.
 *
 * The visible links, brand name, and workspace subtitle all derive from the
 * authenticated user. Rendering is delegated to the shadcn sidebar primitives,
 * which handle collapse/expand; the footer dropdown exposes sign-out.
 */
import {
  BarChart3,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  ChevronDown,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Each role only sees the sections it can actually reach (mirrors the route
// guards in App.jsx). Unknown roles fall back to the client navigation.
const NAV_BY_ROLE = {
  super_admin: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
  ],
  gym_admin: [
    { label: "Overview", to: "/dashboard/gym", icon: LayoutDashboard, end: true },
    { label: "Members", to: "/dashboard/gym/members", icon: Users },
    { label: "Coaches", to: "/dashboard/gym/coaches", icon: Dumbbell },
  ],
  coach: [
    { label: "My Clients", to: "/dashboard/coach", icon: Users, end: true },
    { label: "Exercises", to: "/dashboard/coach/exercises", icon: ShieldCheck },
    { label: "Routines", to: "/dashboard/coach/routines", icon: ClipboardList },
  ],
  client: [
    { label: "My Workouts", to: "/dashboard/client", icon: Dumbbell, end: true },
    { label: "Progress", to: "/dashboard/client/progress", icon: BarChart3 },
  ],
}

const NAV_ITEM_CLASS =
  "h-10 rounded-none text-[11px] font-normal tracking-[0.16em] text-[#969696] uppercase hover:bg-[#181818] hover:text-white data-active:bg-[#181818] data-active:text-white data-active:shadow-[inset_2px_0_0_#FFFFFF]"

/**
 * Sidebar shell for the dashboard layout.
 *
 * @param {object} props - Extra props forwarded to the root `Sidebar`.
 * @returns {JSX.Element} Brand header, role navigation, and account footer.
 */
export function AppSidebar({ ...props }) {
  const { user, role, gymBranding, logout } = useAuth()
  const location = useLocation()
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.client

  const isSuperAdmin = role === "super_admin"
  const brandName = isSuperAdmin ? "Flexity" : user?.profile?.name || "Workspace"

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand block: tenant logo when configured, otherwise a neutral mark. */}
      <SidebarHeader className="border-b border-[#202020]">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-14 items-center gap-3 px-2">
              {gymBranding.logoUrl ? (
                <img src={gymBranding.logoUrl} alt={brandName} className="size-8 object-contain" />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center bg-white text-black">
                  <Dumbbell className="size-4" />
                </span>
              )}
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-normal tracking-[0.18em] text-white uppercase">
                  {brandName}
                </p>
                <p className="truncate text-[9px] tracking-[0.24em] text-[#7D7D7D] uppercase">
                  {isSuperAdmin ? "Platform console" : "Gym workspace"}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Primary navigation. `end` items must match exactly so sibling routes
          (e.g. /dashboard/gym vs /dashboard/gym/members) do not both highlight. */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-normal tracking-[0.28em] text-[#494949] uppercase">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={active}
                      className={NAV_ITEM_CLASS}
                      render={<NavLink to={item.to} end={item.end} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Account footer: identity display plus the sign-out action. */}
      <SidebarFooter className="border-t border-[#202020]">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-none hover:bg-[#181818] data-open:bg-[#181818] data-open:text-white"
                  />
                }
              >
                <div className="grid aspect-square size-8 shrink-0 place-items-center bg-white text-black">
                  <Users className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-normal text-white">
                    {user?.profile?.name || user?.email}
                  </span>
                  <span className="truncate text-[9px] tracking-[0.2em] text-[#7D7D7D] uppercase">
                    {role?.replace("_", " ")}
                  </span>
                </div>
                <ChevronDown className="ml-auto size-4 text-[#7D7D7D] group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56 rounded-none border border-[#262626]" side="top" align="end" sideOffset={4}>
                <DropdownMenuItem onClick={logout} className="rounded-none tracking-[0.08em] uppercase">
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
