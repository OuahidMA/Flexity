/**
 * Access the auth context (user, role, branding, session actions).
 * Throws when called outside `<AuthProvider>` so provider wiring mistakes fail
 * loudly during development instead of yielding undefined state.
 */
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

/**
 * @returns {{
 *   user: object|null,
 *   role: string|null,
 *   gymBranding: object,
 *   subscription: object|null,
 *   isAuthenticated: boolean,
 *   isSuspended: boolean,
 *   loading: boolean,
 *   login: Function,
 *   setup: Function,
 *   request: Function,
 *   logout: Function,
 * }} The current auth context value.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export default useAuth;
