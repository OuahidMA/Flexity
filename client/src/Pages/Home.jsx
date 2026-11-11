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
import { ArrowUpRight } from "lucide-react"

import FeaturesSection from "@/components/FeaturesSection"
import Footer from "@/components/Footer"
import HeroSection from "@/components/HeroSection"
import PricingSection from "@/components/PricingSection"
import FAQ from "@/components/ui/faq-1"
import FloatingHeader from "@/components/ui/floating-header"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { Ripple } from "@/components/ripple"
import { useAuth } from "@/hooks/useAuth"
import { getRoleHome } from "@/lib/roles"

export default function Home() {
  const { isAuthenticated, loading, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getRoleHome(role), { replace: true })
    }
  }, [navigate, isAuthenticated, loading, role])

  // Measure the fixed marketing header so every full-screen section can pad its
  // top by `--header-height`, keeping section content just below the header.
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      const header = document.querySelector("header")
      if (header) {
        root.style.setProperty("--header-height", `${header.offsetHeight}px`)
      }
    }
    update()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas text-primary">
        <Ripple className="size-14" />
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

        {/* Pricing — three tiers with a billing toggle over a particle field. */}
        <PricingSection />

        {/* FAQ — centered heading, hairline accordion and support CTA. */}
        <FAQ />

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

            <RainbowButton
              size="lg"
              render={<Link to="/login" />}
              nativeButton={false}
              className="self-start"
            >
              Get started
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </RainbowButton>
          </div>
        </section>
      </main>

      <Footer compact />
    </div>
  )
}
