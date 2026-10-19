/**
 * Authentication provider for the whole SPA.
 *
 * The source of truth is the server session cookie: on mount it calls
 * `/auth/me` to hydrate the user, their gym branding, and subscription state.
 * Login and one-time setup replace that session immediately, while `request`
 * centralizes API calls so any 401 clears local auth state. Role-based routing
 * reads `role`/`isSuspended` from the memoized context value.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest } from "@/lib/api";
import { AuthContext, DEFAULT_BRANDING } from "@/context/auth-context";

/**
 * Hydrates and maintains the authenticated session.
 *
 * @param {{ children: React.ReactNode }} props - React subtree to wrap.
 * @returns {JSX.Element} Context provider exposing auth state and actions.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gymBranding, setGymBranding] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const skipHydrate = useRef(false);

  // Landing endpoints (login/setup) return the same envelope as `/auth/me`:
  // { user, gymBranding, subscription }. Branding is merged over defaults so
  // partial tenant configs still render complete theme tokens.
  const applySession = useCallback((payload) => {
    setUser(payload?.user ?? null);
    setGymBranding(
      payload?.gymBranding
        ? { ...DEFAULT_BRANDING, ...payload.gymBranding }
        : null
    );
    setSubscription(payload?.subscription ?? null);
  }, []);

  // Local-only reset used on logout and whenever the API reports a 401.
  const clearSession = useCallback(() => {
    setUser(null);
    setGymBranding(null);
    setSubscription(null);
  }, []);

  // Initial session hydration. `skipHydrate` prevents a late `/auth/me`
  // response from overwriting a login/setup that finished first, and the
  // `cancelled` flag prevents state updates after unmount (React StrictMode).
  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const data = await apiRequest("/auth/me");

        if (!cancelled && !skipHydrate.current) applySession(data);
      } catch (error) {
        // 401 simply means "not signed in"; other errors keep optimistic state
        // intact so a transient network failure does not log the user out.
        if (
          !cancelled &&
          !skipHydrate.current &&
          error.status === 401
        ) {
          clearSession();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  /**
   * Authenticate with email/password (plus an optional gym code) and hydrate
   * state from the response.
   *
   * @param {{ email: string, password: string, gymId?: string }} credentials
   * @returns {Promise<object>} The authenticated user record.
   */
  const login = useCallback(
    async ({ email, password, gymId }) => {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password, gymId },
      });

      skipHydrate.current = true;
      setLoading(false);
      applySession(data);

      return data.user;
    },
    [applySession]
  );

  /**
   * One-time platform bootstrap: creates the gym and its administrator, then
   * signs the new admin in from the returned session payload.
   *
   * @param {object} payload - Business, admin name, email, and password.
   * @returns {Promise<object>} The created administrator user.
   */
  const setup = useCallback(
    async (payload) => {
      const data = await apiRequest("/setup", {
        method: "POST",
        body: payload,
      });

      skipHydrate.current = true;
      setLoading(false);
      applySession(data);

      return data.user;
    },
    [applySession]
  );

  /**
   * Authenticated API helper used by feature pages and `useApiData`.
   * Clears the session on 401 so the route guards redirect to `/login`, then
   * rethrows so callers can still show their own error state.
   *
   * @param {string} path - API path.
   * @param {object} [options] - Forwarded to `apiRequest`.
   * @returns {Promise<any>} Parsed response body.
   */
  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, options);
      } catch (error) {
        if (error.status === 401) clearSession();

        throw error;
      }
    },
    [clearSession]
  );

  /**
   * Invalidate the server session, always clearing local state even when the
   * logout call fails (offline or already-expired cookie).
   */
  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // The local session is cleared even if the server is unreachable.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Derive role flags once per render pass. Suspension only applies to tenant
  // users (super admins are never blocked by a gym subscription). A missing
  // subscription payload (null status) is treated as active to avoid false
  // lockouts, while any known non-active status blocks the tenant.
  const value = useMemo(() => {
    const isAuthenticated = Boolean(user);
    const status = subscription?.status ?? null;
    const isSuspended = Boolean(
      user &&
        user.role !== "super_admin" &&
        status !== null &&
        status !== "active"
    );

    return {
      user,
      role: user?.role ?? null,
      gymBranding: gymBranding ?? DEFAULT_BRANDING,
      subscription,
      isAuthenticated,
      isSuspended,
      loading,
      login,
      setup,
      request,
      logout,
    };
  }, [
    user,
    gymBranding,
    subscription,
    loading,
    login,
    setup,
    request,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
