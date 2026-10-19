/**
 * Shell for all authenticated dashboard routes.
 *
 * Composes the collapsible role-aware sidebar with a content header that shows
 * the current role label and signed-in identity. Child pages render through the
 * nested `<Outlet />`, so this layout is mounted once per dashboard session.
 */
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/lib/roles";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * @returns {JSX.Element} Sidebar + header + routed page content.
 */
export default function DashboardLayout() {
  const { role, user } = useAuth();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-black">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#202020] bg-black px-4 transition-[width,height] ease-linear sm:px-6 lg:px-10 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1 text-[#7D7D7D] hover:text-white" />
          <div className="h-4 w-px bg-[#202020]" aria-hidden="true" />
          <p className="text-[10px] font-normal tracking-[0.28em] text-[#7D7D7D] uppercase">
            {getRoleLabel(role)}
          </p>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden text-[10px] tracking-[0.2em] text-[#494949] uppercase sm:inline">
              {user?.profile?.name || user?.email}
            </span>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
