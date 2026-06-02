import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  LuCalendarDays, LuCoffee, LuGraduationCap, LuMegaphone, LuStethoscope, LuBuilding,
  LuChevronDown, LuChevronUp,
} from "react-icons/lu";
import { getFieldEventsApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = "PLANNED" | "EXECUTED" | "PARTIALLY_DONE" | "CANCELLED";
type EventType   = "OPD_BREAKFAST" | "CME_EVENT" | "PRODUCT_LAUNCH" | "PHARMACY_WORKSHOP" | "HOSPITAL_ROUND" | "OTHER";

interface FieldEvent {
  id: string;
  event_type: EventType;
  title: string;
  status: EventStatus;
  planned_date?: string | null;
  executed_date?: string | null;
  planned_count: number;
  executed_count: number;
  budget_ugx?: number | null;
  actual_spend?: number | null;
  attendees_count?: number | null;
  notes?: string | null;
  doctor?:   { id: string; doctor_name: string; town?: string } | null;
  facility?: { id: string; name: string; town?: string } | null;
  product?:  { id: string; product_name: string } | null;
  user: { id: string; firstname: string; lastname: string };
}

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  OPD_BREAKFAST:    LuCoffee,
  CME_EVENT:        LuGraduationCap,
  PRODUCT_LAUNCH:   LuMegaphone,
  PHARMACY_WORKSHOP:LuStethoscope,
  HOSPITAL_ROUND:   LuBuilding,
  OTHER:            LuCalendarDays,
};
const EVENT_LABELS: Record<EventType, string> = {
  OPD_BREAKFAST:    "OPD Breakfast",
  CME_EVENT:        "CME Evening",
  PRODUCT_LAUNCH:   "Product Launch",
  PHARMACY_WORKSHOP:"Pharmacy Workshop",
  HOSPITAL_ROUND:   "Hospital Round",
  OTHER:            "Other",
};
const EVENT_COLORS: Record<EventType, string> = {
  OPD_BREAKFAST:    "text-amber-600",
  CME_EVENT:        "text-violet-600",
  PRODUCT_LAUNCH:   "text-sky-600",
  PHARMACY_WORKSHOP:"text-teal-600",
  HOSPITAL_ROUND:   "text-rose-600",
  OTHER:            "text-gray-500",
};
const STATUS_CONFIG: Record<EventStatus, { label: string; cls: string }> = {
  PLANNED:        { label: "Planned",   cls: "bg-sky-50 text-sky-700 border-sky-200" },
  EXECUTED:       { label: "Done",      cls: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" },
  PARTIALLY_DONE: { label: "Partial",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CANCELLED:      { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" },
};

const Events = () => {
  const [events, setEvents]   = useState<FieldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const load = useCallback(() => {
    setLoading(true);
    getFieldEventsApi({ month, year })
      .then(r => setEvents(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Group by rep
  const byRep: Record<string, { user: FieldEvent["user"]; events: FieldEvent[] }> = {};
  events.forEach(e => {
    if (!byRep[e.user.id]) byRep[e.user.id] = { user: e.user, events: [] };
    byRep[e.user.id].events.push(e);
  });

  const totalBudget = events.reduce((s, e) => s + (e.budget_ugx  ?? 0), 0);
  const totalSpent  = events.reduce((s, e) => s + (e.actual_spend ?? 0), 0);
  const planned     = events.filter(e => e.status === "PLANNED").length;
  const done        = events.filter(e => e.status === "EXECUTED").length;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl tracking-tight">Field Events</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">
          OPD Breakfasts, CME evenings, and other engagement activities across your team
        </p>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
          <button key={m} onClick={() => setMonth(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-poppins-semibold ${
              month === i + 1 ? "bg-[#16a34a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={{ transition: "background-color 0.12s" }}>{m}</button>
        ))}
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-[#16a34a]" />
      </div>

      {/* Summary */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Planned",      value: planned,                    color: "text-sky-600"     },
            { label: "Done",         value: done,                       color: "text-[#16a34a]"   },
            { label: "Budget (UGX)", value: totalBudget.toLocaleString(), color: "text-violet-600" },
            { label: "Spent (UGX)",  value: totalSpent.toLocaleString(),
              color: totalSpent > totalBudget ? "text-red-500" : "text-gray-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-[0_1px_6px_0_rgba(0,0,0,0.04)]">
              <p className="text-xs font-poppins text-gray-400">{s.label}</p>
              <p className={`text-2xl font-poppins-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events grouped by rep */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-gray-400">
          <LuCalendarDays className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-poppins-semibold">No events for {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month-1]} {year}</p>
          <p className="font-poppins text-sm mt-1">Reps plan events from their Field Events page</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.values(byRep).map(({ user, events: repEvents }) => {
            const isOpen = expanded.has(user.id);
            const repDone = repEvents.filter(e => e.status === "EXECUTED").length;
            const repBudget = repEvents.reduce((s, e) => s + (e.budget_ugx ?? 0), 0);
            const repSpent  = repEvents.reduce((s, e) => s + (e.actual_spend ?? 0), 0);

            return (
              <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Rep header */}
                <button
                  onClick={() => toggleExpand(user.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 focus-visible:outline-none text-left"
                  style={{ transition: "background-color 0.15s" }}>
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-poppins-bold text-xs">{user.firstname[0]}{user.lastname[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins-semibold text-[#1a1a1a] text-sm">{user.firstname} {user.lastname}</p>
                    <p className="text-xs font-poppins text-gray-400 mt-0.5">
                      {repEvents.length} event{repEvents.length !== 1 ? "s" : ""}
                      {" · "}{repDone} done
                      {repBudget > 0 && ` · Budget UGX ${repBudget.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full ${
                      repSpent > repBudget && repBudget > 0 ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]"
                    }`}>
                      {repDone}/{repEvents.length} done
                    </span>
                  </div>
                  {isOpen ? <LuChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <LuChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>

                {/* Event list */}
                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {repEvents.map(ev => {
                      const Icon = EVENT_ICONS[ev.event_type] ?? LuCalendarDays;
                      const sc   = STATUS_CONFIG[ev.status];
                      const iconColor = EVENT_COLORS[ev.event_type] ?? "text-gray-500";
                      return (
                        <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate">{ev.title}</p>
                              <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                            </div>
                            <p className="text-xs font-poppins text-gray-400 mt-0.5 truncate">
                              {[
                                EVENT_LABELS[ev.event_type],
                                ev.doctor?.doctor_name,
                                ev.facility?.name,
                                ev.product?.product_name,
                                ev.planned_date && format(new Date(ev.planned_date), "dd MMM yyyy"),
                              ].filter(Boolean).join(" · ")}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] font-poppins text-gray-400 flex-wrap">
                              <span>{ev.planned_count}× planned {ev.executed_count > 0 && `· ${ev.executed_count}× done`}</span>
                              {ev.budget_ugx   != null && <span>Budget: UGX {ev.budget_ugx.toLocaleString()}</span>}
                              {ev.actual_spend != null && (
                                <span className={ev.actual_spend > (ev.budget_ugx ?? Infinity) ? "text-red-500 font-poppins-semibold" : "text-[#16a34a] font-poppins-semibold"}>
                                  Spent: UGX {ev.actual_spend.toLocaleString()}
                                </span>
                              )}
                              {ev.attendees_count != null && <span>{ev.attendees_count} attendees</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
