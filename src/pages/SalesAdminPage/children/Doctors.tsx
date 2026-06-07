import { useState, useEffect, useCallback, useRef } from "react";
import { FaUserDoctor, FaMagnifyingGlass, FaPlus, FaXmark, FaCheck } from "react-icons/fa6";
import {
  getDoctorDirectoryApi,
  getCompanyDoctorListApi,
  setDoctorTierApi,
  addDoctorToCompanyApi,
  removeDoctorFromCompanyApi,
} from "../../../services/api";

type Tier = "A" | "B" | "C";
type Tab  = "master" | "mylist";

interface Doctor {
  id: string;
  doctor_name: string;
  town?: string;
  location?: string;
  speciality?: string[];
  company_tier?: { tier: Tier; visit_frequency?: number } | null;
  on_company_list?: boolean;
}

interface CompanyDoctorRow {
  doctor_id: string;
  doctor: Doctor;
}

const TIER_COLOR: Record<Tier, string> = {
  A: "bg-green-100 text-[#16a34a] border-green-200",
  B: "bg-amber-100 text-amber-700 border-amber-200",
  C: "bg-gray-100 text-gray-600 border-gray-200",
};
const TIER_FREQ: Record<Tier, number> = { A: 4, B: 2, C: 1 };
const TIERS: Tier[] = ["A", "B", "C"];

// ─── Shared tier buttons ──────────────────────────────────────────────────────
const TierButtons = ({
  doctorId, currentTier, onSave, saving,
}: { doctorId: string; currentTier?: Tier | null; onSave: (id: string, t: Tier) => void; saving: string | null }) => (
  <div className="flex gap-1 shrink-0">
    {TIERS.map(t => (
      <button
        key={t}
        disabled={saving === doctorId}
        onClick={() => onSave(doctorId, t)}
        className={`w-8 h-8 rounded-lg text-xs font-black border focus-visible:outline-none disabled:opacity-50 ${
          currentTier === t
            ? TIER_COLOR[t]
            : "bg-white text-gray-300 border-gray-200 hover:border-gray-400 hover:text-gray-600"
        }`}
        style={{ transition: "background-color 0.1s, color 0.1s, border-color 0.1s" }}>
        {t}
      </button>
    ))}
  </div>
);

// ─── Page component ───────────────────────────────────────────────────────────
const Doctors = () => {
  const [tab, setTab] = useState<Tab>("master");

  // ── Master list state ──────────────────────────────────────────────────────
  const [masterDocs, setMasterDocs]   = useState<Doctor[]>([]);
  const [masterQ, setMasterQ]         = useState("");
  const [masterPage, setMasterPage]   = useState(1);
  const [masterTotal, setMasterTotal] = useState(0);
  const [masterLoading, setMasterLoading] = useState(false);
  const [adding, setAdding]           = useState<string | null>(null);
  const [removing, setRemoving]       = useState<string | null>(null);
  const masterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── My list state ──────────────────────────────────────────────────────────
  const [myDocs, setMyDocs]     = useState<CompanyDoctorRow[]>([]);
  const [myQ, setMyQ]           = useState("");
  const [myLoading, setMyLoading] = useState(false);
  const [savingTier, setSavingTier] = useState<string | null>(null);

  const LIMIT = 25;

  // ── Load master list ──────────────────────────────────────────────────────
  const loadMaster = useCallback((q: string, page: number) => {
    setMasterLoading(true);
    getDoctorDirectoryApi({ q, page, limit: LIMIT })
      .then(r => {
        setMasterDocs(r.data.data ?? []);
        setMasterTotal(r.data.meta?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setMasterLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "master") return;
    clearTimeout(masterDebounce.current);
    masterDebounce.current = setTimeout(() => {
      setMasterPage(1);
      loadMaster(masterQ, 1);
    }, 350);
    return () => clearTimeout(masterDebounce.current);
  }, [masterQ, tab, loadMaster]);

  useEffect(() => {
    if (tab === "master") loadMaster(masterQ, masterPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterPage]);

  // ── Load my list ──────────────────────────────────────────────────────────
  const loadMyList = useCallback(() => {
    setMyLoading(true);
    getCompanyDoctorListApi({ limit: 200 })
      .then(r => setMyDocs(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setMyLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "mylist") loadMyList();
  }, [tab, loadMyList]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAdd = async (doctorId: string) => {
    setAdding(doctorId);
    try {
      await addDoctorToCompanyApi(doctorId);
      setMasterDocs(prev => prev.map(d => d.id === doctorId ? { ...d, on_company_list: true } : d));
    } catch { alert("Failed to add doctor"); }
    finally { setAdding(null); }
  };

  const handleRemoveFromMaster = async (doctorId: string) => {
    if (!confirm("Remove this doctor from your company list?")) return;
    setRemoving(doctorId);
    try {
      await removeDoctorFromCompanyApi(doctorId);
      setMasterDocs(prev => prev.map(d => d.id === doctorId ? { ...d, on_company_list: false, company_tier: null } : d));
    } catch { alert("Failed to remove doctor"); }
    finally { setRemoving(null); }
  };

  const handleTier = async (doctorId: string, tier: Tier) => {
    setSavingTier(doctorId);
    try {
      await setDoctorTierApi(doctorId, { tier, visit_frequency: TIER_FREQ[tier] });
      // update both lists
      setMasterDocs(prev => prev.map(d => d.id === doctorId ? { ...d, company_tier: { tier, visit_frequency: TIER_FREQ[tier] } } : d));
      setMyDocs(prev => prev.map(row => row.doctor_id === doctorId
        ? { ...row, doctor: { ...row.doctor, company_tier: { tier, visit_frequency: TIER_FREQ[tier] } } }
        : row));
    } catch { alert("Failed to update tier"); }
    finally { setSavingTier(null); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredMyDocs = myQ.length >= 2
    ? myDocs.filter(r =>
        r.doctor.doctor_name?.toLowerCase().includes(myQ.toLowerCase()) ||
        r.doctor.town?.toLowerCase().includes(myQ.toLowerCase())
      )
    : myDocs;

  const tierCounts = { A: 0, B: 0, C: 0, none: 0 };
  for (const r of myDocs) {
    const t = r.doctor.company_tier?.tier;
    if (t === "A" || t === "B" || t === "C") tierCounts[t]++;
    else tierCounts.none++;
  }

  const totalPages = Math.ceil(masterTotal / LIMIT);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">HCP Directory</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Browse the national master list and curate your company's HCP roster
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-green-100 text-[#16a34a] px-2.5 py-1 rounded-full border border-green-200">A: {tierCounts.A}</span>
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">B: {tierCounts.B}</span>
          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">C: {tierCounts.C}</span>
          <span className="bg-white text-gray-400 px-2.5 py-1 rounded-full border border-gray-200">Untiered: {tierCounts.none}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([["master", "Master List"], ["mylist", "My List"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold focus-visible:outline-none ${
              tab === key
                ? "bg-white text-[#1a2530] shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]"
                : "text-gray-500 hover:text-[#1a2530]"
            }`}
            style={{ transition: "background-color 0.1s, color 0.1s" }}>
            {label}
            {key === "mylist" && myDocs.length > 0 && (
              <span className="ml-2 text-[11px] font-bold bg-[#16a34a]/10 text-[#16a34a] px-1.5 py-0.5 rounded-full">
                {myDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Master List Tab ── */}
      {tab === "master" && (
        <>
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" value={masterQ} onChange={e => { setMasterQ(e.target.value); setMasterPage(1); }}
              placeholder="Search by name, town or location…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
            {masterLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
              </div>
            ) : masterDocs.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <FaUserDoctor className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-semibold">No doctors found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {masterDocs.filter(d => d.doctor_name?.trim()).map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                    <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                      <FaUserDoctor className="w-3.5 h-3.5 text-[#16a34a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{d.doctor_name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {[d.location, d.town, d.speciality?.join(", ")].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {d.on_company_list ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <TierButtons doctorId={d.id} currentTier={d.company_tier?.tier} onSave={handleTier} saving={savingTier} />
                        <button
                          onClick={() => handleRemoveFromMaster(d.id)}
                          disabled={removing === d.id}
                          title="Remove from my list"
                          className="text-gray-300 hover:text-red-400 disabled:opacity-40 ml-1"
                          style={{ transition: "color 0.1s" }}>
                          <FaXmark className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(d.id)}
                        disabled={adding === d.id}
                        className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 shrink-0"
                        style={{ transition: "background-color 0.15s" }}>
                        {adding === d.id
                          ? <><div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" /> Adding…</>
                          : <><FaPlus className="w-3 h-3" /> Add</>
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{masterTotal} doctors total · page {masterPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMasterPage(p => Math.max(1, p - 1))}
                  disabled={masterPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-gray-300">
                  ← Prev
                </button>
                <button
                  onClick={() => setMasterPage(p => Math.min(totalPages, p + 1))}
                  disabled={masterPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-gray-300">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── My List Tab ── */}
      {tab === "mylist" && (
        <>
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" value={myQ} onChange={e => setMyQ(e.target.value)}
              placeholder="Search your company doctors…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
            {myLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
              </div>
            ) : filteredMyDocs.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <FaUserDoctor className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-semibold">
                  {myQ ? "No matching doctors" : "No doctors on your company list yet — use Master List to add"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredMyDocs.filter(r => r.doctor?.doctor_name?.trim()).map(r => {
                  const d = r.doctor;
                  return (
                    <div key={r.doctor_id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                      <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                        <FaUserDoctor className="w-3.5 h-3.5 text-[#16a34a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a2530] truncate">{d.doctor_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {[d.town, d.speciality?.join(", ")].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <TierButtons doctorId={r.doctor_id} currentTier={d.company_tier?.tier} onSave={handleTier} saving={savingTier} />
                      {d.company_tier?.tier && (
                        <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block w-10 text-right">
                          {TIER_FREQ[d.company_tier.tier]}x/mo
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Tier A = 4 visits/month · Tier B = 2 visits/month · Tier C = 1 visit/month
          </p>
        </>
      )}
    </div>
  );
};

export default Doctors;
