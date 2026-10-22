/**
 * Platform overview for the super admin.
 *
 * Intentionally lightweight: it summarizes the authenticated session, the
 * current route, tenant scope, and the active branding tokens. Gym-level metrics
 * live in each tenant's own admin dashboard.
 */
import { useLocation } from "react-router-dom"

import { useAuth } from "@/hooks/useAuth"
import { PageHeader } from "@/components/dashboard/page-header"

const ROLE_LABELS = {
  super_admin: "Platform Super Admin",
  gym_admin: "Gym Administrator",
  coach: "Coach",
  client: "Client",
}

/**
 * @returns {JSX.Element} Session summary, context facts, and brand swatches.
 */
export default function DashboardHome() {
  const { user, role, gymBranding } = useAuth()
  const location = useLocation()

  const swatches = [
    { label: "Primary", value: gymBranding.primaryColor },
    { label: "Secondary", value: gymBranding.secondaryColor },
    { label: "Accent", value: gymBranding.accentColor },
  ]

  const facts = [
    { label: "Role", value: ROLE_LABELS[role] ?? "Workspace" },
    { label: "Section", value: location.pathname },
    { label: "Tenant scope", value: "Platform-wide" },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform console"
        title="Overview"
        description="Monitor the platform shell, current session, and active brand tokens."
      />

      {/* Session banner — near-black surface with a hairline top rule. */}
      <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface-2 p-8 sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-hairline-strong" />
        <p className="eyebrow text-ink-subtle">Authenticated session</p>
        <h3 className="display-lg mt-4 max-w-3xl text-ink">
          Welcome back, {user?.profile?.name || user?.email}
        </h3>
        <p className="body-md mt-4 max-w-xl text-ink-subtle">
          This console is reserved for platform-level administration. Tenant
          workspaces are managed through their own gym administrator accounts.
        </p>
      </div>

      {/* Context facts, divided by hairlines instead of separate cards. */}
      <div className="grid border border-hairline sm:grid-cols-3">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={`bg-surface-1 p-6 ${
              index > 0
                ? "border-t border-hairline sm:border-t-0 sm:border-l"
                : ""
            }`}
          >
            <p className="eyebrow text-ink-subtle">{fact.label}</p>
            <p className="mt-3 truncate cap-label text-ink">
              {fact.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-4">
          <h3 className="cap-label text-ink">
            Brand tokens
          </h3>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {swatches.map((swatch) => (
            <div
              key={swatch.label}
              className="rounded-lg border border-hairline bg-surface-1 p-5"
            >
              <div
                className="h-16 w-full border border-hairline"
                style={{ backgroundColor: swatch.value }}
              />
              <p className="eyebrow mt-4 text-ink-subtle">{swatch.label}</p>
              <p className="mt-1 cap-label text-ink tabular-nums">
                {swatch.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
