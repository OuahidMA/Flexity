/**
 * Account page for coaches and clients.
 *
 * Members invited with a one-time PIN land here first. Until they submit this
 * form the rest of the workspace is locked, and the server only accepts the
 * setup endpoint for their session. Submitting replaces the PIN with an
 * email/password and unlocks their role home.
 *
 * Fully set-up members can still open this page to review their identity; the
 * gym administrator remains the only one who can edit or reset it.
 */
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { KeyRound, ShieldCheck } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { getRoleHome, getRoleLabel } from "@/lib/roles"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * @returns {JSX.Element} Account setup form or read-only account summary.
 */
export default function Account() {
  const { user, role, completeSetup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.profile?.name ?? "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const setupRequired = Boolean(user?.setupRequired)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSaving(true)

    try {
      const updated = await completeSetup({ name, email, password })
      navigate(getRoleHome(updated?.role ?? role), { replace: true })
    } catch (setupError) {
      setError(setupError.message ?? "Unable to finish account setup.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getRoleLabel(role)}
        title="Account"
        description={
          setupRequired
            ? "Set up your sign-in details to unlock the workspace."
            : "Review the identity attached to this workspace."
        }
        actions={
          <StatusBadge status={setupRequired ? "Pending" : "Active"} />
        }
      />

      {setupRequired ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-hairline bg-surface-1 p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-3 border-b border-hairline pb-4">
              <span className="grid size-10 shrink-0 place-items-center bg-primary text-primary-foreground">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="display-sm text-ink">
                  Replace your setup PIN
                </h3>
                <p className="caption mt-1 text-ink-subtle">
                  Your PIN is deleted the moment this form is submitted.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="account-name">Full name</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-password">Password</Label>
                  <Input
                    id="account-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-confirm">Confirm password</Label>
                  <Input
                    id="account-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xs border border-destructive/40 bg-destructive/10 px-3 py-2 caption text-destructive"
                >
                  {error}
                </p>
              )}

              <Button type="submit" disabled={saving} className="gap-2">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {saving ? "Saving..." : "Finish setup"}
              </Button>
            </div>
          </form>

          <aside className="rounded-lg border border-hairline bg-surface-1 p-6">
            <h3 className="eyebrow text-ink-subtle">Why this step?</h3>
            <p className="caption mt-3 text-ink-subtle">
              Your gym created this account with a one-time PIN so no shared
              password ever travels over chat or paper. Pick credentials only you
              know; the PIN stops working immediately after setup.
            </p>
            <ul className="mt-4 space-y-2 caption text-ink-subtle">
              <li className="border-t border-hairline pt-2">
                Email becomes your normal sign-in identity.
              </li>
              <li className="border-t border-hairline pt-2">
                Password must be at least 8 characters.
              </li>
              <li className="border-t border-hairline pt-2">
                Only your gym administrator can reset it later.
              </li>
            </ul>
          </aside>
        </div>
      ) : (
        <div className="max-w-2xl border border-hairline bg-surface-1 p-6">
          <dl className="divide-y divide-hairline">
            <div className="flex items-center justify-between gap-6 py-4 first:pt-0">
              <dt className="eyebrow text-ink-subtle">Name</dt>
              <dd className="text-[13px] font-medium text-ink">
                {user?.profile?.name || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="eyebrow text-ink-subtle">Email</dt>
              <dd className="caption text-ink">{user?.email || "Not set"}</dd>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="eyebrow text-ink-subtle">Role</dt>
              <dd className="caption text-ink">{getRoleLabel(role)}</dd>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <dt className="eyebrow text-ink-subtle">Password</dt>
              <dd className="caption text-ink-subtle">
                Stored securely · contact your gym to reset
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
