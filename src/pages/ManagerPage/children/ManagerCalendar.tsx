import { useState, useMemo, useEffect } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, format,
} from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getCompanyReportsApi, getJfwReportsApi } from "../../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  label: string;
  color: "violet" | "green" | "amber";
}

const EVENT_COLOR_CLASSES: Record<CalEvent["color"], string> = {
  violet: "bg-violet-100 text-violet-700",
  green:  "bg-[#dcfce7] text-[#15803d]",
  amber:  "bg-amber-100 text-amber-700",
};

// ─── Calendar cell ─────────────────────────────────────────────────────────────

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
        hover:bg-[#f0fdf4]
        ${isSelected && !today ? "ring-2 ring-inset ring-[#16a34a]/40 bg-[#f0fdf4]" : ""}
      `}
      style={{ transition: "background-color 0.15s" }}
    >
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

// ─── Main component ────────────────────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ManagerCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [calEvents, setCalEvents]       = useState<Map<string, CalEvent[]>>(new Map());
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getCompanyReportsApi("days=60"),
      getJfwReportsApi(),
    ]).then(([reportsRes, jfwRes]) => {
      const map = new Map<string, CalEvent[]>();

      const push = (dateStr: string, ev: CalEvent) => {
        try {
          const key = format(new Date(dateStr), "yyyy-MM-dd");
          const existing = map.get(key) ?? [];
          map.set(key, [...existing, ev]);
        } catch {
          // skip invalid dates
        }
      };

      if (reportsRes.status === "fulfilled") {
        const reports: any[] = reportsRes.value.data?.data ?? [];
        reports.forEach((r) => {
          const firstName = r.user?.firstname ?? "";
          const color: CalEvent["color"] =
            r.status === "APPROVED" ? "green" :
            r.status === "REJECTED" ? "amber" :
            "amber";
          push(r.report_date, {
            label: `${firstName} report`,
            color,
          });
        });
      }

      if (jfwRes.status === "fulfilled") {
        const jfwReports: any[] = jfwRes.value.data?.data ?? [];
        jfwReports.forEach((r) => {
          const firstName = r.user?.firstname ?? "JFW";
          push(r.report_date, {
            label: `JFW ${firstName}`,
            color: "violet",
          });
        });
      }

      setCalEvents(map);
    }).finally(() => setLoadingEvents(false));
  }, []);

  const goToPrev  = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNext  = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDay(new Date()); };

  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Calendar</h1>
        <p className="text-gray-400 text-sm mt-0.5">Report activity and JFW schedule</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-[#222f36]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {loadingEvents && (
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] hover:bg-[#dcfce7] rounded-lg border border-[#bbf7d0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              Today
            </button>
            <button
              onClick={goToPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
              aria-label="Previous month"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
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
            const events = calEvents.get(key) ?? [];
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
            Report Approved
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Report Pending / Rejected
          </span>
        </div>
      </div>
    </div>
  );
};

export default ManagerCalendar;
