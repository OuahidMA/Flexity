import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Closing card under the FAQ.
 *
 * The "Get in touch" action routes to the existing marketing contact page.
 *
 * @returns {JSX.Element} The support contact card.
 */
export function SupportContactCard() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border border-hairline bg-surface-1 p-8 text-center shadow-[var(--shadow-level-1)] opacity-70 transition-opacity duration-200 hover:opacity-100 sm:p-10">
      <div className="flex flex-col items-center gap-3">
        <p className="display-sm text-ink">Still have questions?</p>
        <p className="body-md max-w-md text-pretty text-ink-muted">
          Can&apos;t find what you&apos;re looking for? Our team can help.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        render={<Link to="/contact" />}
        nativeButton={false}
      >
        Get in touch
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
