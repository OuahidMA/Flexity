/**
 * Blocking screen for tenant users whose gym subscription is not active.
 *
 * `ProtectedRoute` redirects here before rendering any dashboard content. The
 * screen follows DESIGN.md: the dark charcoal canvas, sentence-case display
 * type, a single hairline-framed notice and one gold CTA. The warning hue is
 * functional only — it signals state, it never brands.
 */
import { Link } from "react-router-dom"
import { AlertTriangle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

/**
 * @returns {JSX.Element} Branded subscription suspension screen.
 */
export default function Suspended() {
  const { subscription, user, logout } = useAuth()

  // Fall back to "suspended" if the subscription payload is missing, so the
  // message is always meaningful.
  const status = subscription?.status ?? "suspended"

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-canvas px-6 py-20 text-center text-ink">
      <span className="grid size-14 place-items-center border border-semantic-warning/40 bg-semantic-warning/10 text-semantic-warning">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>

      <p className="eyebrow mt-6 text-ink-subtle">Subscription inactive</p>

      <h1 className="display-lg mt-4 max-w-2xl text-ink">
        Account suspended
      </h1>

      <p className="body-md mt-5 max-w-md text-ink-muted">
        Access for {user?.profile?.name || user?.email || "this account"} is
        currently unavailable. Your subscription status is{" "}
        <span className="cap-label text-ink">
          {status.replace("_", " ")}
        </span>
        .
      </p>
      <p className="body-md mt-2 max-w-md text-ink-subtle">
        Please contact your gym administrator to restore access.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={logout}
          className="gap-2"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
        <Button
          variant="outline"
          render={<Link to="/" />}
          nativeButton={false}
        >
          Back to site
        </Button>
      </div>
    </div>
  )
}
