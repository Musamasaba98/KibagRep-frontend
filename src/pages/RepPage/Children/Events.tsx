import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  LuCalendarDays, LuPlus, LuCheck, LuX, LuChevronDown, LuPencil,
  LuCoffee, LuGraduationCap, LuMegaphone, LuStethoscope, LuBuilding,
} from "react-icons/lu";
import { FaXmark } from "react-icons/fa6";
import {
  getFieldEventsApi, createFieldEventApi, updateFieldEventApi, deleteFieldEventApi,
  getDoctorsApi, getFacilitiesApi, getProductsApi,
} from "../../../services/api";

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

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string; Icon: React.ElementType; color: string }[] = [
  { value: "OPD_BREAKFAST",     label: "OPD Breakfast",      Icon: LuCoffee,       color: "text-amber-600"  },
  { value: "CME_EVENT",         label: "CME Evening",        Icon: LuGraduationCap,color: "text-violet-600" },
  { value: "PRODUCT_LAUNCH",    label: "Product Launch",     Icon: LuMegaphone,    color: "text-sky-600"    },
  { value: "PHARMACY_WORKSHOP", label: "Pharmacy Workshop",  Icon: LuStethoscope,  color: "text-teal-600"   },
  { value: "HOSPITAL_ROUND",    label: "Hospital Round",     Icon: LuBuilding,     color: "text-rose-600"   },
  { value: "OTHER",             label: "Other Activity",     Icon: LuCalendarDays, color: "text-gray-500"   },
];

const STATUS_CONFIG: Record<EventStatus, { label: string; cls: string }> = {
  PLANNED:        { label: "Planned",        cls: "bg-sky-50 text-sky-700 border-sky-200" },
  EXECUTED:       { label: "Done",           cls: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" },
  PARTIALLY_DONE: { label: "Partial",        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CANCELLED:      { label: "Cancelled",      cls: "bg-red-50 text-red-600 border-red-200" },
};

function typeConfig(t: EventType) {
  return EVENT_TYPES.find(e => e.value === t) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────

interface FormModalProps {
  event?: FieldEvent | null;
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const FormModal = ({ event, initialDate, onClose, onSaved }: FormModalProps) => {
  const isEdit = !!event;
  const [form, setForm] = useState({
    event_type:    event?.event_type    ?? "OPD_BREAKFAST" as EventType,
    title:         event?.title         ?? "",
    status:        event?.status        ?? "PLANNED" as EventStatus,
    planned_date:  event?.planned_date  ? event.planned_date.slice(0, 10) : (initialDate ?? ""),
    executed_date: event?.executed_date ? event.executed_date.slice(0, 10) : "",
    planned_count:  String(event?.planned_count  ?? 1),
    executed_count: String(event?.executed_count ?? 0),
    budget_ugx:    event?.budget_ugx    != null ? String(event.budget_ugx)    : "",
    actual_spend:  event?.actual_spend  != null ? String(event.actual_spend)  : "",
    attendees_count: event?.attendees_count != null ? String(event.attendees_count) : "",
    doctor_id:     event?.doctor?.id    ?? "",
    facility_id:   event?.facility?.id  ?? "",
    product_id:    event?.product?.id   ?? "",
    notes:         event?.notes         ?? "",
  });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([getDoctorsApi(), getFacilitiesApi(), getProductsApi()]).then(([d, f, p]) => {
      if (d.status === "fulfilled") setDoctors((d.value.data?.data ?? []).map((x: any) => x.doctor ?? x));
      if (f.status === "fulfilled") setFacilities(f.value.data?.data ?? []);
      if (p.status === "fulfilled") setProducts(p.value.data?.data ?? p.value.data ?? []);
    });
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        event_type:      form.event_type,
        title:           form.title.trim(),
        status:          form.status,
        planned_date:    form.planned_date    || null,
        executed_date:   form.executed_date   || null,
        planned_count:   parseInt(form.planned_count)  || 1,
        executed_count:  parseInt(form.executed_count) || 0,
        budget_ugx:      form.budget_ugx      ? parseFloat(form.budget_ugx)    : null,
        actual_spend:    form.actual_spend    ? parseFloat(form.actual_spend)  : null,
        attendees_count: form.attendees_count ? parseInt(form.attendees_count) : null,
        doctor_id:       form.doctor_id   || null,
        facility_id:     form.facility_id || null,
        product_id:      form.product_id  || null,
        notes:           form.notes.trim() || null,
      };
      if (isEdit) await updateFieldEventApi(event!.id, payload);
      else        await createFieldEventApi(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-lg overflow-y-auto" style={{ maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-black text-[#1a2530] text-lg tracking-tight">
            {isEdit ? "Edit Event" : "Plan Field Event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

          {/* Event type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPES.map(({ value, label, Icon, color }) => (
                <button key={value} type="button" onClick={() => setForm(f => ({ ...f, event_type: value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left ${
                    form.event_type === value
                      ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={{ transition: "background-color 0.12s, border-color 0.12s" }}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${form.event_type === value ? "text-[#16a34a]" : color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. OPD Breakfast – Mulago Paediatrics" className={inputCls} />
          </div>

          {/* Doctor + Facility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Doctor / HCP</label>
              <select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} className={selectCls}>
                <option value="">— none —</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.doctor_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Facility</label>
              <select value={form.facility_id} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} className={selectCls}>
                <option value="">— none —</option>
                {facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Focused Brand / Product</label>
            <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className={selectCls}>
              <option value="">— none —</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>
          </div>

          {/* Dates + counts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Planned Date</label>
              <input type="date" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Times / Month (planned)</label>
              <input type="number" min={1} value={form.planned_count} onChange={e => setForm(f => ({ ...f, planned_count: e.target.value }))} className={inputCls} />
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Budget (UGX)</label>
              <input type="number" value={form.budget_ugx} onChange={e => setForm(f => ({ ...f, budget_ugx: e.target.value }))}
                placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Attendees (planned)</label>
              <input type="number" value={form.attendees_count} onChange={e => setForm(f => ({ ...f, attendees_count: e.target.value }))}
                placeholder="—" className={inputCls} />
            </div>
          </div>

          {/* Execution fields — only show when editing */}
          {isEdit && (
            <>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Execution (fill after the event)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Executed Date</label>
                    <input type="date" value={form.executed_date} onChange={e => setForm(f => ({ ...f, executed_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Times Done</label>
                    <input type="number" min={0} value={form.executed_count} onChange={e => setForm(f => ({ ...f, executed_count: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Actual Spend (UGX)</label>
                    <input type="number" value={form.actual_spend} onChange={e => setForm(f => ({ ...f, actual_spend: e.target.value }))}
                      placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EventStatus }))} className={selectCls}>
                      <option value="PLANNED">Planned</option>
                      <option value="EXECUTED">Executed (Done)</option>
                      <option value="PARTIALLY_DONE">Partially Done</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Any preparation notes or feedback…"
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60"
              style={{ transition: "background-color 0.15s" }}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Events = () => {
  const [events, setEvents]       = useState<FieldEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<FieldEvent | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteFieldEventApi(id).catch(() => {});
    setEvents(p => p.filter(e => e.id !== id));
    setDeleting(null);
  };

  const planned  = events.filter(e => e.status === "PLANNED").length;
  const done     = events.filter(e => e.status === "EXECUTED").length;
  const totalBudget = events.reduce((s, e) => s + (e.budget_ugx ?? 0), 0);
  const totalSpent  = events.reduce((s, e) => s + (e.actual_spend ?? 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-poppins-bold text-xl tracking-tight text-gray-800">Field Events</h1>
          <p className="text-sm font-poppins text-gray-400 mt-0.5">
            OPD Breakfasts, CME evenings, product launches &amp; hospital rounds
          </p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]"
          style={{ transition: "background-color 0.15s" }}>
          <LuPlus className="w-4 h-4" /> Plan Event
        </button>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
          <button key={m} onClick={() => setMonth(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              month === i + 1 ? "bg-[#16a34a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={{ transition: "background-color 0.12s" }}>{m}</button>
        ))}
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-[#16a34a]" />
      </div>

      {/* Stats strip */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Planned", value: planned, color: "text-sky-600" },
            { label: "Done", value: done, color: "text-[#16a34a]" },
            { label: "Budget (UGX)", value: totalBudget.toLocaleString(), color: "text-violet-600" },
            { label: "Spent (UGX)", value: totalSpent.toLocaleString(), color: totalSpent > totalBudget ? "text-red-500" : "text-gray-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-[0_1px_6px_0_rgba(0,0,0,0.04)]">
              <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Event list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <LuCalendarDays className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No events for {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month-1]} {year}</p>
            <p className="text-sm mt-1">Plan your first OPD breakfast or CME session</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map(ev => {
              const tc = typeConfig(ev.event_type);
              const sc = STATUS_CONFIG[ev.status];
              const Icon = tc.Icon;
              return (
                <div key={ev.id} className="flex items-start gap-3 px-4 sm:px-5 py-4 hover:bg-gray-50/40"
                  style={{ transition: "background-color 0.12s" }}>
                  <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-4 h-4 ${tc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{ev.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {[
                        ev.doctor?.doctor_name,
                        ev.facility?.name,
                        ev.product?.product_name,
                        ev.planned_date && format(new Date(ev.planned_date), "dd MMM yyyy"),
                      ].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 flex-wrap">
                      <span>{ev.planned_count}× planned {ev.executed_count > 0 && `· ${ev.executed_count}× done`}</span>
                      {ev.budget_ugx != null && <span>Budget: UGX {ev.budget_ugx.toLocaleString()}</span>}
                      {ev.actual_spend != null && <span className={ev.actual_spend > (ev.budget_ugx ?? Infinity) ? "text-red-500 font-semibold" : "text-[#16a34a] font-semibold"}>
                        Spent: UGX {ev.actual_spend.toLocaleString()}
                      </span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditTarget(ev); setShowForm(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#16a34a] hover:border-[#dcfce7]"
                      style={{ transition: "color 0.12s, border-color 0.12s" }}>
                      <LuPencil className="w-3.5 h-3.5" />
                    </button>
                    {ev.status !== "EXECUTED" && (
                      <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 disabled:opacity-40"
                        style={{ transition: "color 0.12s, border-color 0.12s" }}>
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <FormModal
          event={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default Events;
