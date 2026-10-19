/**
 * Public marketing landing page.
 *
 * Sections are driven by the local FEATURES/PLANS arrays: hero (animated
 * background + dashboard preview), features, and pricing. Already-authenticated
 * visitors are redirected to their dashboard instead of seeing the marketing
 * page again.
 */
import { Link, Navigate } from "react-router-dom";
import { ArrowUpRight, CalendarCheck, LineChart, Users } from "lucide-react";

import DitherSweepNavbar from "@/components/ui/dither-sweep-navbar";
import PatternWavesBackground from "@/components/ui/PatternWavesBackground";
import HeroDashboard from "@/components/ui/hero-dashboard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Smart programming",
    description:
      "Build routines, schedule sessions and keep every client on track with plans that adapt to their progress.",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    description:
      "Log every session and turn raw numbers into clear trends so nobody trains blind.",
  },
  {
    icon: Users,
    title: "Teams that scale",
    description:
      "Manage coaches, members and subscriptions from a single dashboard built for growing gyms.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    description: "For solo trainers getting organised.",
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$29",
    description: "For growing gyms and coaching teams.",
    cta: "Get started",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-location operations.",
    cta: "Contact us",
  },
];

/**
 * @returns {JSX.Element} Landing page, or a redirect for signed-in users.
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for `/auth/me` before deciding; `/dashboard` then resolves the correct
  // role-specific home via RoleHomeRedirect.
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <DitherSweepNavbar
        brand="Flexity"
        logoHref="/"
        items={NAV_ITEMS}
        cta={{ label: "Get started", href: "/login" }}
        ink="#FFFFFF"
        paper="#000000"
        rule="#202020"
        accent="#FFC000"
        fill="#FFC000"
      />

      <main className="flex-1 pt-24">
        <section className="relative min-h-screen w-full overflow-hidden bg-black">
          <div className="absolute inset-0">
            <PatternWavesBackground
              preset="silk"
              color="#FFC000"
              backgroundColor="#000000"
              fade="edges"
              interactive={false}
              pattern="dot"
              wave="silk"
              spacing={9}
              markSize={0.95}
              depth={0.95}
              light={0}
              shine={0.8}
              contrast={1.2}
              speed={0.35}
              scale={1}
              direction={20}
              opacity={1}
              fadeSize={0.5}
              characters=".:-=+*#%@"
              intro
              paused={false}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-16 pb-10 lg:px-12 lg:pt-24">
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight uppercase sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-[#7D7D7D]">A new era of </span>
              <span className="block text-[#FFC000]">{"coaching\nhas arrived"}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#7D7D7D] sm:text-lg">
              Flexity brings programming, coaching and progress tracking together in one
              platform so you and your clients always know the next move.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                render={<Link to="/login" />}
                nativeButton={false}
                className="h-11 rounded-none px-6 text-xs font-semibold tracking-[0.15em] text-black uppercase"
                style={{ backgroundColor: "#FFC000" }}
              >
                Start free
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                render={<a href="#features" />}
                nativeButton={false}
                className="h-11 rounded-none px-6 text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ color: "#FFFFFF" }}
              >
                See features
              </Button>
            </div>
          </div>

          <HeroDashboard />
        </section>

        {/* Feature grid */}
        <section
          id="features"
          className="border-t border-[#202020] bg-black px-6 py-24 lg:px-12"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-[#7D7D7D] uppercase">
              Features
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-[#202020] bg-[#202020] md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-black p-8">
                  <span
                    className="grid size-10 place-items-center"
                    style={{ backgroundColor: "#FFC000", color: "#000000" }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#7D7D7D]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section
          id="pricing"
          className="border-t border-[#202020] px-6 py-24 lg:px-12"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-[#7D7D7D] uppercase">
              Pricing
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="flex flex-col border border-[#202020] p-8"
                >
                  <span className="text-sm font-semibold tracking-[0.15em] text-[#7D7D7D] uppercase">
                    {plan.name}
                  </span>
                  <span className="mt-4 text-4xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[#7D7D7D]">
                    {plan.description}
                  </p>
                  <Button
                    render={<Link to="/login" />}
                    nativeButton={false}
                    variant={plan.name === "Pro" ? "default" : "ghost"}
                    className="mt-8 h-11 rounded-none px-5 text-xs font-semibold tracking-[0.15em] uppercase"
                    style={
                      plan.name === "Pro"
                        ? { backgroundColor: "#FFC000", color: "#000000" }
                        : { color: "#FFFFFF" }
                    }
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
