/**
 * Create-user dialog shared by gym members, gym coaches, and coach clients.
 *
 * One form adapts to a `mode`: coaches expose a speciality field, clients can
 * optionally be assigned to an existing coach. The parent owns the open state,
 * save status, error text, and the API call, so the same dialog works for every
 * role's endpoint.
 */
import { useState } from "react"

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

const EMPTY = {
  name: "",
  email: "",
  password: "",
  speciality: "",
  coachId: "",
}

/**
 * Inner form, mounted only while the dialog is open so its local state resets
 * every time it is reopened.
 *
 * @param {object} props
 * @param {"client"|"coach"} props.mode - Controls copy and mode-specific fields.
 * @param {Array<{ id: string, name?: string, email?: string }>} props.coaches -
 *   Assignment options shown when creating a client.
 * @param {boolean} props.saving - Disables actions while the request runs.
 * @param {string} props.error - Server/validation error to display.
 * @param {(open: boolean) => void} props.onOpenChange - Dialog visibility setter.
 * @param {(values: object) => void} props.onSubmit - Receives normalized form values.
 * @returns {JSX.Element} The dialog form.
 */
function UserForm({
  mode,
  coaches,
  saving,
  error,
  onOpenChange,
  onSubmit,
}) {
  const [values, setValues] = useState(EMPTY)

  const isCoach = mode === "coach"

  const update = (key) => (event) => {
    const value = event.target.value
    setValues((current) => ({ ...current, [key]: value }))
  }

  // Send only the fields relevant to the current mode; an empty coach selection
  // becomes undefined so the API leaves the client unassigned.
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.({
      name: values.name,
      email: values.email,
      password: values.password,
      ...(isCoach
        ? { speciality: values.speciality }
        : { coachId: values.coachId || undefined }),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isCoach ? "Invite coach" : "Add member"}</DialogTitle>
        <DialogDescription>
          {isCoach
            ? "Create a coach account for your gym. They can sign in and build routines."
            : "Create a client account and optionally assign them to a coach."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="user-name">Full name</Label>
        <Input
          id="user-name"
          value={values.name}
          onChange={update("name")}
          placeholder="Alex Morgan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          value={values.email}
          onChange={update("email")}
          placeholder="alex@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">Temporary password</Label>
        <Input
          id="user-password"
          type="password"
          value={values.password}
          onChange={update("password")}
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
      </div>

      {isCoach ? (
        <div className="space-y-2">
          <Label htmlFor="user-speciality">Speciality</Label>
          <Input
            id="user-speciality"
            value={values.speciality}
            onChange={update("speciality")}
            placeholder="Strength & conditioning"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="user-coach">Coach</Label>
          <select
            id="user-coach"
            value={values.coachId}
            onChange={update("coachId")}
            className="h-10 w-full rounded-none border border-input bg-[#0A0A0A] px-3 text-sm text-white outline-none focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <option value="">Unassigned</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name || coach.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isCoach ? "Create coach" : "Create client"}
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
 * @param {Array<object>} [props.coaches]
 * @param {boolean} [props.saving=false]
 * @param {string} [props.error=""]
 * @param {(values: object) => void} [props.onSubmit]
 * @returns {JSX.Element} The modal dialog.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  mode = "client",
  coaches = [],
  saving = false,
  error = "",
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <UserForm
            key={mode}
            mode={mode}
            coaches={coaches}
            saving={saving}
            error={error}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UserFormDialog
