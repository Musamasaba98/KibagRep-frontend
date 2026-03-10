import { useState, useMemo, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  isAfter,
} from "date-fns";
import {
  MdChevronLeft,
  MdChevronRight,
  MdCalendarToday,
} from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { FaUserDoctor } from "react-icons/fa6";
import { getActivityHistoryApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalActivity {
  id: string;
  date: string;
  doctor: { id: string; doctor_name: string; town?: string };
  focused_product?: { id: string; product_name: string };
  outcome?: string;
  samples_given?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Event colour — extend as more types (NCA, leave) arrive
const eventStyle = () => ({
  bg: "bg-[#dcfce7]",
  text: "text-[#15803d]",
  dot: "bg-[#16a34a]",
});

// ─── Day cell ─────────────────────────────────────────────────────────────────

const DayCell = ({
  day,
  inMonth,
  dayActivities,
  selected,
  onClick,
}: {
  day: Date;
  inMonth: boolean;
  dayActivities: CalActivity[];
  selected: boolean;
  onClick: () => void;
}) => {
  const today = isToday(day);
  const visible = dayActivities.slice(0, 3);
  const overflow = dayActivities.length - visible.length;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col p-1.5 cursor-pointer border border-transparent hover:border-[#16a34a]/20 hover:bg-green-50/30 transition-colors ${
        selected ? "bg-green-50 border-[#16a34a]/30 rounded-lg" : ""
      } ${!inMonth ? "opacity-35" : ""}`}
    >
      {/* Date number */}
      <div className="flex justify-end mb-1">
        <span
          className={`w-6 h-6 text-xs font-bold flex items-center justify-center rounded-full leading-none ${
            today
              ? "bg-[#16a34a] text-white"
              : selected
              ? "text-[#16a34a] font-extrabold"
              : "text-[#222f36]"
          }`}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Activity pills */}
      <div className="flex flex-col gap-0.5 flex-1">
        {visible.map((a) => {
          const s = eventStyle();
          return (
            <div
              key={a.id}
              className={`flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[10px] font-semibold truncate ${s.bg} ${s.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
              <span className="truncate">{a.doctor?.doctor_name ?? "Visit"}</span>
            </div>
          );
        })}
        {overflow > 0 && (
          <p className="text-[10px] text-gray-400 font-semibold px-1.5">
            +{overflow} more
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Side panel ───────────────────────────────────────────────────────────────

const DayPanel = ({
  day,
  activities,
  loading,
}: {
  day: Date | null;
  activities: CalActivity[];
  loading: boolean;
}) => {
  const isTodays = day ? isToday(day) : false;
  const isFuture = day ? isAfter(startOfDay(day), startOfDay(new Date())) : false;

  return (
    <div className="w-[270px] shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_20px_0_rgba(0,0,0,0.08)] bg-white">
      {/* Header */}
      <div
        className={`px-5 py-5 ${
          isTodays
            ? "bg-[#16a34a]"
            : "bg-[#1a2530]"
        }`}
      >
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">
          {day ? format(day, "EEEE") : "No day selected"}
        </p>
        <p className="text-white text-3xl font-black leading-none">
          {day ? format(day, "d") : "—"}
        </p>
        <p className="text-white/70 text-xs font-medium mt-0.5">
          {day ? format(day, "MMMM yyyy") : ""}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isTodays
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/80"
            }`}
          >
            {activities.length === 0
              ? "No visits"
              : `${activities.length} visit${activities.length > 1 ? "s" : ""}`}
          </span>
          {isTodays && (
            <span className="text-[10px] font-bold text-white/70 bg-white/15 px-2 py-1 rounded-full">
              TODAY
            </span>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            {isFuture ? (
              <>
                <MdCalendarToday className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-medium">Not yet reached</p>
                <p className="text-[11px] text-gray-300 mt-1">Cycle visits will appear here</p>
              </>
            ) : (
              <>
                <FiActivity className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-medium">No activity logged</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {activities.map((a, i) => (
              <div
                key={a.id}
                className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                {/* Number bubble */}
                <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#16a34a] text-[9px] font-bold">{i + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#222f36] truncate leading-tight">
                    {a.doctor?.doctor_name ?? "Unknown"}
                  </p>
                  {a.doctor?.town && (
                    <p className="text-[10px] text-gray-400 truncate">{a.doctor.town}</p>
                  )}
                  {a.focused_product && (
                    <span className="inline-block mt-1 text-[9px] font-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-md truncate max-w-full">
                      ★ {a.focused_product.product_name}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-gray-300 font-mono">
                      {format(new Date(a.date), "HH:mm")}
                    </span>
                    {(a.samples_given ?? 0) > 0 && (
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        {a.samples_given} samples
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Calendar page ───────────────────────────────────────────────────────

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState<CalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Fetch last 90 days of activity on mount
  useEffect(() => {
    getActivityHistoryApi({ days: 90, limit: 1000 })
      .then((res) => setActivities(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by "yyyy-MM-dd"
  const byDay = useMemo(() => {
    const map: Record<string, CalActivity[]> = {};
    for (const a of activities) {
      const key = format(new Date(a.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [activities]);

  // Calendar grid — full weeks covering the month
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Month summary
  const monthVisits = useMemo(
    () =>
      activities.filter((a) => isSameMonth(new Date(a.date), currentMonth))
        .length,
    [activities, currentMonth]
  );

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedActivities = byDay[selectedKey] ?? [];

  return (
    <div className="flex gap-5" style={{ height: "calc(100vh - 130px)" }}>

      {/* ── Calendar grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[#222f36] tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h1>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                <MdChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                <MdChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDay(new Date());
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              Today
            </button>
          </div>

          {/* Month stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] bg-[#dcfce7] px-3 py-1.5 rounded-full">
              <FaUserDoctor className="w-3.5 h-3.5" />
              {monthVisits} visits this month
            </div>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 shrink-0 mb-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(6,1fr)] gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
          {calDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            return (
              <DayCell
                key={key}
                day={day}
                inMonth={isSameMonth(day, currentMonth)}
                dayActivities={byDay[key] ?? []}
                selected={isSameDay(day, selectedDay)}
                onClick={() => setSelectedDay(day)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
            <span className="text-[11px] text-gray-400 font-medium">Doctor visit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[11px] text-gray-400 font-medium">Unplanned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-[11px] text-gray-400 font-medium">NCA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      <DayPanel day={selectedDay} activities={selectedActivities} loading={loading} />
    </div>
  );
};

export default Calendar;
