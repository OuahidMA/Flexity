/**
 * Marketing hero.
 *
 * The supplied centered hero layout, rebuilt in JSX and mapped onto DESIGN.md:
 * sentence-case display type, a single gold accent, 6px buttons and no
 * atmospheric gradient. The ReactBits MagicRings canvas sits behind the copy
 * but is masked away from the centre, so the moving rings only occupy the side
 * rails. The mask narrows on small screens so the effect stays present but
 * stays out of the copy's way.
 */
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import MagicRings from "@/components/MagicRings"
import { Button } from "@/components/ui/button"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { WordRotate } from "@/components/ui/word-rotate"

const CONTENT = {
  headline: {
    line1: "One workspace for",
    line2Prefix: "your",
    rotatingWords: ["whole gym.", "clients.", "trainers."],
  },
  subheadline:
    "Memberships, coaching and client progress in one system. Every role sees exactly what it needs — nothing more, nothing scattered across spreadsheets and group chats.",
  primaryButton: "Get Started",
  secondaryButton: "Explore the platform",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export default function HeroSection() {
  // The app is dark-only, so the rings always use the gold pair.
  const ringColor = "#d4af37"
  const ringColorTwo = "#f3e5ab"

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden border-b border-hairline bg-canvas mb-12 lg:mb-16">
      {/* MagicRings — masked to the side rails at every viewport width. */}
      <div
        className="hero-rings-mask pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <MagicRings
          color={ringColor}
          colorTwo={ringColorTwo}
          theme="dark"
          motion="pulse"
          ringCount={6}
          speed={0.6}
          lineThickness={1.4}
          glow={1.1}
          baseRadius={0.42}
          radiusStep={0.11}
          expansion={0.09}
          taper={1.55}
          rotation={0}
          spin={0}
          tilt={0}
          dispersion={0}
          grain={0}
          opacity={0.7}
          followMouse={false}
          mouseInfluence={0.2}
          hoverScale={1.05}
          hoverIntensity={0.5}
          parallax={0.02}
          clickBurst={false}
          intro
          maxDevicePixelRatio={1.5}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-24 pb-16 text-center sm:pt-28 lg:pt-32 lg:pb-20">
        <motion.div
          className="flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className="display-xxl max-w-4xl text-ink"
          >
            {CONTENT.headline.line1}
            <br />
            {CONTENT.headline.line2Prefix}{" "}
            <WordRotate
              words={CONTENT.headline.rotatingWords}
              className="text-primary"
            />
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="body-lg mt-8 max-w-2xl text-ink-muted"
          >
            {CONTENT.subheadline}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <RainbowButton
              size="lg"
              render={<Link to="/login" />}
              nativeButton={false}
            >
              {CONTENT.primaryButton}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </RainbowButton>
            <Button
              variant="secondary-outline"
              size="lg"
              render={<a href="#features" />}
              nativeButton={false}
            >
              {CONTENT.secondaryButton}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
