import { useState, useMemo, useEffect } from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, startOfDay, isAfter,
} from "date-fns";
import { MdChevronLeft, MdChevronRight, MdCalendarToday, MdClose, MdAdd } from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { FaUserDoctor } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { LuCalendarDays, LuCoffee, LuGraduationCap, LuMegaphone, LuStethoscope, LuBuilding } from "react-icons/lu";
import { getActivityHistoryApi, getPharmacyActivityHistoryApi, getFieldEventsApi } from "../../../services/api";
import { FormModal } from "./Events";

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

type EventType = "OPD_BREAKFAST" | "CME_EVENT" | "PRODUCT_LAUNCH" | "PHARMACY_WORKSHOP" | "HOSPITAL_ROUND" | "OTHER";
type EventStatus = "PLANNED" | "EXECUTED" | "PARTIALLY_DONE" | "CANCELLED";

interface FieldEvent {
  id: string;
  event_type: EventType;
  title: string;
  status: EventStatus;
  planned_date?: string | null;
  executed_date?: string | null;
  planned_count: number;
  executed_count: number;
  attendees_count?: number | null;
  notes?: string | null;
}

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; Icon: React.ElementType; dot: string; pill: string }> = {
  OPD_BREAKFAST:     { label: "OPD Breakfast",     Icon: LuCoffee,        dot: "bg-amber-400",  pill: "bg-amber-50 text-amber-700"  },
  CME_EVENT:         { label: "CME Evening",        Icon: LuGraduationCap, dot: "bg-violet-400", pill: "bg-violet-50 text-violet-700" },
  PRODUCT_LAUNCH:    { label: "Product Launch",     Icon: LuMegaphone,     dot: "bg-sky-400",    pill: "bg-sky-50 text-sky-700"       },
  PHARMACY_WORKSHOP: { label: "Pharmacy Workshop",  Icon: LuStethoscope,   dot: "bg-teal-400",   pill: "bg-teal-50 text-teal-700"     },
  HOSPITAL_ROUND:    { label: "Hospital Round",     Icon: LuBuilding,      dot: "bg-rose-400",   pill: "bg-rose-50 text-rose-700"     },
  OTHER:             { label: "Activity",           Icon: LuCalendarDays,  dot: "bg-gray-400",   pill: "bg-gray-50 text-gray-600"     },
};

const STATUS_DOT: Record<EventStatus, string> = {
  PLANNED:        "border-2 border-sky-400 bg-white",
  EXECUTED:       "bg-[#16a34a]",
  PARTIALLY_DONE: "bg-amber-400",
  CANCELLED:      "bg-red-300",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Day cell ──────────────────────────────────────────────────────────────────

const DayCell = ({
  day, inMonth, dayActivities, dayEvents, selected, onClick,
}: {
  day: Date; inMonth: boolean;
  dayActivities: CalActivity[];
  dayEvents: FieldEvent[];
  selected: boolean; onClick: () => void;
}) => {
  const today = isToday(day);
  const doctorCount = dayActivities.filter((a) => a.type === "doctor").length;
  const pharmCount  = dayActivities.filter((a) => a.type === "pharmacy").length;
  const actCount = dayActivities.length;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col p-1 sm:p-1.5 cursor-pointer border border-transparent hover:border-[#16a34a]/20 hover:bg-green-50/30 min-h-[44px] sm:min-h-[68px] ${
        selected ? "bg-green-50 border-[#16a34a]/30 rounded-lg" : ""
      } ${!inMonth ? "opacity-35" : ""}`}
    >
      <div className="flex justify-end mb-0.5">
        <span className={`w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-poppins-bold flex items-center justify-center rounded-full leading-none ${
          today ? "bg-[#16a34a] text-white"
          : selected ? "text-[#16a34a] font-extrabold"
          : "text-[#222f36]"
        }`}>
          {format(day, "d")}
        </span>
      </div>

      {/* Mobile: dots only */}
      <div className="flex gap-0.5 flex-wrap sm:hidden px-0.5">
        {doctorCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />}
        {pharmCount  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
        {dayEvents.map((ev) => (
          <span key={ev.id} className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVENT_TYPE_CONFIG[ev.event_type].dot}`} />
        ))}
      </div>

      {/* Desktop: activity + event pills */}
      <div className="hidden sm:flex flex-col gap-0.5 flex-1">
        {dayActivities.slice(0, 1).map((a) => (
          <div key={a.id} className={`flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-semibold truncate ${
            a.type === "pharmacy" ? "bg-violet-50 text-violet-700" : "bg-[#dcfce7] text-[#15803d]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.type === "pharmacy" ? "bg-violet-500" : "bg-[#16a34a]"}`} />
            <span className="truncate font-poppins">
              {a.type === "pharmacy" ? (a.pharmacy?.pharmacy_name ?? "Pharmacy") : (a.doctor?.doctor_name ?? "Visit")}
            </span>
          </div>
        ))}
        {dayEvents.slice(0, actCount > 0 ? 1 : 2).map((ev) => {
          const cfg = EVENT_TYPE_CONFIG[ev.event_type];
          return (
            <div key={ev.id} className={`flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-semibold truncate ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status]}`} />
              <span className="truncate font-poppins">{ev.title}</span>
            </div>
          );
        })}
        {(actCount + dayEvents.length) > 2 && (
          <p className="text-[9px] text-gray-400 font-semibold px-1.5">+{actCount + dayEvents.length - 2}</p>
        )}
      </div>
    </div>
  );
};

// ─── Day detail panel ──────────────────────────────────────────────────────────

const DayPanel = ({
  day, activities, events, loading, onClose, onAddEvent,
}: {
  day: Date | null; activities: CalActivity[]; events: FieldEvent[];
  loading: boolean; onClose?: () => void; onAddEvent?: () => void;
}) => {
  const isTodays = day ? isToday(day) : false;
  const isFuture = day ? isAfter(startOfDay(day), startOfDay(new Date())) : false;
  const doctorVisits = activities.filter((a) => a.type === "doctor");
  const pharmVisits  = activities.filter((a) => a.type === "pharmacy");

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_20px_0_rgba(0,0,0,0.08)] bg-white w-full lg:w-[270px] lg:shrink-0">
      {/* Header */}
      <div className={`px-4 py-4 flex items-start justify-between ${isTodays ? "bg-[#16a34a]" : "bg-[#1a2530]"}`}>
        <div>
          <p className="text-white/60 text-[10px] font-poppins-bold uppercase tracking-widest mb-0.5">
            {day ? format(day, "EEEE") : "No day selected"}
          </p>
          <p className="text-white text-2xl font-poppins-bold leading-none">{day ? format(day, "d") : "—"}</p>
          <p className="text-white/70 text-xs font-medium mt-0.5">{day ? format(day, "MMMM yyyy") : ""}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {doctorVisits.length > 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {doctorVisits.length} HCP
              </span>
            )}
            {pharmVisits.length > 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-violet-400/40 text-white">
                {pharmVisits.length} pharmacy
              </span>
            )}
            {events.length > 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-amber-400/40 text-white">
                {events.length} event{events.length > 1 ? "s" : ""}
              </span>
            )}
            {activities.length === 0 && events.length === 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">Nothing logged</span>
            )}
            {isTodays && (
              <span className="text-[9px] font-poppins-bold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">TODAY</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2 mt-0.5">
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center focus-visible:outline-none"
              title="Add field event"
            >
              <MdAdd className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden focus-visible:outline-none">
              <MdClose className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[360px] lg:max-h-none">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Visits section */}
            {activities.length > 0 && (
              <div className="p-3 space-y-1.5">
                <p className="text-[9px] font-poppins-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Visits</p>
                {activities.map((a, i) => (
                  <div key={a.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      a.type === "pharmacy" ? "bg-violet-100" : "bg-[#dcfce7]"
                    }`}>
                      {a.type === "pharmacy"
                        ? <TbPill className="w-3 h-3 text-violet-600" />
                        : <span className="text-[#16a34a] font-poppins text-[9px] font-bold">{i + 1}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-poppins-bold text-[#222f36] truncate leading-tight">
                        {a.type === "pharmacy" ? (a.pharmacy?.pharmacy_name ?? "Pharmacy") : (a.doctor?.doctor_name ?? "Unknown")}
                      </p>
                      <p className="text-[10px] font-poppins text-gray-400 truncate">
                        {a.type === "pharmacy" ? a.pharmacy?.town : a.doctor?.town}
                      </p>
                      {a.focused_product && (
                        <span className="inline-block mt-0.5 text-[9px] font-poppins-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-md">
                          ★ {a.focused_product.product_name}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-poppins text-gray-300">{format(new Date(a.date), "HH:mm")}</span>
                        {(a.samples_given ?? 0) > 0 && (
                          <span className="text-[9px] font-poppins-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            {a.samples_given} smp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Events section */}
            {events.length > 0 && (
              <div className={`p-3 space-y-1.5 ${activities.length > 0 ? "border-t border-gray-50" : ""}`}>
                <p className="text-[9px] font-poppins-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Field Events</p>
                {events.map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.event_type];
                  const Icon = cfg.Icon;
                  return (
                    <div key={ev.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.pill}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-poppins-bold text-[#222f36] truncate leading-tight">{ev.title}</p>
                        <p className="text-[10px] font-poppins text-gray-400">{cfg.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${
                            ev.status === "EXECUTED" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]"
                            : ev.status === "PLANNED" ? "bg-sky-50 text-sky-700 border-sky-200"
                            : ev.status === "CANCELLED" ? "bg-red-50 text-red-500 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {ev.status === "EXECUTED" ? "Done" : ev.status === "PARTIALLY_DONE" ? "Partial" : ev.status.charAt(0) + ev.status.slice(1).toLowerCase()}
                          </span>
                          {ev.attendees_count != null && (
                            <span className="text-[9px] font-poppins text-gray-400">{ev.attendees_count} attendees</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {activities.length === 0 && events.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center px-4">
                {isFuture ? (
                  <>
                    <MdCalendarToday className="w-7 h-7 text-gray-200 mb-2" />
                    <p className="text-xs font-poppins text-gray-400 font-medium">Nothing planned yet</p>
                    {onAddEvent && (
                      <button
                        onClick={onAddEvent}
                        className="mt-3 flex items-center gap-1.5 text-xs font-poppins-semibold text-[#16a34a] hover:underline"
                      >
                        <MdAdd className="w-3.5 h-3.5" /> Add field event
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <FiActivity className="w-7 h-7 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400 font-poppins-semibold">No activity logged</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Calendar ─────────────────────────────────────────────────────────────

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities,   setActivities]   = useState<CalActivity[]>([]);
  const [events,       setEvents]       = useState<FieldEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDay,  setSelectedDay]  = useState<Date>(new Date());
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [addEventDay,  setAddEventDay]  = useState<string | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      getActivityHistoryApi({ days: 90, limit: 1000 }),
      getPharmacyActivityHistoryApi({ days: 90, limit: 500 }),
      getFieldEventsApi({ month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear() }),
    ])
      .then(([docRes, pharmRes, evRes]) => {
        const docs:   CalActivity[] = (docRes.data?.data   ?? []).map((a: any) => ({ ...a, type: "doctor"   as const }));
        const pharms: CalActivity[] = (pharmRes.data?.data ?? []).map((a: any) => ({ ...a, type: "pharmacy" as const }));
        setActivities([...docs, ...pharms]);
        setEvents(evRes.data?.data ?? evRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = useMemo(() => {
    const map: Record<string, CalActivity[]> = {};
    for (const a of activities) {
      const key = format(new Date(a.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [activities]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, FieldEvent[]> = {};
    for (const ev of events) {
      const dateStr = ev.planned_date ?? ev.executed_date;
      if (!dateStr) continue;
      const key = dateStr.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const calDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end:   endOfWeek(endOfMonth(currentMonth)),
  }), [currentMonth]);

  const monthVisits = useMemo(
    () => activities.filter((a) => isSameMonth(new Date(a.date), currentMonth)).length,
    [activities, currentMonth]
  );

  const monthEvents = useMemo(
    () => events.filter((ev) => {
      const d = ev.planned_date ?? ev.executed_date;
      return d && isSameMonth(new Date(d), currentMonth);
    }).length,
    [events, currentMonth]
  );

  const selectedKey        = format(selectedDay, "yyyy-MM-dd");
  const selectedActivities = byDay[selectedKey] ?? [];
  const selectedEvents     = eventsByDay[selectedKey] ?? [];

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setPanelOpen(true);
  };

  const handleAddEvent = () => {
    setAddEventDay(format(selectedDay, "yyyy-MM-dd"));
  };

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Add Event modal */}
      {addEventDay && (
        <FormModal
          initialDate={addEventDay}
          onClose={() => setAddEventDay(null)}
          onSaved={() => { setAddEventDay(null); loadAll(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-poppins-extrabold text-[#222f36] tracking-tight">
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
            className="text-xs font-poppins-semibold px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] bg-[#dcfce7] px-3 py-1.5 rounded-full">
            <FaUserDoctor className="w-3.5 h-3.5" />
            {monthVisits} visits
          </div>
          {monthEvents > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
              <LuCalendarDays className="w-3.5 h-3.5" />
              {monthEvents} event{monthEvents > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Calendar + Panel */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">

        {/* Calendar grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] sm:text-[11px] font-poppins-bold text-gray-400 uppercase tracking-wider py-1.5">
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
                  dayEvents={eventsByDay[key] ?? []}
                  selected={isSameDay(day, selectedDay)}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Doctor visit</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Pharmacy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Field event</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-[#16a34a] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Today</span>
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <DayPanel
            day={selectedDay}
            activities={selectedActivities}
            events={selectedEvents}
            loading={loading}
            onClose={() => setPanelOpen(false)}
            onAddEvent={handleAddEvent}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
