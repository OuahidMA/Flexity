/**
 * Marketing landing page.
 *
 * Built to DESIGN.md: structured surface panels separated by 1px hairlines,
 * sentence-case display type and the single gold accent reserved for actions
 * and highlights. Every surface is a semantic token, so the page reads as a
 * crisp white SaaS site in light mode and a charcoal product surface in dark
 * mode. No gradients, no pill buttons, no uppercase tracking.
 */
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowUpRight, Plus } from "lucide-react"

import FeaturesSection from "@/components/FeaturesSection"
import Footer from "@/components/Footer"
import HeroSection from "@/components/HeroSection"
import PricingSection from "@/components/PricingSection"
import FloatingHeader from "@/components/ui/floating-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getRoleHome } from "@/lib/roles"

const FAQS = [
  {
    question: "How long does it take to get running?",
    answer:
      "Most gyms are live the same day. Import your member list, invite your coaches and start publishing routines immediately — there is no migration project to schedule.",
  },
  {
    question: "What do my clients need?",
    answer:
      "A phone or a browser. Clients sign in to a workspace built just for them: their assigned workouts, the calendar and their own progress. No downloads, no training.",
  },
  {
    question: "Can I bring my existing members and routines?",
    answer:
      "Yes. Members import from a CSV in a few clicks, and existing exercises and routines can be added to the shared library or mapped across coaches.",
  },
  {
    question: "How do subscriptions and billing work?",
    answer:
      "Each location manages its own members, plans and renewals from the admin workspace. You see upcoming renewals and payouts in one rail instead of in a spreadsheet.",
  },
  {
    question: "Is my gym's data isolated?",
    answer:
      "Every gym is a separate tenant. Coaches and clients only ever see the members and routines assigned to them, and nothing crosses between locations.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Monthly plans can be cancelled whenever you like and stay active until the end of the period. Annual plans are handled the same way, with no exit fees.",
  },
]

export default function Home() {
  const { isAuthenticated, loading, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getRoleHome(role), { replace: true })
    }
  }, [navigate, isAuthenticated, loading, role])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas text-ink-muted">
        <span className="eyebrow">Loading</span>
      </div>
    )
  }

  return (
    <div id="top" className="flex min-h-svh flex-col bg-canvas text-ink">
      <FloatingHeader />

      <main className="flex-1">
        {/* Hero — centered type with the ring background on the side rails. */}
        <HeroSection />

        {/* Features — full-width app screen followed by six capability cards. */}
        <FeaturesSection />

        {/* Pricing — membership levels with one inverted featured tier. */}
        <PricingSection />

        {/* FAQ — a hairline-divided accordion. */}
        <section id="faq" className="border-b border-hairline py-24 lg:py-32">
          <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
              <div>
                <p className="eyebrow text-ink-subtle">FAQ</p>
                <h2 className="display-lg mt-5 text-ink">
                  Questions, answered.
                </h2>
                <p className="body-lg mt-5 text-ink-muted">
                  Still unsure? Open a workspace and find out for yourself.
                </p>
              </div>

              <div className="rounded-lg border border-hairline bg-surface-1 px-6 shadow-[var(--shadow-level-1)]">
                {FAQS.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-b border-hairline last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 display-sm text-ink transition-colors hover:text-ink-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                      <span>{faq.question}</span>
                      <Plus
                        className="size-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="body-md max-w-2xl pb-7 text-ink-muted">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing band — a raised panel with the last gold action. */}
        <section className="border-b border-hairline bg-canvas-soft px-6 py-20 text-ink lg:px-12 lg:py-28">
          <div className="mx-auto flex max-w-[72rem] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-ink-subtle">Get started</p>
              <h2 className="display-lg mt-5 text-ink">
                Run your gym without the friction
              </h2>
              <p className="body-lg mt-5 text-ink-muted">
                One workspace for administrators, coaches and clients. Start with
                your team and scale from there.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              render={<Link to="/login" />}
              nativeButton={false}
              className="self-start"
            >
              Get started
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
