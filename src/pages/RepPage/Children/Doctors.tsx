import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FaUserDoctor, FaLocationDot, FaPhone } from "react-icons/fa6";
import { MdSearch, MdCheckCircle, MdAddCircleOutline, MdClose } from "react-icons/md";
import { TbRosette, TbUserPlus, TbBuilding } from "react-icons/tb";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { LuSendHorizontal } from "react-icons/lu";
import {
  getCompanyDoctorListApi,
  getDoctorDirectoryApi,
  getCurrentCycleApi,
  addCycleItemApi,
  setDoctorTierApi,
  recommendDoctorApi,
  reportNewClinicianApi,
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
  on_company_list?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300" },
  B: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-300" },
  C: { bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-300"  },
};

const CADRE_LABELS: Record<string, string> = {
  Doctor: "Doctor", Nurse: "Nurse", Midwife: "Midwife",
  Clinician: "Clinician", Pharmacist: "Pharmacist", Other: "Other",
};

// ─── Tier popover ─────────────────────────────────────────────────────────────
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
      // user can retry
    } finally {
      setSaving(false);
    }
  };

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
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Company tier</p>
          <div className="flex gap-1.5">
            {(["A", "B", "C"] as const).map((t) => {
              const s = TIER_STYLES[t];
              return (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                    tier === t ? `${s.bg} ${s.text} ${s.border}` : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            {tier === "A" && "High-prescriber / opinion leader — 4 visits/month"}
            {tier === "B" && "Regular prescriber — 2 visits/month"}
            {tier === "C" && "Low-volume — 1 visit/month"}
          </p>
          <textarea
            rows={2}
            placeholder="Notes (optional)"
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

// ─── Report New Clinician modal ────────────────────────────────────────────────
function ReportClinicianModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [cadre, setCadre] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await reportNewClinicianApi({
        clinician_name: name.trim(),
        clinician_cadre: cadre || undefined,
        clinician_location: location.trim() || undefined,
        clinician_contact: contact.trim() || undefined,
      });
      onSuccess();
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-black text-[#1a1a1a] text-base">Report New Clinician</h2>
            <p className="text-xs text-gray-400 mt-0.5">Not on KibagRep yet — your supervisor will review and forward to KibagRep for verification.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Full name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. John Okello"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Cadre</label>
            <select
              value={cadre}
              onChange={(e) => setCadre(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] bg-white transition-colors"
            >
              <option value="">Select cadre…</option>
              {Object.keys(CADRE_LABELS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Location / Facility</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kira Health Centre IV"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Contact</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <LuSendHorizontal className="w-4 h-4" />
            )}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Scope = "company" | "all";

const Doctors = () => {
  const [searchParams] = useSearchParams();
  const [scope, setScope] = useState<Scope>("company");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [cycleIds, setCycleIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [recommending, setRecommending] = useState<Record<string, boolean>>({});
  const [recommended, setRecommended] = useState<Set<string>>(new Set());
  const [visitDoctor,   setVisitDoctor]   = useState<{ id: string; label: string } | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const loadDoctors = useCallback((s: Scope) => {
    setLoading(true);
    setError("");
    const fetch = s === "company" ? getCompanyDoctorListApi : getDoctorDirectoryApi;
    Promise.all([fetch(), getCurrentCycleApi()])
      .then(([docRes, cycleRes]) => {
        const raw = docRes.data.data ?? [];
        const normalized: Doctor[] =
          s === "company"
            ? raw.map((cd: any) => ({
                id: cd.doctor.id,
                doctor_name: cd.doctor.doctor_name,
                town: cd.doctor.town,
                location: cd.doctor.location,
                speciality: cd.doctor.speciality ?? [],
                cadre: cd.doctor.cadre,
                contact: cd.doctor.contact,
                company_tier: cd.doctor.company_tier,
                on_company_list: true,
              }))
            : raw;
        setDoctors(normalized);
        const items: { doctor_id: string }[] = cycleRes.data?.data?.items ?? [];
        setCycleIds(new Set(items.map((i) => i.doctor_id)));
      })
      .catch(() => setError("Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDoctors(scope); }, [scope, loadDoctors]);

  // Open profile modal when navigated with highlight=id from sidebar
  const highlightId = searchParams.get("highlight");
  useEffect(() => {
    if (!highlightId || loading || doctors.length === 0) return;
    const doc = doctors.find((d) => d.id === highlightId);
    if (doc) setProfileDoctor(doc);
  }, [highlightId, loading, doctors]);

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
        // user can retry
      } finally {
        setAdding((prev) => ({ ...prev, [doctorId]: false }));
      }
    },
    [cycleIds]
  );

  const handleRecommend = useCallback(async (doctorId: string) => {
    setRecommending((prev) => ({ ...prev, [doctorId]: true }));
    try {
      await recommendDoctorApi(doctorId);
      setRecommended((prev) => new Set([...prev, doctorId]));
    } catch {
      // user can retry
    } finally {
      setRecommending((prev) => ({ ...prev, [doctorId]: false }));
    }
  }, []);

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

      {showReportModal && (
        <ReportClinicianModal
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222f36]">HCP Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${doctors.length} ${scope === "company" ? "approved doctors" : "healthcare professionals"}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope toggle */}
          <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-0.5">
            <button
              onClick={() => setScope("company")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                scope === "company"
                  ? "bg-white text-[#16a34a] shadow-sm shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TbBuilding className="w-3.5 h-3.5" />
              Company List
            </button>
            <button
              onClick={() => setScope("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                scope === "all"
                  ? "bg-white text-[#16a34a] shadow-sm shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
              Full Directory
            </button>
          </div>

          {/* Report new clinician */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            <TbUserPlus className="w-4 h-4" />
            Report New Clinician
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, town, specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors"
        />
      </div>

      {/* Directory scope callout */}
      {scope === "all" && !loading && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <HiOutlineGlobeAlt className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Showing the full KibagRep doctor database. Doctors not on your company list can be <strong>recommended</strong> — your supervisor will review and approve. For clinicians not on the list at all, use <strong>Report New Clinician</strong>.
          </p>
        </div>
      )}

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
          <p className="font-semibold">
            {scope === "company" && !search ? "No approved doctors yet" : "No HCPs found"}
          </p>
          {scope === "company" && !search && (
            <p className="text-sm mt-1 text-center max-w-xs">
              Switch to <strong>Full Directory</strong> to find doctors and recommend them to be added to your company list.
            </p>
          )}
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => {
            const inCycle = cycleIds.has(doc.id);
            const isAdding = adding[doc.id];
            const isOnCompanyList = doc.on_company_list;
            const hasRecommended = recommended.has(doc.id);
            const isRecommending = recommending[doc.id];

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
                      <p className="font-bold text-[#222f36] text-sm leading-snug">{doc.doctor_name}</p>
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
                  {/* Show tier control only for company-list doctors */}
                  {(scope === "company" || isOnCompanyList) && (
                    <TierPopover
                      doctorId={doc.id}
                      current={doc.company_tier}
                      onSaved={(tier) => handleTierSaved(doc.id, tier)}
                    />
                  )}
                  {/* Show approved badge in directory view */}
                  {scope === "all" && isOnCompanyList && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#16a34a] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      <MdCheckCircle className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaLocationDot className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{doc.location}</span>
                  {doc.town && <span className="text-gray-300">·</span>}
                  {doc.town && <span className="text-gray-400 flex-shrink-0">{doc.town}</span>}
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
                    {/* In full-directory view: show Recommend if not on company list */}
                    {scope === "all" && !isOnCompanyList && (
                      hasRecommended ? (
                        <span className="text-xs font-semibold text-amber-600">Recommended ✓</span>
                      ) : (
                        <button
                          onClick={() => handleRecommend(doc.id)}
                          disabled={isRecommending}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors"
                        >
                          {isRecommending ? (
                            <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin inline-block" />
                          ) : (
                            <TbUserPlus className="w-4 h-4" />
                          )}
                          Recommend
                        </button>
                      )
                    )}

                    {/* Add to cycle — only for company-list doctors or approved ones in directory */}
                    {(scope === "company" || isOnCompanyList) && (
                      inCycle ? (
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
                      )
                    )}

                    {/* Log Visit — for company-list doctors */}
                    {(scope === "company" || isOnCompanyList) && (
                      <button
                        onClick={() =>
                          setVisitDoctor({ id: doc.id, label: `${doc.doctor_name} — ${doc.town}` })
                        }
                        className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors"
                      >
                        Log Visit →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Doctor Profile Modal ── */}
      {profileDoctor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a2530] px-5 py-5 flex items-start justify-between">
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">HCP Profile</p>
                <h2 className="text-white text-lg font-black leading-tight">{profileDoctor.doctor_name}</h2>
                {profileDoctor.cadre && <p className="text-white/60 text-xs mt-0.5">{profileDoctor.cadre}</p>}
              </div>
              <button onClick={() => setProfileDoctor(null)} className="text-white/60 hover:text-white focus-visible:outline-none ml-2">
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            {/* Details */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {profileDoctor.speciality?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Speciality</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileDoctor.speciality.map((s) => (
                      <span key={s} className="text-xs font-medium bg-[#f0fdf4] text-[#16a34a] px-2.5 py-0.5 rounded-full border border-[#dcfce7]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {profileDoctor.location && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Facility</p>
                    <p className="text-xs font-semibold text-[#222f36] mt-0.5">{profileDoctor.location}</p>
                  </div>
                )}
                {profileDoctor.town && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Town</p>
                    <p className="text-xs font-semibold text-[#222f36] mt-0.5">{profileDoctor.town}</p>
                  </div>
                )}
                {profileDoctor.contact && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                    <p className="text-xs font-semibold text-[#222f36] mt-0.5">{profileDoctor.contact}</p>
                  </div>
                )}
                {profileDoctor.company_tier?.tier && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tier</p>
                    <span className={`inline-block mt-0.5 text-xs font-black px-2.5 py-0.5 rounded-full ${TIER_STYLES[profileDoctor.company_tier.tier]?.bg ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      Tier {profileDoctor.company_tier.tier}
                    </span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setVisitDoctor({ id: profileDoctor.id, label: profileDoctor.doctor_name }); setProfileDoctor(null); }}
                  className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold py-2.5 rounded-xl focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  Log Visit
                </button>
                <button onClick={() => setProfileDoctor(null)}
                  className="px-4 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold py-2.5 rounded-xl focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
