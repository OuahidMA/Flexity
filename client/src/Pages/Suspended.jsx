/**
 * Blocking screen for tenant users whose gym subscription is not active.
 *
 * `ProtectedRoute` redirects here before rendering any dashboard content. The
 * page uses the tenant's branding tokens so the notice still feels like part of
 * the gym, and offers sign-out plus a way back to the public site.
 */
import { Link } from "react-router-dom";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * @returns {JSX.Element} Branded subscription suspension screen.
 */
export default function Suspended() {
  const { gymBranding, subscription, user, logout } = useAuth();

  // Fall back to "suspended" if the subscription payload is missing, so the
  // message is always meaningful.
  const status = subscription?.status ?? "suspended";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundColor: gymBranding.primaryColor,
        color: gymBranding.secondaryColor,
      }}
    >
      <span
        className="grid size-14 place-items-center"
        style={{
          backgroundColor: gymBranding.accentColor,
          color: gymBranding.primaryColor,
        }}
      >
        <AlertTriangle className="size-7" />
      </span>

      <h1 className="mt-6 text-2xl leading-[0.95] uppercase">
        Account suspended
      </h1>
      <p className="mt-2 max-w-md text-sm opacity-80">
        Access for {user?.profile?.name || user?.email || "this account"} is
        currently unavailable. Your subscription status is{" "}
        <span className="font-bold">{status.replace("_", " ")}</span>.
      </p>
      <p className="mt-1 max-w-md text-sm opacity-60">
        Please contact your gym administrator to restore access.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button
          onClick={logout}
          className="h-10 rounded-xs px-5 text-xs font-bold tracking-[0.15em] uppercase"
          style={{
            backgroundColor: gymBranding.accentColor,
            color: gymBranding.primaryColor,
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
        <Button
          render={<Link to="/" />}
          nativeButton={false}
          variant="outline"
          className="h-10 rounded-xs border-white/30 bg-transparent px-5 text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: gymBranding.secondaryColor }}
        >
          Back to site
        </Button>
      </div>
    </div>
  );
}
