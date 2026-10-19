/**
 * Sign-in page for every role.
 *
 * Login posts credentials through AuthContext (which stores only the returned
 * user in memory; the session itself is a browser-managed cookie). The page also asks
 * `/setup/status` so a fresh install can point the first admin at the one-time
 * setup flow. On success it returns the user to the guarded URL they attempted
 * or to their role's home.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { getRoleHome } from "@/lib/roles";

const FIELD_CLASS =
  "mt-2 h-12 w-full rounded-none border border-[#262626] bg-black px-4 text-sm text-white outline-none transition-colors placeholder:text-[#494949] focus:border-white focus:ring-0";
const LABEL_CLASS =
  "text-[10px] font-normal tracking-[0.24em] text-[#7D7D7D] uppercase";

const HERO_FACTS = [
  { value: "01", label: "Gym operations" },
  { value: "02", label: "Coach routines" },
  { value: "03", label: "Client progress" },
];

/**
 * @returns {JSX.Element} Split marketing/sign-in layout.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymId, setGymId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Non-blocking check: if the platform has no admin yet, surface the setup
  // link. Failures are ignored so login still works when the status endpoint is
  // unavailable.
  useEffect(() => {
    let cancelled = false;

    apiRequest("/setup/status")
      .then((data) => {
        if (!cancelled) setNeedsSetup(data?.initialized === false);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // The optional gym code disambiguates accounts that share an email across
  // tenants; an empty value is omitted from the payload.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const signedInUser = await login({
        email,
        password,
        gymId: gymId.trim() || undefined,
      });
      navigate(redirectTo ?? getRoleHome(signedInUser?.role), { replace: true });
    } catch (err) {
      setError(err.message ?? "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between border-r border-[#202020] p-10 lg:flex lg:p-14">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center bg-white text-black">
              <Dumbbell className="size-5" />
            </span>
            <span className="text-sm font-normal tracking-[0.28em] uppercase">
              Flexity
            </span>
          </Link>

          <div className="max-w-xl py-12">
            <p className="text-[10px] font-normal tracking-[0.32em] text-[#7D7D7D] uppercase">
              Performance operating system
            </p>
            <div className="mt-6 h-px w-16 bg-white/25" />
            <p className="mt-6 text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] font-normal uppercase">
              Train in
              <br />
              the dark.
            </p>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#7D7D7D]">
              One workspace for gym administrators, coaches, and clients.
              Sharp routines, precise progress, zero noise.
            </p>
          </div>

          <div className="grid grid-cols-3 border-t border-[#202020] pt-6">
            {HERO_FACTS.map((fact) => (
              <div key={fact.value} className="pr-4">
                <p className="text-[10px] tracking-[0.24em] text-[#7D7D7D] uppercase">
                  {fact.value}
                </p>
                <p className="mt-2 text-xs tracking-[0.08em] text-white uppercase">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-3 lg:hidden"
          >
            <span className="grid size-9 place-items-center bg-white text-black">
              <Dumbbell className="size-4" />
            </span>
            <span className="text-sm font-normal tracking-[0.28em] uppercase">
              Flexity
            </span>
          </Link>

          <div className="w-full max-w-md">
            <div className="border border-[#202020] bg-[#0A0A0A] p-8 sm:p-10">
              <div className="h-0.5 w-14 bg-white/25" />
              <p className="mt-6 text-[10px] tracking-[0.28em] text-[#7D7D7D] uppercase">
                Secure access / 01
              </p>
              <h1 className="mt-3 text-3xl leading-none font-normal uppercase sm:text-4xl">
                Sign in
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#7D7D7D]">
                Access your gym workspace and training data.
              </p>

              {needsSetup && (
                <div className="mt-6 border-l-2 border-white/40 bg-white/5 px-4 py-3 text-sm text-white">
                  No gym administrator exists yet.{" "}
                  <Link to="/setup" className="font-medium underline">
                    Run the one-time setup
                  </Link>
                  .
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className={LABEL_CLASS}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={LABEL_CLASS}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="gymId" className={LABEL_CLASS}>
                    Gym code (optional)
                  </label>
                  <input
                    id="gymId"
                    type="text"
                    autoComplete="off"
                    value={gymId}
                    onChange={(event) => setGymId(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>

                {error && (
                  <p className="border-l-2 border-[#F04438] bg-[#F04438]/10 px-4 py-3 text-sm text-[#FFA198]">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-none border border-transparent bg-[#FFC000] text-xs font-normal tracking-[0.24em] text-black uppercase transition-colors hover:bg-[#917300] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60"
                >
                  {submitting ? "Signing in..." : "Enter workspace"}
                </Button>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-[#7D7D7D] uppercase transition-colors hover:text-white"
              >
                <ArrowRight className="size-3.5 rotate-180" />
                Return to site
              </Link>
              <p className="text-[10px] tracking-[0.18em] text-[#494949] uppercase">
                Encrypted session
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
