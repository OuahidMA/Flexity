/**
 * Coach-facing progress dialog.
 *
 * Loads `/coach/clients/:id/progress` only while the dialog is open. Each row is
 * one exercise log saved by the client, with the per-set reps/time and weight
 * summaries the coach configured in the routine builder.
 */
import {
  buildDailyVolume,
  formatMetricSummary,
  formatProgressDate,
  formatWeightSummary,
} from "@/lib/progress"
import { useApiData } from "@/hooks/useApiData"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/data-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * @param {object} props
 * @param {{ id: string, name?: string, email?: string }|null} props.client
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @returns {JSX.Element} Progress history for one roster client.
 */
export function ClientProgressDialog({ client, open, onOpenChange }) {
  const enabled = Boolean(open && client?.id)
  const path = enabled ? `/coach/clients/${client.id}/progress` : null
  const { data, loading, error, refresh } = useApiData(path, { enabled })

  const logs = data?.logs ?? []
  const totalVolume = logs.reduce((total, log) => total + (log.volume || 0), 0)
  const sessions = new Set(
    logs.map((log) => formatProgressDate(log.date, { year: true }))
  ).size
  const totalSets = logs.reduce((total, log) => total + (log.sets || 0), 0)
  const dailyVolume = buildDailyVolume(logs)
  const dailyPeak = Math.max(...dailyVolume.map((day) => day.volume), 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Progress · {client?.name || "Client"}</DialogTitle>
          <DialogDescription>
            Logged sets from the workouts you assigned
            {client?.email ? ` · ${client.email}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <LoadingState label="Loading progress..." />
          ) : error ? (
            <ErrorState message={error.message} onRetry={refresh} />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No progress logged yet"
              description="This client has not saved a workout. Their sets will appear here as soon as they log one."
            />
          ) : (
            <>
              {/* Compact summary so the coach sees adherence at a glance. */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-hairline bg-canvas px-4 py-3">
                  <p className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                    Sessions
                  </p>
                  <p className="mt-1 text-2xl font-bold">{sessions}</p>
                </div>
                <div className="border border-hairline bg-canvas px-4 py-3">
                  <p className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                    Sets logged
                  </p>
                  <p className="mt-1 text-2xl font-bold">{totalSets}</p>
                </div>
                <div className="border border-hairline bg-canvas px-4 py-3">
                  <p className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                    Volume
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {totalVolume.toLocaleString()} kg
                  </p>
                </div>
              </div>

              {dailyVolume.length > 1 && (
                <div className="flex h-24 items-end gap-2 border border-hairline bg-canvas px-4 py-3">
                  {dailyVolume.map((day) => (
                    <div
                      key={day.date}
                      className="flex h-full flex-1 items-end"
                    >
                      <div
                        className="w-full bg-primary/70"
                        style={{
                          height: `${Math.max(
                            (day.volume / dailyPeak) * 100,
                            2
                          )}%`,
                        }}
                        title={`${formatProgressDate(day.date, {
                          year: true,
                        })} · ${day.volume.toLocaleString()} kg`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto border border-hairline">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Exercise</TableHead>
                      <TableHead>Sets</TableHead>
                      <TableHead>Reps / Time</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatProgressDate(log.date, { year: true })}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold">{log.exerciseName}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.routineName || "—"}
                            {log.dayLabel ? ` · ${log.dayLabel}` : ""}
                          </p>
                        </TableCell>
                        <TableCell>{log.sets}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                          {formatMetricSummary(log)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                          {formatWeightSummary(log)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {(log.volume || 0).toLocaleString()} kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
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
