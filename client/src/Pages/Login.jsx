/**
 * Sign-in and account-activation page.
 *
 * Two entry paths share one screen:
 * - Email + password for existing accounts.
 * - A one-time setup PIN issued by a gym admin. PIN sessions are pending until
 *   the member chooses credentials on the account page.
 *
 * The left panel is decorative marketing; the right panel owns the form. All
 * state stays local except the session, which is managed by AuthContext.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "@/hooks/useAuth";
import { formatPin } from "@/lib/pins";
import { getRoleHome } from "@/lib/roles";

const INPUT_CLASS =
  "h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const LABEL_CLASS = "text-sm font-medium text-gray-700";

/**
 * @returns {JSX.Element} Split gradient/marketing layout with auth form.
 */
export default function Login() {
  const { login, pinLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname;

  const [mode, setMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  function handlePinChange(event) {
    setPin(formatPin(event.target.value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const signedInUser =
        mode === "pin"
          ? await pinLogin(pin)
          : await login({ email, password });

      if (signedInUser?.setupRequired) {
        navigate("/dashboard/account", { replace: true });
        return;
      }

      navigate(redirectTo ?? getRoleHome(signedInUser?.role), { replace: true });
    } catch (err) {
      setError(
        err.message ??
          (mode === "pin"
            ? "Unable to use that PIN. Please try again."
            : "Unable to sign in. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleUnavailable(feature) {
    setError(
      `${feature} is not available yet. Use your ${
        mode === "pin" ? "setup PIN" : "email and password"
      } instead.`
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      {/* Brand / marketing panel. */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,#4338ca_0%,#6d28d9_48%,#1e1b4b_100%)] p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-10 size-96 rounded-full bg-indigo-400/20 blur-3xl"
        />

        <Link to="/" className="relative inline-flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Flexity</span>
        </Link>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Secure workspace access
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight normal-case xl:text-5xl">
            Train with clarity.
            <br />
            Run your gym with confidence.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-indigo-100">
            One workspace for administrators, coaches, and clients. Sharp
            routines, precise progress, and zero shared passwords.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              { label: "Gym operations", value: "01" },
              { label: "Coach routines", value: "02" },
              { label: "Client progress", value: "03" },
            ].map((fact) => (
              <div key={fact.value}>
                <p className="text-[10px] font-medium tracking-[0.24em] text-indigo-200/80">
                  {fact.value}
                </p>
                <p className="mt-2 text-xs font-medium tracking-wide text-white">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-indigo-200/70">
          Each account is protected by a one-time setup PIN.
        </p>
      </section>

      {/* Form panel. */}
      <section className="flex w-full flex-col items-center justify-center bg-gray-50 px-5 py-10 sm:px-8 lg:w-1/2">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-3 lg:hidden"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#4338ca,#7c3aed)] text-white">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Flexity
          </span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-900/5 sm:p-9">
          <header>
            <h2 className="text-2xl font-bold tracking-tight normal-case text-gray-900 sm:text-3xl">
              {mode === "pin" ? "Activate your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {mode === "pin"
                ? "Enter the one-time PIN from your gym. You will choose your own email and password next."
                : "Sign in to your gym workspace and training data."}
            </p>
          </header>

          {mode === "password" && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUnavailable("Google sign-in")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <FcGoogle className="size-5" aria-hidden="true" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleUnavailable("X sign-in")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <FaXTwitter className="size-4" aria-hidden="true" />
                  Twitter
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                  or continue with email
                </span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {mode === "pin" ? (
              <div className="space-y-2">
                <label htmlFor="pin" className={LABEL_CLASS}>
                  Setup PIN
                </label>
                <div className="relative">
                  <ShieldCheck
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  />
                  <input
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
                    className={`${INPUT_CLASS} font-mono uppercase tracking-[0.22em]`}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  The PIN stops working after your account is set up.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className={LABEL_CLASS}>
                    Email
                  </label>
                  <div className="relative">
                    <AtSign
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className={LABEL_CLASS}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center text-gray-400 transition hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="size-4 rounded border-gray-300 accent-indigo-600"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => handleUnavailable("Password reset")}
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-5 text-center text-sm text-gray-500">
            {mode === "pin" ? (
              <>
                Already set up?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("password")}
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700"
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
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Activate your account
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <Lock className="size-3.5" aria-hidden="true" />
          Encrypted session · No passwords are ever shared by your gym
        </p>
      </section>
    </div>
  );
}
