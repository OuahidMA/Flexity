/**
 * Create-user dialog shared by gym members and gym coaches.
 *
 * The admin enters only a name, generates a one-time setup PIN, then creates the
 * account. The member redeems the PIN on the account page and chooses their own
 * email/password. Coach assignment remains a coach-side action, never an admin
 * one. The parent owns the open state, save status, error text, and the API
 * calls so the same dialog works for both roles' endpoints.
 */
import { useState } from "react"
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react"

import { formatPin } from "@/lib/pins"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Inner form, mounted only while the dialog is open so its local state resets
 * every time it is reopened.
 *
 * @param {object} props
 * @param {"client"|"coach"} props.mode - Controls copy and submit label.
 * @param {boolean} props.saving - Disables actions while the create request runs.
 * @param {string} props.error - Server/validation error to display.
 * @param {(open: boolean) => void} props.onOpenChange - Dialog visibility setter.
 * @param {() => Promise<string>} props.onGeneratePin - Requests a fresh PIN.
 * @param {(values: {name: string, pin: string}) => void} props.onSubmit
 * @returns {JSX.Element} The dialog form.
 */
function UserForm({
  mode,
  saving,
  error,
  onOpenChange,
  onGeneratePin,
  onSubmit,
}) {
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")
  const [generating, setGenerating] = useState(false)
  const [pinError, setPinError] = useState("")
  const [copied, setCopied] = useState(false)

  const isCoach = mode === "coach"

  async function handleGeneratePin() {
    setGenerating(true)
    setPinError("")
    setCopied(false)

    try {
      const nextPin = await onGeneratePin()
      setPin(nextPin)
    } catch (generateError) {
      setPinError(generateError.message ?? "Unable to generate a PIN.")
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(pin)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; the PIN stays visible to copy manually.
    }
  }

  // Send only the fields the API needs. Clients are always created unassigned;
  // a coach claims them from their own dashboard.
  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim() || !pin) return

    onSubmit?.({ name: name.trim(), pin })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {isCoach ? "Invite coach" : "Add member"}
        </DialogTitle>
        <DialogDescription>
          {isCoach
            ? "Create a coach account with a one-time PIN. They choose their own email and password when they first sign in."
            : "Create a client account with a one-time PIN. They choose their own email and password when they first sign in."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="user-name">Full name</Label>
        <Input
          id="user-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Alex Morgan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Setup PIN</Label>

        {pin ? (
          <div className="border border-hairline bg-surface-1 p-4">
            <p className="font-mono text-2xl font-bold tracking-[0.24em] text-ink">
              {formatPin(pin)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Share this PIN with {name.trim() || "the member"}. It is deleted
              from their account as soon as they finish setup.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy PIN"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleGeneratePin}
                disabled={generating || saving}
              >
                <RefreshCw
                  className={`size-3.5 ${generating ? "animate-spin" : ""}`}
                />
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-hairline bg-surface-1 p-4">
            <p className="text-sm text-muted-foreground">
              Generate a PIN before creating the account. It is shown here so you
              can hand it to the member.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 gap-2"
              onClick={handleGeneratePin}
              disabled={generating || saving}
            >
              <KeyRound className="size-4" />
              {generating ? "Generating..." : "Generate PIN"}
            </Button>
          </div>
        )}

        {pinError && (
          <p className="text-sm text-destructive">{pinError}</p>
        )}
      </div>

      {error && (
        <p className="rounded-xs border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || generating || !pin || !name.trim()}
        >
          {saving ? "Saving..." : isCoach ? "Create coach" : "Add member"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Controlled wrapper around `UserForm`.
 *
 * `key={mode}` remounts the form when switching between client/coach modes so
 * stale values from the other mode never leak into the next submission.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is visible.
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {"client"|"coach"} [props.mode="client"]
 * @param {boolean} [props.saving=false]
 * @param {string} [props.error=""]
 * @param {() => Promise<string>} [props.onGeneratePin]
 * @param {(values: object) => void} [props.onSubmit]
 * @returns {JSX.Element} The modal dialog.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  mode = "client",
  saving = false,
  error = "",
  onGeneratePin,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <UserForm
            key={mode}
            mode={mode}
            saving={saving}
            error={error}
            onOpenChange={onOpenChange}
            onGeneratePin={onGeneratePin}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UserFormDialog
