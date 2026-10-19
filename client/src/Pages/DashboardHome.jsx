/**
 * Platform overview for the super admin.
 *
 * Intentionally lightweight: it summarizes the authenticated session, the
 * current route, tenant scope, and the active branding tokens. Gym-level metrics
 * live in each tenant's own admin dashboard.
 */
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";

const ROLE_LABELS = {
  super_admin: "Platform Super Admin",
  gym_admin: "Gym Administrator",
  coach: "Coach",
  client: "Client",
};

/**
 * @returns {JSX.Element} Session summary, context facts, and brand swatches.
 */
export default function DashboardHome() {
  const { user, role, gymBranding } = useAuth();
  const location = useLocation();

  const swatches = [
    { label: "Primary", value: gymBranding.primaryColor },
    { label: "Secondary", value: gymBranding.secondaryColor },
    { label: "Accent", value: gymBranding.accentColor },
  ];

  const facts = [
    { label: "Role", value: ROLE_LABELS[role] ?? "Workspace" },
    { label: "Section", value: location.pathname },
    { label: "Tenant scope", value: "Platform-wide" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform console"
        title="Overview"
        description="Monitor the platform shell, current session, and active brand tokens."
      />

      <div className="relative overflow-hidden border border-[#262626] bg-[#181818] p-8 sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-[#3a3a3a]" />
        <p className="text-[10px] tracking-[0.28em] text-[#7D7D7D] uppercase">
          Authenticated session
        </p>
        <h3 className="mt-4 max-w-3xl text-4xl leading-[1.02] font-normal tracking-[-0.03em] text-white uppercase sm:text-5xl">
          Welcome back,
          <br />
          {user?.profile?.name || user?.email}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#7D7D7D]">
          This console is reserved for platform-level administration. Tenant
          workspaces are managed through their own gym administrator accounts.
        </p>
      </div>

      <div className="grid border border-[#262626] sm:grid-cols-3">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={`bg-[#202020] p-6 ${
              index > 0 ? "border-t border-[#262626] sm:border-t-0 sm:border-l" : ""
            }`}
          >
            <p className="text-[10px] tracking-[0.24em] text-[#7D7D7D] uppercase">
              {fact.label}
            </p>
            <p className="mt-3 truncate text-sm tracking-[0.06em] text-white uppercase">
              {fact.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-4">
          <h3 className="text-sm tracking-[0.18em] text-white uppercase">
            Brand tokens
          </h3>
          <div className="h-px flex-1 bg-[#202020]" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {swatches.map((swatch) => (
            <div key={swatch.label} className="border border-[#262626] bg-[#181818] p-5">
              <div
                className="h-16 w-full border border-[#262626]"
                style={{ backgroundColor: swatch.value }}
              />
              <p className="mt-4 text-[10px] tracking-[0.24em] text-[#7D7D7D] uppercase">
                {swatch.label}
              </p>
              <p className="mt-1 font-mono text-xs tracking-[0.08em] text-white uppercase">
                {swatch.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
