/**
 * Client-facing workout calendar (FullCalendar month demo, React/JSX).
 *
 * This mirrors the upstream Monarch month demo: month, week, and list views
 * share one toolbar, with the month grid as the initial view. Only split labels
 * are rendered here: workout days show the split part ("Push", "Lower",
 * "Full Body", ...) and coach-designated recovery days show "Rest". Exercise
 * lists stay on the coach's builder and in the routine detail below.
 *
 * Events repeat weekly via FullCalendar's `daysOfWeek` recurrence, so a routine
 * authored for a full week or for a single day stays visible every week.
 *
 * The upstream demo's "Add Event" toolbar action is intentionally omitted:
 * clients cannot create calendar events, and workout logging lives on the
 * Progress page.
 */
import { useMemo } from "react"
import { Calendar } from "@fullcalendar/react"
import themePlugin from "@fullcalendar/react/themes/monarch"
import dayGridPlugin from "@fullcalendar/react/daygrid"
import listPlugin from "@fullcalendar/react/list"

import "@fullcalendar/react/skeleton.css"
import "@fullcalendar/react/themes/monarch/theme.css"
import "@/styles/fullcalendar-palette.css"

/**
 * @param {object} info - FullCalendar event render info.
 * @returns {JSX.Element} Compact split label, plus the routine name outside the
 * month grid where there is room for a second line.
 */
function renderEventContent(info) {
  const { isRest, label, routineName } = info.event.extendedProps
  const isMonthGrid = info.view.type === "dayGridMonth"

  return (
    <div className={`fc-workout-event${isRest ? " is-rest" : ""}`}>
      <span className="fc-workout-event-label">
        {isRest ? "Rest" : label}
      </span>
      {!isMonthGrid && (
        <span className="fc-workout-event-routine">{routineName}</span>
      )}
    </div>
  )
}

/**
 * Converts assigned routines into recurring FullCalendar events.
 *
 * Older routines without a `days` schedule are skipped; they still appear in
 * the routine list and exercise-order section on the dashboard.
 *
 * @param {Array<object>} routines - `/client/workouts` payload.
 * @returns {Array<object>} FullCalendar event inputs.
 */
function buildEvents(routines) {
  return routines.flatMap((routine) =>
    (routine.days ?? []).map((day) => ({
      id: `${routine.id}-${day.dayOfWeek}`,
      title: day.isRest ? "Rest" : day.label,
      daysOfWeek: [day.dayOfWeek],
      allDay: true,
      display: "block",
      // FullCalendar's monarch theme paints its own harness, so the tint lives
      // in the palette stylesheet (`[style*="--fc-event-color"]`). `is-rest`
      // selects the neutral rest-day treatment.
      classNames: day.isRest ? ["is-rest"] : [],
      extendedProps: {
        isRest: Boolean(day.isRest),
        label: day.label || (day.isRest ? "Rest" : "Workout"),
        routineName: routine.name,
        splitType: routine.splitType,
      },
    }))
  )
}

/**
 * @param {object} props
 * @param {Array<object>} props.routines - Assigned routines with `days`.
 * @returns {JSX.Element} FullCalendar month/week/list views.
 */
export function WorkoutCalendar({ routines }) {
  const events = useMemo(() => buildEvents(routines ?? []), [routines])

  return (
    <div className="flexity-calendar">
      <Calendar
        plugins={[themePlugin, dayGridPlugin, listPlugin]}
        headerToolbar={{
          start: "today prev,next title",
          end: "dayGridMonth,dayGridWeek,listWeek",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          list: "List",
        }}
        initialView="dayGridMonth"
        firstDay={1}
        height="auto"
        events={events}
        eventContent={renderEventContent}
        dayMaxEvents
        noEventsText="No scheduled sessions yet"
      />
    </div>
  )
}

export default WorkoutCalendar
