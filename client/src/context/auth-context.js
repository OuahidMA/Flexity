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
 * The brand palette is monochrome: black canvas, white ink, and a cool-grey
 * accent for supporting surfaces.
 */
export const DEFAULT_BRANDING = {
  logoUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  accentColor: "#f0f0fa",
};

/**
 * `null` is the sentinel used by `useAuth` to detect a missing provider.
 */
export const AuthContext = createContext(null);
