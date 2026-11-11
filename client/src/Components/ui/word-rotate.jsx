import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * WordRotate — MagicUI's vertical word rotation, adapted for inline use inside a
 * heading.
 *
 * The wrapper sizes itself to the word currently on screen, so short words like
 * "clients" do not leave the trailing space the longest word would need. The
 * rotation animation is the installed default, tuned to the heading's type size
 * so long words are clipped behind the wrapper instead of overlapping the line
 * above.
 *
 * @param {object} props
 * @param {string[]} props.words - Words to rotate through.
 * @param {number} [props.duration=2500] - Milliseconds each word stays visible.
 * @param {object} [props.motionProps] - Motion overrides for the word itself.
 * @param {string} [props.className] - Classes applied to each rotating word.
 * @returns {JSX.Element} The rotating word.
 */
export function WordRotate({
  words,
  duration = 2500,

  motionProps = {
    initial: { opacity: 0, y: "-0.7em" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "0.7em" },
    transition: { duration: 0.35, ease: "easeOut" },
  },

  className,
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [words.length, duration])

  return (
    // The vertical padding gives descenders (the `g`/`y` in "whole gym") room
    // inside the clipping box; the matching negative margins keep the line box
    // height and baseline exactly as before.
    <span className="relative -my-[0.15em] inline-block overflow-hidden py-[0.15em] align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          className={cn("inline-block whitespace-nowrap", className)}
          {...motionProps}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
