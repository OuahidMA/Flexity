/**
 * Auth context contract shared by the provider and the `useAuth` hook.
 *
 * Kept in a plain `.js` module so the context object and default branding can be
 * imported without pulling JSX into non-component modules.
 */
import { createContext } from "react";

/**
 * Fallback tenant branding used for super admins or before branding hydrates.
 * The provider merges any API-provided branding over these values.
 *
 * The brand palette follows DESIGN.md: Gold VIP primary, pearl canvas and a
 * platinum accent for supporting surfaces.
 */
export const DEFAULT_BRANDING = {
  logoUrl: "",
  primaryColor: "#d4af37",
  secondaryColor: "#f9f9f8",
  accentColor: "#e5e4e2",
};

/**
 * `null` is the sentinel used by `useAuth` to detect a missing provider.
 */
export const AuthContext = createContext(null);
