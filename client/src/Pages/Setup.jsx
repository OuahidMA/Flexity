/**
 * One-time platform bootstrap.
 *
 * Checks `/setup/status` to prove no administrator exists, then creates the gym
 * and its first admin through AuthContext. The API is authoritative: if the
 * platform is already initialized (409), the form switches to a "sign in"
 * message instead of allowing a second bootstrap.
 */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Dumbbell, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { apiRequest } from "@/lib/api"
import { getRoleHome } from "@/lib/roles"

export default function Setup() {
  const { setup } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState({
    loading: true,
    initialized: false,
    error: "",
  })
  const [businessName, setBusinessName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Load the server's initialization state before showing the form so a second
  // gym can never be created by visiting this URL directly.
  useEffect(() => {
    let cancelled = false

    apiRequest("/setup/status")
      .then((data) => {
        if (!cancelled) {
          setStatus({
            loading: false,
            initialized: Boolean(data?.initialized),
            error: "",
          })
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setStatus({
            loading: false,
            initialized: false,
            error:
              requestError.message ??
              "Unable to reach the server. Make sure the API is running.",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const user = await setup({ businessName, name, email, password })
      navigate(getRoleHome(user?.role), { replace: true })
    } catch (submitError) {
      // 409 means another request initialized the platform first; mirror that
      // state locally instead of showing a raw error.
      if (submitError.status === 409) {
        setStatus({ loading: false, initialized: true, error: "" })
      } else {
        setError(submitError.message ?? "Unable to create the gym.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-3 text-white">
          <span className="grid size-9 place-items-center bg-white text-black">
            <Dumbbell className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight uppercase">
            Flexity
          </span>
        </Link>

        <div className="border border-neutral-800 bg-neutral-950 p-8">
          {status.loading ? (
            <p className="text-sm text-neutral-400">Checking setup status...</p>
          ) : status.initialized ? (
            <div>
              <div className="flex items-center gap-3 text-white">
                <ShieldCheck className="size-5 text-white" />
                <h1 className="text-xl font-semibold">Platform already set up</h1>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                A gym administrator account already exists. Sign in to continue.
              </p>
              <Button
                className="mt-6 h-11 w-full rounded-none text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ backgroundColor: "#FFC000", color: "#000000" }}
                render={<Link to="/login" />}
              >
                Go to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">
                Create your gym workspace
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                This one-time setup registers the gym and its administrator.
                After this step the setup page closes permanently.
              </p>

              {status.error && (
                <p className="mt-4 border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {status.error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label
                    htmlFor="businessName"
                    className="text-xs font-semibold tracking-[0.15em] text-neutral-400 uppercase"
                  >
                    Gym name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="mt-2 h-11 rounded-none border-neutral-800 bg-black text-white focus-visible:border-white focus-visible:ring-white/30"
                    placeholder="Iron House Fitness"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold tracking-[0.15em] text-neutral-400 uppercase"
                  >
                    Your name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 h-11 rounded-none border-neutral-800 bg-black text-white focus-visible:border-white focus-visible:ring-white/30"
                    placeholder="Jordan Lee"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold tracking-[0.15em] text-neutral-400 uppercase"
                  >
                    Admin email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 h-11 rounded-none border-neutral-800 bg-black text-white focus-visible:border-white focus-visible:ring-white/30"
                    placeholder="admin@ironhouse.fit"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold tracking-[0.15em] text-neutral-400 uppercase"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 h-11 rounded-none border-neutral-800 bg-black text-white focus-visible:border-white focus-visible:ring-white/30"
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold tracking-[0.15em] text-neutral-400 uppercase"
                    >
                      Confirm password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className="mt-2 h-11 rounded-none border-neutral-800 bg-black text-white focus-visible:border-white focus-visible:ring-white/30"
                      placeholder="Repeat password"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting || Boolean(status.error)}
                  className="h-11 w-full rounded-none text-xs font-semibold tracking-[0.15em] uppercase"
                  style={{ backgroundColor: "#FFC000", color: "#000000" }}
                >
                  {submitting ? "Creating workspace..." : "Create workspace"}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-neutral-500">
                Already set up?{" "}
                <Link to="/login" className="text-white underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
