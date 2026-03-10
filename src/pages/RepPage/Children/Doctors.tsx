import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FaUserDoctor, FaLocationDot, FaPhone } from "react-icons/fa6";
import { MdSearch, MdCheckCircle, MdAddCircleOutline } from "react-icons/md";
import { TbRosette } from "react-icons/tb";
import {
  getDoctorsApi,
  getCurrentCycleApi,
  addCycleItemApi,
  setDoctorTierApi,
} from "../../../services/api";
import LogVisitModal from "../../../componets/LogVisitModal/LogVisitModal";

interface CompanyTier {
  tier: "A" | "B" | "C";
  visit_frequency: number | null;
  notes: string | null;
}

interface Doctor {
  id: string;
  doctor_name: string;
  town: string;
  location: string;
  speciality: string[];
  cadre?: string;
  contact?: string;
  company_tier?: CompanyTier | null;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300" },
  B: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-300" },
  C: { bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-300"  },
};

// ─── Tier popover ────────────────────────────────────────────────────────────
function TierPopover({
  doctorId,
  current,
  onSaved,
}: {
  doctorId: string;
  current: CompanyTier | null | undefined;
  onSaved: (tier: CompanyTier) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<"A" | "B" | "C">(current?.tier ?? "B");
  const [notes, setNotes] = useState(current?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoctorTierApi(doctorId, { tier, notes: notes || undefined });
      onSaved({ tier, visit_frequency: null, notes: notes || null });
      setOpen(false);
    } catch {
      // silently ignore — user can retry
    } finally {
      setSaving(false);
    }
  };

  const style = TIER_STYLES[tier];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Set company tier"
        className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
          current
            ? `${TIER_STYLES[current.tier].bg} ${TIER_STYLES[current.tier].text} ${TIER_STYLES[current.tier].border}`
            : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400"
        }`}
      >
        <TbRosette className="w-3 h-3" />
        {current ? `Tier ${current.tier}` : "Set tier"}
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-52 bg-white rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.14)] border border-gray-100 p-3 flex flex-col gap-2.5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Company tier
          </p>

          {/* Tier selector */}
          <div className="flex gap-1.5">
            {(["A", "B", "C"] as const).map((t) => {
              const s = TIER_STYLES[t];
              return (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                    tier === t
                      ? `${s.bg} ${s.text} ${s.border}`
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Tier legend */}
          <p className="text-[10px] text-gray-400 leading-tight">
            {tier === "A" && "High-prescriber / opinion leader — 4 visits/month"}
            {tier === "B" && "Regular prescriber — 2 visits/month"}
            {tier === "C" && "Low-volume — 1 visit/month"}
          </p>

          {/* Notes */}
          <textarea
            rows={2}
            placeholder="Notes (optional) — e.g. high antibiotic prescriber"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#16a34a] resize-none"
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const Doctors = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [cycleIds, setCycleIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [visitDoctor, setVisitDoctor] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    Promise.all([getDoctorsApi(), getCurrentCycleApi()])
      .then(([docRes, cycleRes]) => {
        setDoctors(docRes.data.data ?? docRes.data ?? []);
        const items: { doctor_id: string }[] = cycleRes.data?.data?.items ?? [];
        setCycleIds(new Set(items.map((i) => i.doctor_id)));
      })
      .catch(() => setError("Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    search.length >= 1
      ? doctors.filter(
          (d) =>
            d.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
            d.town?.toLowerCase().includes(search.toLowerCase()) ||
            d.location?.toLowerCase().includes(search.toLowerCase()) ||
            d.speciality?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
        )
      : doctors;

  const handleAddToCycle = useCallback(
    async (doctorId: string) => {
      if (cycleIds.has(doctorId)) return;
      setAdding((prev) => ({ ...prev, [doctorId]: true }));
      try {
        await addCycleItemApi({ doctor_id: doctorId });
        setCycleIds((prev) => new Set([...prev, doctorId]));
      } catch {
        // silently ignore — user can retry
      } finally {
        setAdding((prev) => ({ ...prev, [doctorId]: false }));
      }
    },
    [cycleIds]
  );

  const handleTierSaved = (doctorId: string, tier: CompanyTier) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, company_tier: tier } : d))
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {visitDoctor && (
        <LogVisitModal
          initialDoctorId={visitDoctor.id}
          initialDoctorLabel={visitDoctor.label}
          onClose={() => setVisitDoctor(null)}
          onSuccess={() => setVisitDoctor(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#222f36]">HCP Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {doctors.length} healthcare professionals on platform
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, town, specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <FaUserDoctor className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-semibold">No HCPs found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => {
            const inCycle = cycleIds.has(doc.id);
            const isAdding = adding[doc.id];
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow shadow-gray-100/80 hover:shadow-md hover:shadow-gray-200/60 p-5 flex flex-col gap-3 transition-shadow"
              >
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <FaUserDoctor className="w-5 h-5 text-[#16a34a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-[#222f36] text-sm leading-snug">
                        {doc.doctor_name}
                      </p>
                      {doc.cadre && doc.cadre !== "Doctor" && (
                        <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-full leading-none">
                          {doc.cadre}
                        </span>
                      )}
                    </div>
                    {doc.speciality?.length > 0 && (
                      <p className="text-xs text-[#16a34a] font-medium mt-0.5">
                        {doc.speciality.join(" · ")}
                      </p>
                    )}
                  </div>
                  {/* Tier popover */}
                  <TierPopover
                    doctorId={doc.id}
                    current={doc.company_tier}
                    onSaved={(tier) => handleTierSaved(doc.id, tier)}
                  />
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaLocationDot className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{doc.location}</span>
                  {doc.town && <span className="text-gray-300">·</span>}
                  {doc.town && (
                    <span className="text-gray-400 flex-shrink-0">{doc.town}</span>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  {doc.contact ? (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FaPhone className="w-3 h-3" />
                      {doc.contact}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-3">
                    {inCycle ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#16a34a]">
                        <MdCheckCircle className="w-4 h-4" />
                        In cycle
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToCycle(doc.id)}
                        disabled={isAdding}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors"
                      >
                        {isAdding ? (
                          <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#16a34a] rounded-full animate-spin inline-block" />
                        ) : (
                          <MdAddCircleOutline className="w-4 h-4" />
                        )}
                        Add to cycle
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setVisitDoctor({
                          id: doc.id,
                          label: `${doc.doctor_name} — ${doc.town}`,
                        })
                      }
                      className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors"
                    >
                      Log Visit →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Doctors;
