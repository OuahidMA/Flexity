/**
 * Shell for all authenticated dashboard routes.
 *
 * Composes the collapsible role-aware animated sidebar with a content header
 * that shows the current role label and signed-in identity. Child pages render
 * through the nested `<Outlet />`, so this layout is mounted once per dashboard
 * session.
 */
import { PanelLeft } from "lucide-react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
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
          <AnimatedSidebarTrigger className="text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink">
            <PanelLeft aria-hidden="true" className="size-4" />
          </AnimatedSidebarTrigger>
          <div className="h-4 w-px bg-hairline" aria-hidden="true" />
          <p className="text-[10px] font-normal tracking-[0.28em] text-ink-subtle uppercase">
            {getRoleLabel(role)}
          </p>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden text-[10px] tracking-[0.2em] text-ink-tertiary uppercase sm:inline">
              {user?.profile?.name || user?.email}
            </span>
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
