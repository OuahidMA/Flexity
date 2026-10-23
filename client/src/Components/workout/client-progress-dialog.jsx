/**
 * Coach-facing progress dialog.
 *
 * Wraps the shared `ClientProgressAnalytics` panel, which loads progress only
 * while the dialog is open, renders the Chart.js progression chart, and lists
 * the client's saved history.
 */
import { ClientProgressAnalytics } from "@/components/workout/client-progress-analytics"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * @param {object} props
 * @param {{ id: string, name?: string, email?: string }|null} props.client
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @returns {JSX.Element} Progress analytics for one roster client.
 */
export function ClientProgressDialog({ client, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Progress · {client?.name || "Client"}</DialogTitle>
          <DialogDescription>
            Logged sets and strength progression from the workouts you assigned
            {client?.email ? ` · ${client.email}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <ClientProgressAnalytics
            clientId={client?.id}
            enabled={open}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClientProgressDialog
