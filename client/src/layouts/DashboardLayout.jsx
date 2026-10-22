/**
 * Shell for all authenticated dashboard routes.
 *
 * Composes the collapsible role-aware animated sidebar with a content header
 * that shows the current role label and signed-in identity. Child pages render
 * through the nested `<Outlet />`, so this layout is mounted once per dashboard
 * session.
 *
 * The shell reads only semantic tokens, so it follows the light/dark theme
 * switched from the header. Header controls are icon-only to keep the bar calm.
 */
import { PanelLeft } from "lucide-react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { getRoleLabel } from "@/lib/roles"
import {
  AnimatedSidebarInset,
  AnimatedSidebarProvider,
  AnimatedSidebarTrigger,
} from "@/components/ui/animated-sidebar"

/**
 * @returns {JSX.Element} Sidebar + header + routed page content.
 */
export default function DashboardLayout() {
  const { role, user } = useAuth()

  return (
    <AnimatedSidebarProvider>
      <AppSidebar />
      <AnimatedSidebarInset className="bg-canvas">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-4 sm:px-6 lg:px-10">
          <AnimatedSidebarTrigger className="text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <PanelLeft aria-hidden="true" className="size-4" />
          </AnimatedSidebarTrigger>
          <div className="h-4 w-px bg-hairline-strong" aria-hidden="true" />
          <p className="eyebrow text-ink-muted">
            {getRoleLabel(role)}
          </p>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="caption hidden text-ink-muted sm:inline">
              {user?.profile?.name || user?.email}
            </span>
            <span className="h-4 w-px bg-hairline" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <Outlet />
          </div>
        </div>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  )
}
