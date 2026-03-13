import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  format,
  getDaysInMonth,
  isWeekend,
  isToday,
} from "date-fns";
import {
  MdCheckCircle,
  MdClose,
  MdOutlineBeachAccess,
  MdOutlineWarningAmber,
  MdSearch,
  MdWbSunny,
  MdNightsStay,
} from "react-icons/md";
import {
  FiSend,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaUserDoctor, FaHospital } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import {
  getCurrentTourPlanApi,
  updateTourPlanDayApi,
  addTourPlanEntryApi,
  removeTourPlanEntryApi,
  submitTourPlanApi,
  searchPharmaciesApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type TourPlanStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
type EntryType = "CLINICIAN" | "PHARMACY";
type Slot = "MORNING" | "EVENING";

interface TourPlanEntry {
  id: string;
  day_number: number;
  entry_type: EntryType;
  slot: Slot;
  doctor_id: string | null;
  cycle_item_id: string | null;
  pharmacy_id: string | null;
  pharmacy_name: string | null;
  pharmacy?: { id: string; pharmacy_name: string; location: string; town?: string } | null;
  facility_id: string | null;
  facility?: { id: string; name: string; location: string; town?: string } | null;
  notes: string | null;
  doctor?: { id: string; doctor_name: string; town?: string; cadre?: string } | null;
}

interface TourPlanDay {
  id: string;
  day_number: number;
  morning_area: string | null;
  evening_area: string | null;
  notes: string | null;
  is_off_day: boolean;
  daily_allowance: number;
  transport: number;
  airtime: number;
  accommodation: number;
  other_costs: number;
}

interface TourPlan {
  id: string;
  month: number;
  year: number;
  status: TourPlanStatus;
  review_note: string | null;
  days: TourPlanDay[];
  entries: TourPlanEntry[];
}

interface CycleItem {
  id: string;
  doctor_id: string;
  tier: string;
  frequency: number;
  visits_done: number;
  doctor: { id: string; doctor_name: string; town?: string; cadre?: string };
}

interface Cycle {
  id: string;
  month: number;
  year: number;
  status: string;
  items: CycleItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_CLINICIANS = 15;
const TARGET_PHARMACIES = 10;
const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-amber-50",   text: "text-amber-700"  },
  B: { bg: "bg-violet-50",  text: "text-violet-700" },
  C: { bg: "bg-gray-100",   text: "text-gray-500"   },
};
const STATUS_CFG: Record<TourPlanStatus, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: "Draft",     bg: "bg-gray-100",  text: "text-gray-600"  },
  SUBMITTED: { label: "Submitted", bg: "bg-amber-100", text: "text-amber-700" },
  APPROVED:  { label: "Approved",  bg: "bg-green-100", text: "text-[#16a34a]" },
  REJECTED:  { label: "Rejected",  bg: "bg-red-100",   text: "text-red-700"   },
};

// ─── Add-clinician dropdown ───────────────────────────────────────────────────

const AddClinicianDropdown = ({
  cycleItems,
  usedCounts,        // doctor_id → how many times already planned
  onSelect,
  onClose,
}: {
  cycleItems: CycleItem[];
  usedCounts: Record<string, number>;
  onSelect: (item: CycleItem) => void;
  onClose: () => void;
}) => {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return cycleItems.filter(
      (ci) =>
        ci.doctor.doctor_name.toLowerCase().includes(s) ||
        ci.doctor.town?.toLowerCase().includes(s)
    );
  }, [cycleItems, q]);

  return (
    <div className="absolute z-50 mt-1 w-72 bg-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <MdSearch className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search cycle doctors…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <MdClose className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No doctors found</p>
        )}
        {filtered.map((ci) => {
          const planned = usedCounts[ci.doctor_id] ?? 0;
          const over = planned >= ci.frequency;
          const colors = TIER_COLORS[ci.tier] ?? TIER_COLORS.C;
          return (
            <button
              key={ci.id}
              onClick={() => { onSelect(ci); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <FaUserDoctor className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#222f36] truncate">
                  {ci.doctor.doctor_name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{ci.doctor.town}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  Tier {ci.tier}
                </span>
                <span className={`text-[9px] font-medium ${over ? "text-red-500" : "text-gray-400"}`}>
                  {planned}/{ci.frequency} planned
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Add-pharmacy dropdown ───────────────────────────────────────────────────

interface PharmacyResult {
  id: string;
  pharmacy_name: string;
  location: string;
  town?: string;
}

const AddPharmacyDropdown = ({
  onSelect,
  onAddNew,
  onClose,
}: {
  onSelect: (p: PharmacyResult) => void;
  onAddNew: (name: string) => void;
  onClose: () => void;
}) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      searchPharmaciesApi(q)
        .then((res) => setResults(res.data.data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="absolute z-50 mt-1 w-72 bg-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <MdSearch className="w-4 h-4 text-gray-400 shrink-0" />
        <input ref={inputRef} type="text" placeholder="Search pharmacies…" value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700" />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose className="w-4 h-4" /></button>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {loading && <p className="text-xs text-gray-400 text-center py-4">Searching…</p>}
        {!loading && q && results.length === 0 && (
          <div className="px-3 py-3">
            <p className="text-xs text-gray-400 mb-2">No match found in database.</p>
            <button onClick={() => { onAddNew(q); onClose(); }}
              className="w-full text-left text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1.5">
              <FiPlus className="w-3.5 h-3.5" /> Add "{q}" as new pharmacy
            </button>
          </div>
        )}
        {results.map((p) => (
          <button key={p.id} onClick={() => { onSelect(p); onClose(); }}
            className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 text-left">
            <TbPill className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#222f36] truncate">{p.pharmacy_name}</p>
              <p className="text-[10px] text-gray-400 truncate">{[p.location, p.town].filter(Boolean).join(" · ")}</p>
            </div>
          </button>
        ))}
        {!q && (
          <p className="text-[11px] text-gray-400 text-center py-4 px-3">Type to search the pharmacy database</p>
        )}
      </div>
    </div>
  );
};

// ─── Slot section (reusable morning/evening block) ───────────────────────────

const SlotSection = ({
  slot, area, slotEntries, cycleItems, usedCounts, planId, dayNum, locked,
  onAreaSaved, onEntryAdded, onEntryRemoved,
}: {
  slot: Slot;
  area: string;
  slotEntries: TourPlanEntry[];
  cycleItems: CycleItem[];
  usedCounts: Record<string, number>;
  planId: string;
  dayNum: number;
  locked: boolean;
  onAreaSaved: (val: string) => void;
  onEntryAdded: (e: TourPlanEntry) => void;
  onEntryRemoved: (id: string) => void;
}) => {
  const isMorning = slot === "MORNING";
  const [areaVal, setAreaVal]     = useState(area);
  const [showDocDrop, setDocDrop] = useState(false);
  const [showPharmDrop, setShowPharmDrop] = useState(false);

  useEffect(() => { setAreaVal(area); }, [area]);

  const clinicians = slotEntries.filter((e) => e.entry_type === "CLINICIAN");
  const pharmacies = slotEntries.filter((e) => e.entry_type === "PHARMACY");
  const totalHCPs  = clinicians.length;
  const totalRx    = pharmacies.length;

  const addClinician = async (ci: CycleItem) => {
    try {
      const res = await addTourPlanEntryApi(planId, { day_number: dayNum, entry_type: "CLINICIAN", slot, doctor_id: ci.doctor_id, cycle_item_id: ci.id });
      onEntryAdded(res.data.data);
    } catch { /* ignore */ }
  };

  const addPharmacy = async (pharmacy: PharmacyResult) => {
    try {
      const res = await addTourPlanEntryApi(planId, { day_number: dayNum, entry_type: "PHARMACY", slot, pharmacy_id: pharmacy.id, pharmacy_name: pharmacy.pharmacy_name });
      onEntryAdded(res.data.data);
    } catch { /* ignore */ }
  };

  const addPharmacyNew = async (name: string) => {
    try {
      const res = await addTourPlanEntryApi(planId, { day_number: dayNum, entry_type: "PHARMACY", slot, pharmacy_name: name.trim() });
      onEntryAdded(res.data.data);
    } catch { /* ignore */ }
  };

  const removeEntry = async (id: string) => {
    try { await removeTourPlanEntryApi(planId, id); onEntryRemoved(id); } catch { /* ignore */ }
  };

  return (
    <div className={`rounded-xl border p-3 ${isMorning ? "bg-amber-50/50 border-amber-100" : "bg-slate-50/60 border-slate-100"}`}>
      {/* Slot header */}
      <div className="flex items-center gap-2 mb-2.5">
        {isMorning
          ? <MdWbSunny className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          : <MdNightsStay className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
        <span className={`text-[10px] font-black uppercase tracking-widest ${isMorning ? "text-amber-600" : "text-slate-500"}`}>
          {isMorning ? "Morning" : "Evening"}
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold">
          <span className={`px-1.5 py-0.5 rounded-full ${totalHCPs >= TARGET_CLINICIANS ? "bg-green-100 text-[#16a34a]" : totalHCPs > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}>
            {totalHCPs}/{TARGET_CLINICIANS} HCPs
          </span>
          <span className={`px-1.5 py-0.5 rounded-full ${totalRx >= TARGET_PHARMACIES ? "bg-green-100 text-[#16a34a]" : totalRx > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}>
            {totalRx}/{TARGET_PHARMACIES} Rx
          </span>
        </div>
      </div>

      {/* Area field */}
      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-dashed border-gray-200">
        <FaHospital className="w-3 h-3 text-gray-300 shrink-0" />
        {locked ? (
          <span className="text-xs text-gray-600 italic">{areaVal || "—"}</span>
        ) : (
          <input
            type="text"
            value={areaVal}
            onChange={(e) => setAreaVal(e.target.value)}
            onBlur={() => onAreaSaved(areaVal)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder={isMorning ? "Morning area (e.g. Mulago, Kibuli)" : "Evening area (e.g. Namirembe Rd pharmacies)"}
            className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-300"
          />
        )}
      </div>

      {/* HCP list */}
      {clinicians.length > 0 && (
        <div className="space-y-1 mb-1.5">
          {clinicians.map((e) => {
            const ci = e.cycle_item_id ? cycleItems.find((c) => c.id === e.cycle_item_id) : null;
            const colors = ci ? (TIER_COLORS[ci.tier] ?? TIER_COLORS.C) : null;
            return (
              <div key={e.id} className="flex items-center gap-1.5 group">
                <FaUserDoctor className="w-3 h-3 text-[#16a34a] shrink-0" />
                <span className="flex-1 text-xs text-gray-700 truncate">
                  {e.doctor?.doctor_name ?? "Unknown"}
                  {e.doctor?.town && <span className="text-gray-400"> · {e.doctor.town}</span>}
                </span>
                {colors && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>{ci?.tier}</span>}
                {!locked && (
                  <button onClick={() => removeEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pharmacy list */}
      {pharmacies.length > 0 && (
        <div className="space-y-1 mb-1.5">
          {pharmacies.map((e) => (
            <div key={e.id} className="flex items-center gap-1.5 group">
              <TbPill className="w-3 h-3 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{e.pharmacy?.pharmacy_name ?? e.pharmacy_name}</p>
                {(e.pharmacy?.location || e.pharmacy?.town) && (
                  <p className="text-[9px] text-gray-400 truncate">{[e.pharmacy?.location, e.pharmacy?.town].filter(Boolean).join(" · ")}</p>
                )}
              </div>
              {!locked && (
                <button onClick={() => removeEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {!locked && (
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <div className="relative">
            <button onClick={() => setDocDrop(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a] hover:text-[#15803d]">
              <FiPlus className="w-3 h-3" /> Add HCP
            </button>
            {showDocDrop && (
              <AddClinicianDropdown cycleItems={cycleItems} usedCounts={usedCounts}
                onSelect={addClinician} onClose={() => setDocDrop(false)} />
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowPharmDrop(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700">
              <FiPlus className="w-3 h-3" /> Add Pharmacy
            </button>
            {showPharmDrop && (
              <AddPharmacyDropdown
                onSelect={addPharmacy}
                onAddNew={addPharmacyNew}
                onClose={() => setShowPharmDrop(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Day card ─────────────────────────────────────────────────────────────────

const DayCard = ({
  date, dayData, entries, cycleItems, usedCounts, planId, locked,
  onDayUpdated, onEntryAdded, onEntryRemoved,
}: {
  date: Date;
  dayData: TourPlanDay | null;
  entries: TourPlanEntry[];
  cycleItems: CycleItem[];
  usedCounts: Record<string, number>;
  planId: string;
  locked: boolean;
  onDayUpdated: (day: TourPlanDay) => void;
  onEntryAdded: (entry: TourPlanEntry) => void;
  onEntryRemoved: (entryId: string) => void;
}) => {
  const dayNum     = date.getDate();
  const isOff      = dayData?.is_off_day ?? false;
  const isWE       = isWeekend(date);
  const isTD       = isToday(date);

  // Expense state — synced from dayData, saved on blur
  const [exp, setExp] = useState({
    daily_allowance: dayData?.daily_allowance ?? 0,
    transport:       dayData?.transport ?? 0,
    airtime:         dayData?.airtime ?? 0,
    accommodation:   dayData?.accommodation ?? 0,
    other_costs:     dayData?.other_costs ?? 0,
  });
  const [showExp, setShowExp] = useState(false);
  useEffect(() => {
    setExp({
      daily_allowance: dayData?.daily_allowance ?? 0,
      transport:       dayData?.transport ?? 0,
      airtime:         dayData?.airtime ?? 0,
      accommodation:   dayData?.accommodation ?? 0,
      other_costs:     dayData?.other_costs ?? 0,
    });
  }, [dayData?.daily_allowance, dayData?.transport, dayData?.airtime, dayData?.accommodation, dayData?.other_costs]);

  const totalExp = exp.daily_allowance + exp.transport + exp.airtime + exp.accommodation + exp.other_costs;

  const saveDay = useCallback(async (patch: Partial<typeof exp & { is_off_day?: boolean; morning_area?: string; evening_area?: string }>) => {
    try {
      const res = await updateTourPlanDayApi(planId, {
        day_number: dayNum,
        morning_area: dayData?.morning_area ?? undefined,
        evening_area: dayData?.evening_area ?? undefined,
        is_off_day:   dayData?.is_off_day ?? false,
        ...exp, ...patch,
      });
      onDayUpdated(res.data.data);
    } catch { /* ignore */ }
  }, [planId, dayNum, dayData, exp]);

  // Split entries by slot
  const morningEntries = entries.filter((e) => e.slot === "MORNING");
  const eveningEntries = entries.filter((e) => e.slot === "EVENING");
  const allClin = entries.filter((e) => e.entry_type === "CLINICIAN");
  const allRx   = entries.filter((e) => e.entry_type === "PHARMACY");

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] ${isTD ? "ring-2 ring-[#16a34a]/40" : ""}`}>
      {/* Day header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isTD ? "bg-[#16a34a]" : isWE ? "bg-gray-50 border-b border-gray-100" : "bg-[#1a2530]"}`}>
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isTD || !isWE ? "text-white/60" : "text-gray-400"}`}>
            {format(date, "EEEE")}{isTD && " · Today"}
          </p>
          <p className={`text-xl font-black leading-none ${isTD || !isWE ? "text-white" : "text-gray-600"}`}>
            {format(date, "d MMM")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isOff && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className={`px-2 py-1 rounded-full ${allClin.length >= TARGET_CLINICIANS ? (isTD ? "bg-white/20 text-white" : "bg-[#16a34a]/20 text-[#16a34a]") : "bg-white/10 text-white/50"}`}>
                {allClin.length}/{TARGET_CLINICIANS}
              </span>
              <span className={`px-2 py-1 rounded-full ${allRx.length >= TARGET_PHARMACIES ? (isTD ? "bg-white/20 text-white" : "bg-[#16a34a]/20 text-[#16a34a]") : "bg-white/10 text-white/50"}`}>
                {allRx.length} Rx
              </span>
              {totalExp > 0 && (
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/60">
                  {(totalExp / 1000).toFixed(0)}k UGX
                </span>
              )}
            </div>
          )}
          {!locked && (
            <button onClick={() => saveDay({ is_off_day: !isOff })}
              title={isOff ? "Mark working day" : "Mark off day"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOff ? "bg-amber-400 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
              <MdOutlineBeachAccess className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isOff ? (
        <div className="px-4 py-3 text-xs text-gray-400 font-medium">Off day / Leave / Holiday</div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Morning slot */}
          <SlotSection
            slot="MORNING"
            area={dayData?.morning_area ?? ""}
            slotEntries={morningEntries}
            cycleItems={cycleItems}
            usedCounts={usedCounts}
            planId={planId}
            dayNum={dayNum}
            locked={locked}
            onAreaSaved={(val) => saveDay({ morning_area: val })}
            onEntryAdded={onEntryAdded}
            onEntryRemoved={onEntryRemoved}
          />

          {/* Evening slot */}
          <SlotSection
            slot="EVENING"
            area={dayData?.evening_area ?? ""}
            slotEntries={eveningEntries}
            cycleItems={cycleItems}
            usedCounts={usedCounts}
            planId={planId}
            dayNum={dayNum}
            locked={locked}
            onAreaSaved={(val) => saveDay({ evening_area: val })}
            onEntryAdded={onEntryAdded}
            onEntryRemoved={onEntryRemoved}
          />

          {/* Expense accordion */}
          <div className="border-t border-gray-100 pt-2">
            <button onClick={() => setShowExp((v) => !v)}
              className="flex items-center justify-between w-full text-left group">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <FiDollarSign className="w-3 h-3" />
                Expenses
                {totalExp > 0 && (
                  <span className="font-bold text-[#16a34a] normal-case tracking-normal ml-1">
                    {totalExp.toLocaleString()} UGX
                  </span>
                )}
              </span>
              {showExp
                ? <FiChevronUp className="w-3.5 h-3.5 text-gray-400" />
                : <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {showExp && (
              <div className="mt-3 space-y-2">
                {([
                  ["Daily Allowance", "daily_allowance"],
                  ["Transport",       "transport"],
                  ["Airtime",         "airtime"],
                  ["Accommodation",   "accommodation"],
                  ["Other",           "other_costs"],
                ] as [string, keyof typeof exp][]).map(([label, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 w-28 shrink-0">{label}</span>
                    {locked ? (
                      <span className="text-xs font-semibold text-gray-600">{exp[key].toLocaleString()}</span>
                    ) : (
                      <input
                        type="number" min={0}
                        value={exp[key] || ""}
                        placeholder="0"
                        onChange={(e) => setExp((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                        onBlur={() => saveDay(exp)}
                        className="w-32 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] transition-colors"
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500">Day Total</span>
                  <span className="text-sm font-black text-[#16a34a]">{totalExp.toLocaleString()} UGX</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Cycle coverage panel ─────────────────────────────────────────────────────

const CycleCoveragePanel = ({
  cycleItems,
  usedCounts,
}: {
  cycleItems: CycleItem[];
  usedCounts: Record<string, number>;
}) => {
  const fullyPlanned = cycleItems.filter((ci) => (usedCounts[ci.doctor_id] ?? 0) >= ci.frequency);
  const overPlanned  = cycleItems.filter((ci) => (usedCounts[ci.doctor_id] ?? 0) >  ci.frequency);
  const underPlanned = cycleItems.filter((ci) => (usedCounts[ci.doctor_id] ?? 0) <  ci.frequency);
  const pct = cycleItems.length > 0 ? Math.round((fullyPlanned.length / cycleItems.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cycle Coverage</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{fullyPlanned.length}/{cycleItems.length} doctors fully planned</p>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">0%</span>
          <span className="text-[10px] font-bold text-gray-600">{pct}%</span>
          <span className="text-[10px] text-gray-400">100%</span>
        </div>
      </div>

      {/* Warnings */}
      {overPlanned.length > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-red-50">
          <div className="flex items-start gap-1.5">
            <FiAlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-700 font-semibold">
              {overPlanned.length} doctor{overPlanned.length > 1 ? "s" : ""} over-planned
            </p>
          </div>
        </div>
      )}

      {/* Doctor list */}
      <div className="overflow-y-auto max-h-[500px]">
        {cycleItems.map((ci) => {
          const planned = usedCounts[ci.doctor_id] ?? 0;
          const isOver  = planned > ci.frequency;
          const isFull  = planned === ci.frequency;
          const pctDoc  = ci.frequency > 0 ? Math.min(100, Math.round((planned / ci.frequency) * 100)) : 0;
          const colors  = TIER_COLORS[ci.tier] ?? TIER_COLORS.C;

          return (
            <div key={ci.id} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {isFull ? (
                    <MdCheckCircle className="w-4 h-4 text-[#16a34a]" />
                  ) : isOver ? (
                    <FiAlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-[#222f36] truncate">{ci.doctor.doctor_name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
                      {ci.tier}
                    </span>
                    {isOver && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                        Over!
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{ci.doctor.town}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pctDoc}%`,
                          backgroundColor: isOver ? "#ef4444" : isFull ? "#16a34a" : "#f59e0b",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${
                      isOver ? "text-red-500" : isFull ? "text-[#16a34a]" : "text-amber-600"
                    }`}>
                      {planned}/{ci.frequency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {cycleItems.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center px-4">
            <FiInfo className="w-6 h-6 text-gray-300 mb-2" />
            <p className="text-xs text-gray-400 font-medium">No call cycle yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Set up your call cycle first, then plan your tour.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TourPlan = () => {
  const [plan, setPlan]           = useState<TourPlan | null>(null);
  const [cycle, setCycle]         = useState<Cycle | null>(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy");

  useEffect(() => {
    getCurrentTourPlanApi()
      .then((res) => {
        setPlan(res.data.data.plan);
        setCycle(res.data.data.cycle);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build lookup: day_number → TourPlanDay
  const dayMap = useMemo<Record<number, TourPlanDay>>(() => {
    if (!plan) return {};
    return Object.fromEntries(plan.days.map((d) => [d.day_number, d]));
  }, [plan]);

  // Build lookup: day_number → TourPlanEntry[]
  const entryMap = useMemo<Record<number, TourPlanEntry[]>>(() => {
    if (!plan) return {};
    const map: Record<number, TourPlanEntry[]> = {};
    for (const e of plan.entries) {
      if (!map[e.day_number]) map[e.day_number] = [];
      map[e.day_number].push(e);
    }
    return map;
  }, [plan]);

  // Count how many times each doctor is planned across the entire plan
  const usedCounts = useMemo<Record<string, number>>(() => {
    if (!plan) return {};
    const counts: Record<string, number> = {};
    for (const e of plan.entries) {
      if (e.entry_type === "CLINICIAN" && e.doctor_id) {
        counts[e.doctor_id] = (counts[e.doctor_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [plan]);

  // Build working days of the month
  const workDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(now);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      return d;
    });
  }, []);

  // Validation summary
  const validation = useMemo(() => {
    if (!plan) return { underloadedDays: 0, overPlanned: 0, unplanned: 0 };
    const underloadedDays = workDays.filter((d) => {
      const entries = entryMap[d.getDate()] ?? [];
      const day = dayMap[d.getDate()];
      if (day?.is_off_day) return false;
      const clinicians = entries.filter((e) => e.entry_type === "CLINICIAN");
      return clinicians.length > 0 && clinicians.length < TARGET_CLINICIANS;
    }).length;
    const overPlanned = (cycle?.items ?? []).filter(
      (ci) => (usedCounts[ci.doctor_id] ?? 0) > ci.frequency
    ).length;
    const unplanned = (cycle?.items ?? []).filter(
      (ci) => (usedCounts[ci.doctor_id] ?? 0) < ci.frequency
    ).length;
    return { underloadedDays, overPlanned, unplanned };
  }, [plan, workDays, entryMap, dayMap, cycle, usedCounts]);

  // Monthly expense total (sum of all day expenses)
  const monthlyExpense = useMemo(() => {
    if (!plan) return 0;
    return plan.days.reduce((s, d) => s + d.daily_allowance + d.transport + d.airtime + d.accommodation + d.other_costs, 0);
  }, [plan]);

  const handleDayUpdated = useCallback((day: TourPlanDay) => {
    setPlan((prev) => prev ? {
      ...prev,
      days: prev.days.some((d) => d.day_number === day.day_number)
        ? prev.days.map((d) => d.day_number === day.day_number ? day : d)
        : [...prev.days, day],
    } : prev);
  }, []);

  const handleEntryAdded = useCallback((entry: TourPlanEntry) => {
    setPlan((prev) => prev ? { ...prev, entries: [...prev.entries, entry] } : prev);
  }, []);

  const handleEntryRemoved = useCallback((entryId: string) => {
    setPlan((prev) => prev ? { ...prev, entries: prev.entries.filter((e) => e.id !== entryId) } : prev);
  }, []);

  const handleSubmit = async () => {
    if (!plan) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitTourPlanApi(plan.id);
      setPlan(res.data.data);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const locked = plan?.status === "SUBMITTED" || plan?.status === "APPROVED";
  const statusCfg = plan ? STATUS_CFG[plan.status] : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-5">
      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#222f36]">Tour Plan</h1>
            <p className="text-sm text-gray-500 mt-0.5">{monthLabel} · ☀ Morning & 🌙 Evening sessions</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {monthlyExpense > 0 && (
              <span className="text-xs font-bold text-[#16a34a] bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
                {monthlyExpense.toLocaleString()} UGX total expenses
              </span>
            )}
            {statusCfg && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            )}
            {plan?.status === "DRAFT" && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                <FiSend className="w-3.5 h-3.5" />
                {submitting ? "Submitting…" : "Submit for Approval"}
              </button>
            )}
          </div>
        </div>

        {/* Validation banners */}
        {plan?.status === "REJECTED" && plan.review_note && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">Rejected: </span>{plan.review_note}
          </div>
        )}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{submitError}</div>
        )}
        {(validation.overPlanned > 0 || validation.underloadedDays > 0) && plan?.status === "DRAFT" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs text-amber-700 font-medium">
            {validation.overPlanned > 0 && (
              <span>⚠ {validation.overPlanned} doctor{validation.overPlanned > 1 ? "s" : ""} over-planned</span>
            )}
            {validation.underloadedDays > 0 && (
              <span>⚠ {validation.underloadedDays} day{validation.underloadedDays > 1 ? "s" : ""} under 15 HCPs</span>
            )}
            {validation.unplanned > 0 && (
              <span>⚠ {validation.unplanned} cycle doctor{validation.unplanned > 1 ? "s" : ""} not fully scheduled</span>
            )}
          </div>
        )}

        {/* Info banner when no cycle */}
        {!cycle && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
            <strong>No call cycle for {monthLabel}.</strong> Set up your call cycle first — it defines which doctors you plan to visit and how many times. Your tour plan schedules those doctors across specific days.
          </div>
        )}

        {/* Day cards */}
        <div className="space-y-3">
          {workDays.map((date) => (
            <DayCard
              key={date.getDate()}
              date={date}
              dayData={dayMap[date.getDate()] ?? null}
              entries={entryMap[date.getDate()] ?? []}
              cycleItems={cycle?.items ?? []}
              usedCounts={usedCounts}
              planId={plan?.id ?? ""}
              locked={locked}
              onDayUpdated={handleDayUpdated}
              onEntryAdded={handleEntryAdded}
              onEntryRemoved={handleEntryRemoved}
            />
          ))}
        </div>
      </div>

      {/* ── Cycle coverage sidebar ── */}
      <div className="w-[280px] shrink-0 hidden lg:block sticky top-5 self-start">
        <CycleCoveragePanel
          cycleItems={cycle?.items ?? []}
          usedCounts={usedCounts}
        />
      </div>
    </div>
  );
};

export default TourPlan;
