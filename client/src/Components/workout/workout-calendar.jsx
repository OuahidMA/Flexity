/**
 * Client-facing weekly workout calendar (FullCalendar, week demo).
 *
 * Only split labels are rendered here: workout days show the split part
 * ("Push", "Lower", "Full Body", ...) and coach-designated recovery days show
 * "Rest". Exercise lists stay on the coach's builder and in the routine detail
 * below the calendar.
 *
 * Events repeat weekly via FullCalendar's `daysOfWeek` recurrence, so a routine
 * authored for a full week or for a single day stays visible every week.
 */
import { useMemo } from "react"
import { Calendar } from "@fullcalendar/react"
import themePlugin from "@fullcalendar/react/themes/monarch"
import timeGridPlugin from "@fullcalendar/react/timegrid"
import listPlugin from "@fullcalendar/react/list"

import "@fullcalendar/react/skeleton.css"
import "@fullcalendar/react/themes/monarch/theme.css"
import "@/styles/fullcalendar-palette.css"

/**
 * @param {object} info - FullCalendar event render info.
 * @returns {JSX.Element} Compact split label plus the source routine name.
 */
function renderEventContent(info) {
  const { isRest, label, routineName } = info.event.extendedProps

  return (
    <div className={`fc-workout-event${isRest ? " is-rest" : ""}`}>
      <span className="fc-workout-event-label">
        {isRest ? "Rest" : label}
      </span>
      <span className="fc-workout-event-routine">{routineName}</span>
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
      backgroundColor: day.isRest ? "#111111" : "#ffed00",
      borderColor: day.isRest ? "#3a3a3a" : "#ffed00",
      textColor: day.isRest ? "#8a8a8a" : "#000000",
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
 * @returns {JSX.Element} FullCalendar week/day/list views.
 */
export function WorkoutCalendar({ routines }) {
  const events = useMemo(() => buildEvents(routines ?? []), [routines])

  return (
    <div className="flexity-calendar">
      <Calendar
        plugins={[themePlugin, timeGridPlugin, listPlugin]}
        headerToolbar={{
          start: "today prev,next title",
          end: "timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "Today",
          week: "Week",
          day: "Day",
          list: "List",
        }}
        initialView="timeGridWeek"
        firstDay={1}
        height="auto"
        expandRows
        nowIndicator
        allDaySlot
        slotMinTime="05:00:00"
        slotMaxTime="23:00:00"
        slotDuration="01:00:00"
        slotLabelInterval="01:00"
        events={events}
        eventContent={renderEventContent}
        dayMaxEvents
        noEventsText="No scheduled sessions yet"
      />
    </div>
  )
}

export default WorkoutCalendar
