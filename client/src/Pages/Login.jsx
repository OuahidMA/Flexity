/**
 * Sign-in and account-activation page.
 *
 * Two entry paths share one screen:
 * - Email + password for existing accounts.
 * - A one-time setup PIN issued by a gym admin. PIN sessions are pending until
 *   the member chooses credentials on the account page.
 *
 * The composition follows DESIGN.md: a night brand panel (`card-feature-dark`)
 * paired with the charcoal canvas form panel, weight-500 display type and one
 * gold `button-primary-gold` CTA. All state stays local except the
 * session, which AuthContext owns.
 */
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"
import { FcGoogle } from "react-icons/fc"

import { useAuth } from "@/hooks/useAuth"
import { formatPin } from "@/lib/pins"
import { getRoleHome } from "@/lib/roles"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Facts shown in the brand panel's numbered rail. */
const BRAND_FACTS = [
  { label: "Gym operations", value: "01" },
  { label: "Coach routines", value: "02" },
  { label: "Client progress", value: "03" },
]

/**
 * @returns {JSX.Element} Split brand/auth layout with the sign-in form.
 */
export default function Login() {
  const { login, pinLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname

  const [mode, setMode] = useState("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function switchMode(nextMode) {
    setMode(nextMode)
    setError("")
  }

  function handlePinChange(event) {
    setPin(formatPin(event.target.value))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const signedInUser =
        mode === "pin"
          ? await pinLogin(pin)
          : await login({ email, password })

      if (signedInUser?.setupRequired) {
        navigate("/dashboard/account", { replace: true })
        return
      }

      navigate(redirectTo ?? getRoleHome(signedInUser?.role), { replace: true })
    } catch (err) {
      setError(
        err.message ??
          (mode === "pin"
            ? "Unable to use that PIN. Please try again."
            : "Unable to sign in. Please try again.")
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleUnavailable(feature) {
    setError(
      `${feature} is not available yet. Use your ${
        mode === "pin" ? "setup PIN" : "email and password"
      } instead.`
    )
  }

  return (
    <div className="flex min-h-svh bg-canvas text-ink">
      {/* Brand panel — night canvas, full-bleed type, no gradients. */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-hairline bg-canvas-night p-10 text-on-dark lg:flex xl:p-14">
        <Link
          to="/"
          className="relative inline-flex items-center gap-3 text-on-dark transition-opacity hover:opacity-70"
        >
          <span className="grid size-9 place-items-center rounded-sm bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="cap-label leading-none">
            Flexity
          </span>
        </Link>

        <div className="relative max-w-xl">
          <p className="eyebrow text-on-dark/60">Secure workspace access</p>

          <h1 className="display-lg mt-6 text-on-dark">
            Train with clarity.
            <br />
            Run your gym with confidence.
          </h1>

          <p className="body-lg mt-6 max-w-md text-on-dark/70">
            One workspace for administrators, coaches, and clients. Sharp
            routines, precise progress, and zero shared passwords.
          </p>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-on-dark/20 pt-6">
            {BRAND_FACTS.map((fact) => (
              <div key={fact.value}>
                <dt className="eyebrow text-on-dark/50">
                  {fact.value}
                </dt>
                <dd className="mt-2 cap-label leading-tight text-on-dark">
                  {fact.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative caption text-on-dark/50">
          Each account is protected by a one-time setup PIN.
        </p>
      </section>

      {/* Form panel — brand canvas, separated by a single hairline. */}
      <section className="relative flex w-full flex-col items-center justify-center bg-canvas px-5 py-10 sm:px-8 lg:w-1/2 lg:py-14">
        <div className="absolute top-5 right-5 z-10 sm:right-8">
          <ThemeToggle />
        </div>
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-3 text-ink transition-opacity hover:opacity-70 lg:hidden"
        >
          <span className="grid size-9 place-items-center rounded-sm bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="cap-label leading-none">
            Flexity
          </span>
        </Link>

        <div className="w-full max-w-md">
          <header>
            <h2 className="display-md text-ink">
              {mode === "pin" ? "Activate account" : "Welcome back"}
            </h2>
            <p className="body-md mt-3 text-ink-muted">
              {mode === "pin"
                ? "Enter the one-time PIN from your gym. You will choose your own email and password next."
                : "Sign in to your gym workspace and training data."}
            </p>
          </header>

          {/* Mode switch — the active tab is the Gold VIP primary CTA. */}
          <div
            role="tablist"
            aria-label="Sign-in method"
            className="mt-8 grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "password"}
              onClick={() => switchMode("password")}
              className={`h-11 rounded-sm border cap-label transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                mode === "password"
                  ? "border-hairline-strong bg-surface-2 text-ink"
                  : "border-hairline bg-canvas text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "pin"}
              onClick={() => switchMode("pin")}
              className={`h-11 rounded-sm border cap-label transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                mode === "pin"
                  ? "border-hairline-strong bg-surface-2 text-ink"
                  : "border-hairline bg-canvas text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              Setup PIN
            </button>
          </div>

          {mode === "password" && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary-outline"
                onClick={() => handleUnavailable("Google sign-in")}
              >
                <FcGoogle aria-hidden="true" />
                Google
              </Button>
              <Button
                type="button"
                variant="secondary-outline"
                onClick={() => handleUnavailable("X sign-in")}
              >
                <FaXTwitter aria-hidden="true" />
                Twitter
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {mode === "pin" ? (
              <div className="space-y-2">
                <Label htmlFor="pin">Setup PIN</Label>
                <div className="relative">
                  <ShieldCheck
                    aria-hidden="true"
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                  />
                  <Input
                    id="pin"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={9}
                    required
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="XXXX-XXXX"
                    aria-describedby="pin-hint"
                    className="ps-10 text-[16px] tracking-[0.22em] uppercase tabular-nums"
                  />
                </div>
                <p id="pin-hint" className="caption text-ink-muted">
                  The PIN stops working after your account is set up.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <AtSign
                      aria-hidden="true"
                      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="ps-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="ps-10 pe-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-ink-muted transition-colors outline-none hover:bg-surface-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 cap-label text-ink-muted">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(checked) => setRemember(Boolean(checked))}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => handleUnavailable("Password reset")}
                    className="cap-label text-ink transition-colors outline-none hover:text-ink-muted hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 caption text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting
                ? mode === "pin"
                  ? "Checking PIN..."
                  : "Signing in..."
                : mode === "pin"
                  ? "Continue to account setup"
                  : "Sign in"}
              {!submitting && (
                <ArrowRight className="size-4" aria-hidden="true" />
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-hairline pt-5 text-center caption text-ink-muted">
            {mode === "pin" ? (
              <>
                Already set up?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("password")}
                  className="cap-label text-ink transition-colors outline-none hover:text-ink-muted hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Have a setup PIN?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("pin")}
                  className="cap-label text-ink transition-colors outline-none hover:text-ink-muted hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Activate your account
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-10 flex items-center gap-2 caption text-ink-subtle">
          <Lock className="size-3.5" aria-hidden="true" />
          Encrypted session · No passwords are ever shared by your gym
        </p>
      </section>
    </div>
  )
}
