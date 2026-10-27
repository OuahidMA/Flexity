import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/faq-1-utils/accordion"
import { SupportContactCard } from "@/components/ui/faq-1-utils/support-contact-card"

const FAQ_ITEMS = [
  {
    value: "getting-started",
    question: "How long does it take to get running?",
    answer:
      "Most gyms are live the same day. Import your member list, invite your coaches and start publishing routines immediately — there is no migration project to schedule.",
  },
  {
    value: "client-access",
    question: "What do my clients need?",
    answer:
      "A phone or a browser. Clients sign in to a workspace built just for them: their assigned workouts, the calendar and their own progress.",
  },
  {
    value: "migration",
    question: "Can I bring my existing members and routines?",
    answer:
      "Yes. Members import from a CSV in a few clicks, and existing exercises and routines can be added to the shared library or mapped across coaches.",
  },
  {
    value: "billing",
    question: "How do subscriptions and billing work?",
    answer:
      "Each location manages its own members, plans and renewals from the admin workspace. You see upcoming renewals and payouts in one rail instead of in a spreadsheet.",
  },
  {
    value: "isolation",
    question: "Is my gym's data isolated?",
    answer:
      "Every gym is a separate tenant. Coaches and clients only ever see the members and routines assigned to them, and nothing crosses between locations.",
  },
  {
    value: "cancellation",
    question: "Can I cancel at any time?",
    answer:
      "Yes. Monthly plans can be cancelled whenever you like and stay active until the end of the period. Annual plans are handled the same way, with no exit fees.",
  },
]

/**
 * Marketing FAQ — centered heading, hairline accordion and a support card
 * whose CTA routes to the pre-built `/contact` page.
 *
 * @returns {JSX.Element} The FAQ section.
 */
export function FAQ() {
  return (
    <section id="faq" className="border-b border-hairline py-24 lg:py-32">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col items-center gap-10 px-6 lg:px-12">
        <div className="flex flex-col gap-2 text-center">
          <p className="eyebrow text-ink-subtle">FAQ</p>
          <h2 className="display-lg mt-5 text-balance text-ink">
            Questions, answered.
          </h2>
          <p className="body-lg mt-2 max-w-xl text-pretty text-ink-muted">
            Everything you need to know about running your gym on Flexity. Still
            curious? We are one message away.
          </p>
        </div>

        <Accordion className="w-full max-w-2xl border-t border-hairline">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <SupportContactCard />
      </div>
    </section>
  )
}

export default FAQ
