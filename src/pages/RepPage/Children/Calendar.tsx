import { useState, useMemo, useEffect } from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, startOfDay, isAfter,
} from "date-fns";
import { MdChevronLeft, MdChevronRight, MdCalendarToday, MdClose } from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { FaUserDoctor } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { getActivityHistoryApi, getPharmacyActivityHistoryApi } from "../../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CalActivity {
  id: string;
  date: string;
  type: "doctor" | "pharmacy";
  doctor?: { id: string; doctor_name: string; town?: string };
  pharmacy?: { id: string; pharmacy_name: string; town?: string };
  focused_product?: { id: string; product_name: string };
  outcome?: string;
  samples_given?: number;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Day cell ──────────────────────────────────────────────────────────────────

const DayCell = ({
  day, inMonth, dayActivities, selected, onClick,
}: {
  day: Date; inMonth: boolean; dayActivities: CalActivity[];
  selected: boolean; onClick: () => void;
}) => {
  const today = isToday(day);
  const doctorCount = dayActivities.filter((a) => a.type === "doctor").length;
  const pharmCount  = dayActivities.filter((a) => a.type === "pharmacy").length;
  const count = dayActivities.length;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col p-1 sm:p-1.5 cursor-pointer border border-transparent hover:border-[#16a34a]/20 hover:bg-green-50/30 min-h-[44px] sm:min-h-[68px] ${
        selected ? "bg-green-50 border-[#16a34a]/30 rounded-lg" : ""
      } ${!inMonth ? "opacity-35" : ""}`}
    >
      <div className="flex justify-end mb-0.5">
        <span className={`w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-bold flex items-center justify-center rounded-full leading-none ${
          today ? "bg-[#16a34a] text-white"
          : selected ? "text-[#16a34a] font-extrabold"
          : "text-[#222f36]"
        }`}>
          {format(day, "d")}
        </span>
      </div>

      {/* Mobile: dots only */}
      {count > 0 && (
        <div className="flex gap-0.5 flex-wrap sm:hidden px-0.5">
          {doctorCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />}
          {pharmCount  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
        </div>
      )}

      {/* Desktop: activity pills */}
      <div className="hidden sm:flex flex-col gap-0.5 flex-1">
        {dayActivities.slice(0, 2).map((a) => (
          <div key={a.id} className={`flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-semibold truncate ${
            a.type === "pharmacy" ? "bg-violet-50 text-violet-700" : "bg-[#dcfce7] text-[#15803d]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.type === "pharmacy" ? "bg-violet-500" : "bg-[#16a34a]"}`} />
            <span className="truncate">
              {a.type === "pharmacy" ? (a.pharmacy?.pharmacy_name ?? "Pharmacy") : (a.doctor?.doctor_name ?? "Visit")}
            </span>
          </div>
        ))}
        {count > 2 && <p className="text-[9px] text-gray-400 font-semibold px-1.5">+{count - 2}</p>}
      </div>
    </div>
  );
};

// ─── Day detail panel ──────────────────────────────────────────────────────────

const DayPanel = ({
  day, activities, loading, onClose,
}: {
  day: Date | null; activities: CalActivity[]; loading: boolean; onClose?: () => void;
}) => {
  const isTodays     = day ? isToday(day) : false;
  const isFuture     = day ? isAfter(startOfDay(day), startOfDay(new Date())) : false;
  const doctorVisits = activities.filter((a) => a.type === "doctor");
  const pharmVisits  = activities.filter((a) => a.type === "pharmacy");

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_20px_0_rgba(0,0,0,0.08)] bg-white w-full lg:w-[260px] lg:shrink-0 max-h-[360px] lg:max-h-none">
      {/* Header */}
      <div className={`px-4 py-4 flex items-start justify-between ${isTodays ? "bg-[#16a34a]" : "bg-[#1a2530]"}`}>
        <div>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {day ? format(day, "EEEE") : "No day selected"}
          </p>
          <p className="text-white text-2xl font-black leading-none">{day ? format(day, "d") : "—"}</p>
          <p className="text-white/70 text-xs font-medium mt-0.5">{day ? format(day, "MMMM yyyy") : ""}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {doctorVisits.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {doctorVisits.length} HCP
              </span>
            )}
            {pharmVisits.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-400/40 text-white">
                {pharmVisits.length} pharmacy
              </span>
            )}
            {activities.length === 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">No visits</span>
            )}
            {isTodays && (
              <span className="text-[9px] font-bold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">TODAY</span>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden focus-visible:outline-none ml-2 mt-0.5">
            <MdClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            {isFuture ? (
              <>
                <MdCalendarToday className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-medium">Not yet reached</p>
              </>
            ) : (
              <>
                <FiActivity className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-medium">No activity logged</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {activities.map((a, i) => (
              <div key={a.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  a.type === "pharmacy" ? "bg-violet-100" : "bg-[#dcfce7]"
                }`}>
                  {a.type === "pharmacy"
                    ? <TbPill className="w-3 h-3 text-violet-600" />
                    : <span className="text-[#16a34a] text-[9px] font-bold">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#222f36] truncate leading-tight">
                    {a.type === "pharmacy" ? (a.pharmacy?.pharmacy_name ?? "Pharmacy") : (a.doctor?.doctor_name ?? "Unknown")}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {a.type === "pharmacy" ? a.pharmacy?.town : a.doctor?.town}
                  </p>
                  {a.focused_product && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-md">
                      ★ {a.focused_product.product_name}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-gray-300 font-mono">{format(new Date(a.date), "HH:mm")}</span>
                    {(a.samples_given ?? 0) > 0 && (
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        {a.samples_given} smp
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

// ─── Main Calendar ─────────────────────────────────────────────────────────────

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities,   setActivities]   = useState<CalActivity[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDay,  setSelectedDay]  = useState<Date>(new Date());
  const [panelOpen,    setPanelOpen]    = useState(false); // on mobile, show after tapping a day

  useEffect(() => {
    Promise.all([
      getActivityHistoryApi({ days: 90, limit: 1000 }),
      getPharmacyActivityHistoryApi({ days: 90, limit: 500 }),
    ])
      .then(([docRes, pharmRes]) => {
        const docs:   CalActivity[] = (docRes.data?.data   ?? []).map((a: any) => ({ ...a, type: "doctor"   as const }));
        const pharms: CalActivity[] = (pharmRes.data?.data ?? []).map((a: any) => ({ ...a, type: "pharmacy" as const }));
        setActivities([...docs, ...pharms]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const map: Record<string, CalActivity[]> = {};
    for (const a of activities) {
      const key = format(new Date(a.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [activities]);

  const calDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end:   endOfWeek(endOfMonth(currentMonth)),
  }), [currentMonth]);

  const monthVisits = useMemo(
    () => activities.filter((a) => isSameMonth(new Date(a.date), currentMonth)).length,
    [activities, currentMonth]
  );

  const selectedKey        = format(selectedDay, "yyyy-MM-dd");
  const selectedActivities = byDay[selectedKey] ?? [];

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-black text-[#222f36] tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              <MdChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); setPanelOpen(true); }}
            className="text-xs font-semibold px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] bg-[#dcfce7] px-3 py-1.5 rounded-full">
          <FaUserDoctor className="w-3.5 h-3.5" />
          {monthVisits} visits
        </div>
      </div>

      {/* Calendar + Panel */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">

        {/* Calendar grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {calDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              return (
                <DayCell
                  key={key}
                  day={day}
                  inMonth={isSameMonth(day, currentMonth)}
                  dayActivities={byDay[key] ?? []}
                  selected={isSameDay(day, selectedDay)}
                  onClick={() => { setSelectedDay(day); setPanelOpen(true); }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-[10px] text-gray-400 font-medium">Doctor visit</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] text-gray-400 font-medium">Pharmacy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-[#16a34a] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Today</span>
            </div>
          </div>
        </div>

        {/* Day detail panel — always on lg, tap-to-open on mobile */}
        <div className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <DayPanel
            day={selectedDay}
            activities={selectedActivities}
            loading={loading}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
