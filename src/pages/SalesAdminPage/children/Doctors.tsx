import { useState, useEffect } from "react";
import { FaUserDoctor, FaMagnifyingGlass } from "react-icons/fa6";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getCompanyDoctorListApi, setDoctorTierApi } from "../../../services/api";

const PAGE_SIZE = 30;

type Tier = "A" | "B" | "C";

interface Doctor {
  id: string;
  doctor_name: string;
  town?: string;
  speciality?: string[];
  company_tier?: { tier: Tier; visit_frequency?: number } | null;
}

const TIER_COLOR: Record<Tier, string> = {
  A: "bg-green-100 text-[#16a34a] border-green-200",
  B: "bg-amber-100 text-amber-700 border-amber-200",
  C: "bg-gray-100 text-gray-600 border-gray-200",
};

const TIER_FREQ: Record<Tier, number> = { A: 4, B: 2, C: 1 };

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({ total: 0, pages: 1 });
  const [saving, setSaving]   = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    getCompanyDoctorListApi({ q: debouncedQ || undefined, page, limit: PAGE_SIZE })
      .then(r => {
        setDoctors(r.data.data ?? []);
        if (r.data?.meta) setMeta({ total: r.data.meta.total, pages: r.data.meta.pages });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQ, page]);

  const handleTier = async (doctorId: string, tier: Tier) => {
    setSaving(doctorId);
    try {
      await setDoctorTierApi(doctorId, { tier, visit_frequency: TIER_FREQ[tier] });
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, company_tier: { tier, visit_frequency: TIER_FREQ[tier] } } : d));
    } catch { alert("Failed to update tier"); }
    finally { setSaving(null); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">HCP Directory</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${meta.total} doctors · assign A/B/C tiers`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search by name or town…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaUserDoctor className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{q ? "No matching doctors" : "No doctors in your company list"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {doctors.map(d => {
              const tier = d.company_tier?.tier;
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                    <FaUserDoctor className="w-3.5 h-3.5 text-[#16a34a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2530] truncate">{d.doctor_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[d.town, d.speciality?.join(", ")].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {/* Tier selector */}
                  <div className="flex gap-1 shrink-0">
                    {(["A","B","C"] as Tier[]).map(t => (
                      <button key={t} disabled={saving === d.id}
                        onClick={() => handleTier(d.id, t)}
                        className={`w-8 h-8 rounded-lg text-xs font-black border focus-visible:outline-none disabled:opacity-50 ${
                          tier === t ? TIER_COLOR[t] : "bg-white text-gray-300 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                        }`}
                        style={{ transition: "all 0.1s" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {tier && (
                    <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                      {TIER_FREQ[tier]}x/mo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Page {page} of {meta.pages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.12s" }}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.pages || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.12s" }}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Tier A = 4 visits/month · Tier B = 2 visits/month · Tier C = 1 visit/month
      </p>
    </div>
  );
};

export default Doctors;
