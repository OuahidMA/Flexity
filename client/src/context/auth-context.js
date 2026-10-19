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
 */
export const DEFAULT_BRANDING = {
  logoUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  accentColor: "#FFC000",
};

/**
 * `null` is the sentinel used by `useAuth` to detect a missing provider.
 */
export const AuthContext = createContext(null);
