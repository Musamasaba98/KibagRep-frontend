import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, format,
} from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalEvent {
  dayOfMonth: number;
  label: string;
  color: "violet" | "green" | "amber";
}

const EVENT_COLOR_CLASSES: Record<CalEvent["color"], string> = {
  violet: "bg-violet-100 text-violet-700",
  green:  "bg-[#dcfce7] text-[#15803d]",
  amber:  "bg-amber-100 text-amber-700",
};

// ─── Static mock events (deterministic by day-of-month) ───────────────────────

const MOCK_EVENT_TEMPLATES: CalEvent[] = [
  { dayOfMonth: 5,  label: "JFW Nakato",   color: "violet" },
  { dayOfMonth: 12, label: "Rep Meeting",  color: "green"  },
  { dayOfMonth: 18, label: "Report Due",   color: "amber"  },
  { dayOfMonth: 24, label: "JFW Ssemanda", color: "violet" },
];

// ─── Calendar cell ────────────────────────────────────────────────────────────

const DayCell = ({
  day,
  currentMonth,
  events,
  isSelected,
  onClick,
}: {
  day: Date;
  currentMonth: Date;
  events: CalEvent[];
  isSelected: boolean;
  onClick: () => void;
}) => {
  const inMonth = isSameMonth(day, currentMonth);
  const today   = isToday(day);

  return (
    <div
      onClick={onClick}
      className={`
        h-14 sm:h-20 p-1.5 border border-gray-100 cursor-pointer
        transition-colors hover:bg-[#f0fdf4]
        ${isSelected && !today ? "ring-2 ring-inset ring-[#16a34a]/40 bg-[#f0fdf4]" : ""}
      `}
    >
      {/* Date number */}
      <div className="flex justify-start mb-1">
        <span
          className={`
            w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
            ${today ? "bg-[#16a34a] text-white" : ""}
            ${!today && inMonth ? "text-[#222f36]" : ""}
            ${!inMonth ? "text-gray-300" : ""}
          `}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Event chips */}
      {inMonth && events.length > 0 && (
        <div className="flex flex-col gap-0.5 overflow-hidden">
          {events.slice(0, 2).map((ev, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate ${EVENT_COLOR_CLASSES[ev.color]}`}
            >
              {ev.label}
            </span>
          ))}
          {events.length > 2 && (
            <span className="text-[9px] text-gray-400 pl-1">+{events.length - 2} more</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ManagerCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);

  const goToPrev  = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNext  = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDay(new Date()); };

  // Build calendar grid: week starts Monday
  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // Mock events — deterministic, only for current month
  const mockEvents = useMemo((): Map<string, CalEvent[]> => {
    const map = new Map<string, CalEvent[]>();
    MOCK_EVENT_TEMPLATES.forEach((ev) => {
      const year  = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = endOfMonth(currentMonth).getDate();
      if (ev.dayOfMonth > daysInMonth) return;
      const d = new Date(year, month, ev.dayOfMonth);
      const key = format(d, "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, ev]);
    });
    return map;
  }, [currentMonth]);

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Calendar</h1>
        <p className="text-gray-400 text-sm mt-0.5">Monthly team scheduling view</p>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-black text-[#222f36]">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] hover:bg-[#dcfce7] rounded-lg border border-[#bbf7d0] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              Today
            </button>
            <button
              onClick={goToPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              aria-label="Previous month"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              aria-label="Next month"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {gridDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const events = mockEvents.get(key) ?? [];
            return (
              <DayCell
                key={key}
                day={day}
                currentMonth={currentMonth}
                events={events}
                isSelected={selectedDay ? isSameDay(day, selectedDay) : false}
                onClick={() => setSelectedDay((prev) => prev && isSameDay(prev, day) ? null : day)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Legend</span>
          <span className="flex items-center gap-1.5 text-[11px] text-violet-700">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            JFW
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#15803d]">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            Meeting
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Deadline
          </span>
        </div>
      </div>
    </div>
  );
};

export default ManagerCalendar;
