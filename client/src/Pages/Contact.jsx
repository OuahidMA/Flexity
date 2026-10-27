/**
 * Contact — talk to the Flexity team.
 *
 * A single marketing page in the DESIGN.md system: soft canvas, hairline form
 * card, caption copy and the one gold action. The form has no backend, so a
 * submit composes a pre-filled message in the visitor's mail client via
 * `mailto:` and then points at the direct address as a fallback.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Send } from "lucide-react"

import Footer from "@/components/Footer"
import FloatingHeader from "@/components/ui/floating-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Replace with the address that should receive enquiries. */
const CONTACT_EMAIL = "hello@flexity.app"

const EMPTY_FORM = { name: "", email: "", gym: "", message: "" }

const FIELDS = [
  { id: "name", label: "Your name", type: "text", placeholder: "Alex Moreau" },
  {
    id: "email",
    label: "Work email",
    type: "email",
    placeholder: "alex@yourgym.com",
  },
  {
    id: "gym",
    label: "Gym or studio",
    type: "text",
    placeholder: "How many locations?",
  },
]

/**
 * @returns {JSX.Element} The contact page.
 */
export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM)

  /**
   * @param {keyof typeof EMPTY_FORM} field - Field to update.
   * @returns {(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}
   *   Change handler for that field.
   */
  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  /**
   * Composes the enquiry into the visitor's mail client — there is no server
   * endpoint behind this form.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Submit event.
   */
  const handleSubmit = (event) => {
    event.preventDefault()

    const subject = `Flexity enquiry from ${form.name || "a gym"}`
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Gym: ${form.gym || "—"}`,
      "",
      form.message,
    ].join("\n")

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas text-ink">
      <FloatingHeader />

      <main className="flex-1 pt-28">
        <section className="border-b border-hairline py-16 lg:py-24">
          <div className="mx-auto max-w-[80rem] px-6 lg:px-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 caption text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Link>

            <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
              <div className="max-w-xl">
                <p className="eyebrow text-ink-subtle">Contact</p>
                <h1 className="display-lg mt-5 text-ink">
                  Talk to us about your gym.
                </h1>
                <p className="body-lg mt-5 text-ink-muted">
                  Tell us how many locations, coaches and members you run and
                  we will come back with a concrete plan — usually within one
                  business day.
                </p>

                <div className="mt-10 border-t border-hairline pt-8">
                  <p className="eyebrow text-ink-subtle">Prefer email</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-3 inline-flex items-center gap-2 cap-label text-ink no-underline transition-colors hover:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="caption mt-4 text-ink-subtle">
                    Already have a workspace?{" "}
                    <Link
                      to="/login"
                      className="text-ink no-underline transition-colors hover:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      Sign in
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-hairline bg-surface-1 p-8 shadow-[var(--shadow-level-1)]"
              >
                <div className="flex flex-col gap-5">
                  {FIELDS.map((field) => (
                    <div key={field.id} className="flex flex-col gap-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.id]}
                        onChange={updateField(field.id)}
                        required={field.id !== "gym"}
                      />
                    </div>
                  ))}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="message">What do you need?</Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={updateField("message")}
                      placeholder="Locations, team size, and anything you want to replace."
                      className="min-h-32 w-full rounded-sm border border-hairline bg-surface-1 px-3 py-2 text-base text-ink transition-colors outline-none placeholder:text-ink-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="mt-6 w-full">
                  Send enquiry
                  <Send className="size-4" aria-hidden="true" />
                </Button>

                <p className="caption mt-4 text-ink-subtle">
                  Sending opens your mail app with the message ready to go.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
