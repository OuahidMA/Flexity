/**
 * Route guard for authenticated dashboard pages.
 *
 * Guards run in priority order: wait for session hydration, require a user,
 * block suspended tenants, keep members with a pending setup PIN on the account
 * page, then enforce role membership. Nested guards allow each role subtree to
 * be protected independently (see App.jsx).
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Minimal full-screen placeholder shown while `/auth/me` is resolving, so the
 * app never redirects to `/login` before the cookie session is known.
 */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
      <span className="animate-pulse text-sm tracking-[0.2em] uppercase">
        Loading
      </span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Roles permitted through this guard;
 *   omit/empty to allow any authenticated user.
 * @param {boolean} [props.requireSubscription=true] - When true, non-active
 *   tenant subscriptions are redirected to the suspension screen.
 * @returns {JSX.Element} The nested route outlet, or a redirect/fallback.
 */
export default function ProtectedRoute({ allowedRoles, requireSubscription = true }) {
  const {
    isAuthenticated,
    role,
    isSuspended,
    setupRequired,
    loading,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteFallback />;
  }

  if (!isAuthenticated) {
    // Remember the attempted URL so Login can return the user after sign-in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSubscription && isSuspended) {
    return <Navigate to="/suspended" replace />;
  }

  // Coaches/clients created with a PIN must complete account setup before they
  // can reach any other dashboard page.
  if (setupRequired && location.pathname !== "/dashboard/account") {
    return <Navigate to="/dashboard/account" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const permitted = allowedRoles.includes(role);

    if (!permitted) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
