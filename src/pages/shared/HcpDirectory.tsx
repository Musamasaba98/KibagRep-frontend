import { useEffect, useState, useMemo } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { LuSearch, LuUserCheck, LuSendHorizontal, LuStethoscope, LuBuilding2 } from "react-icons/lu";
import { TbUserQuestion, TbUserCheck } from "react-icons/tb";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  getCompanyDoctorListApi,
  getDoctorDirectoryApi,
  getRecommendationsApi,
  approveRecommendationApi,
  rejectRecommendationApi,
  forwardRecommendationApi,
} from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyDoc {
  company_id: string;
  doctor_id: string;
  doctor: {
    id: string;
    doctor_name: string;
    town?: string;
    location?: string;
    speciality?: string[];
    cadre?: string;
    contact?: string;
    company_tier?: { tier: string; visit_frequency?: number; notes?: string } | null;
  };
  added_at: string;
}

interface DirectoryDoc {
  id: string;
  doctor_name: string;
  town?: string;
  location?: string;
  speciality?: string[];
  cadre?: string;
  contact?: string;
  on_company_list: boolean;
}

interface Recommendation {
  id: string;
  status: string;
  created_at: string;
  doctor?: { id: string; doctor_name: string; town?: string };
  doctor_id?: string;
  clinician_name?: string;
  clinician_cadre?: string;
  clinician_location?: string;
  clinician_contact?: string;
  unplanned_visit_count: number;
  user?: { id: string; firstname: string; lastname: string };
}

type Tab = "company" | "directory" | "recommendations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) => {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const CadreChip = ({ cadre }: { cadre?: string }) => {
  if (!cadre) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
      {cadre}
    </span>
  );
};

const DocAvatar = ({ name, small }: { name: string; small?: boolean }) => (
  <div
    className={`rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0 ${
      small ? "w-8 h-8" : "w-10 h-10"
    }`}
  >
    <span className={`text-[#16a34a] font-black ${small ? "text-xs" : "text-sm"}`}>
      {initials(name)}
    </span>
  </div>
);

const Spinner = () => (
  <div className="flex items-center gap-3 px-6 py-8 text-gray-400 text-sm">
    <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
    Loading…
  </div>
);

const EmptyState = ({ message, sub }: { message: string; sub: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <LuStethoscope className="w-10 h-10 text-gray-200 mb-3" />
    <p className="text-gray-500 font-semibold text-sm">{message}</p>
    <p className="text-gray-400 text-xs mt-1">{sub}</p>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const HcpDirectory = () => {
  const [tab, setTab] = useState<Tab>("company");
  const [search, setSearch] = useState("");
  const [companyDocs, setCompanyDocs] = useState<CompanyDoc[]>([]);
  const [directoryDocs, setDirectoryDocs] = useState<DirectoryDoc[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.allSettled([
      getCompanyDoctorListApi(),
      getDoctorDirectoryApi(),
      getRecommendationsApi(),
    ]).then(([cRes, dRes, rRes]) => {
      if (cRes.status === "fulfilled") setCompanyDocs(cRes.value.data?.data ?? []);
      if (dRes.status === "fulfilled") setDirectoryDocs(dRes.value.data?.data ?? []);
      if (rRes.status === "fulfilled") setRecommendations(rRes.value.data?.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const q = search.toLowerCase();

  const filteredCompany = useMemo(
    () =>
      companyDocs.filter((d) =>
        d.doctor &&
        (
          (d.doctor.doctor_name ?? "").toLowerCase().includes(q) ||
          (d.doctor.town ?? "").toLowerCase().includes(q)
        )
      ),
    [companyDocs, q]
  );

  const filteredDirectory = useMemo(
    () =>
      directoryDocs.filter((d) =>
        (d.doctor_name ?? "").toLowerCase().includes(q) ||
        (d.town ?? "").toLowerCase().includes(q)
      ),
    [directoryDocs, q]
  );

  const filteredRecs = useMemo(
    () =>
      recommendations.filter((r) => {
        const name = r.doctor?.doctor_name ?? r.clinician_name ?? "";
        return name.toLowerCase().includes(q);
      }),
    [recommendations, q]
  );

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveRecommendationApi(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      loadData(); // refresh company list too
    } catch {
      setError("Failed to approve recommendation.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejection:");
    if (!note) return;
    setActioning(id);
    try {
      await rejectRecommendationApi(id, note);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to reject recommendation.");
    } finally {
      setActioning(null);
    }
  };

  const handleForward = async (id: string) => {
    setActioning(id);
    try {
      await forwardRecommendationApi(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to forward recommendation.");
    } finally {
      setActioning(null);
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "company", label: "Company List", count: companyDocs.length },
    { key: "directory", label: "Full Directory", count: directoryDocs.length },
    {
      key: "recommendations",
      label: "Recommendations",
      count: recommendations.length,
    },
  ];

  return (
    <div className="w-full p-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">HCP Directory</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Company doctor list, full KibagRep directory, and pending recommendations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold focus-visible:outline-none transition-colors ${
                tab === key
                  ? "text-[#16a34a] border-b-2 border-[#16a34a] bg-[#f0fdf4]/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/60"
              }`}
            >
              {label}
              {count !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    tab === key
                      ? "bg-[#16a34a] text-white"
                      : key === "recommendations" && count > 0
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {loading ? "…" : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Search bar ── */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20">
            <LuSearch className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              placeholder={
                tab === "company"
                  ? "Search company doctors…"
                  : tab === "directory"
                  ? "Search all HCPs…"
                  : "Search recommendations…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tab content ── */}

        {/* Company List */}
        {tab === "company" && (
          loading ? (
            <Spinner />
          ) : filteredCompany.length === 0 ? (
            <EmptyState
              message={search ? "No doctors match your search" : "No doctors on company list"}
              sub={search ? "Try a different name or town" : "Approve recommendations to add doctors to your list"}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredCompany.map((d) => (
                <div key={d.doctor_id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60">
                  <DocAvatar name={d.doctor.doctor_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1a1a1a] text-sm">{d.doctor.doctor_name}</p>
                      <CadreChip cadre={d.doctor.cadre} />
                      {d.doctor.company_tier?.tier && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                          d.doctor.company_tier.tier === "A"
                            ? "bg-[#f0fdf4] border-[#dcfce7] text-[#16a34a]"
                            : d.doctor.company_tier.tier === "B"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}>
                          Tier {d.doctor.company_tier.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[d.doctor.town, d.doctor.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {d.doctor.speciality && d.doctor.speciality.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {d.doctor.speciality.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-[#16a34a] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <LuUserCheck className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-[11px] font-semibold text-[#16a34a]">On List</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Full Directory */}
        {tab === "directory" && (
          loading ? (
            <Spinner />
          ) : filteredDirectory.length === 0 ? (
            <EmptyState
              message={search ? "No HCPs match your search" : "No HCPs in directory"}
              sub="The KibagRep master directory will appear here"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredDirectory.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60">
                  <DocAvatar name={d.doctor_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1a1a1a] text-sm">{d.doctor_name}</p>
                      <CadreChip cadre={d.cadre} />
                      {d.on_company_list && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-[#16a34a] font-bold">
                          ✓ On List
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[d.town, d.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {d.speciality && d.speciality.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {d.speciality.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <LuBuilding2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Recommendations */}
        {tab === "recommendations" && (
          loading ? (
            <Spinner />
          ) : filteredRecs.length === 0 ? (
            <EmptyState
              message={search ? "No recommendations match your search" : "No pending recommendations"}
              sub="When reps recommend doctors, they'll appear here for review"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRecs.map((rec) => {
                const isActioning = actioning === rec.id;
                const isNewClinician = !rec.doctor_id;
                const name = rec.doctor?.doctor_name ?? rec.clinician_name ?? "Unknown";

                return (
                  <div key={rec.id} className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-100">
                        {isNewClinician
                          ? <TbUserQuestion className="w-5 h-5 text-amber-500" />
                          : <TbUserCheck className="w-5 h-5 text-[#16a34a]" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#1a1a1a] text-sm">{name}</p>
                          {isNewClinician && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-bold">
                              New Clinician
                            </span>
                          )}
                          {rec.clinician_cadre && (
                            <CadreChip cadre={rec.clinician_cadre} />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {(rec.doctor?.town ?? rec.clinician_location) && (
                            <p className="text-xs text-gray-400">
                              {rec.doctor?.town ?? rec.clinician_location}
                            </p>
                          )}
                          {rec.clinician_contact && (
                            <p className="text-xs text-gray-400">{rec.clinician_contact}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {rec.user && (
                            <span className="text-[11px] text-gray-400">
                              Recommended by{" "}
                              <span className="font-semibold text-gray-600">
                                {rec.user.firstname} {rec.user.lastname}
                              </span>
                            </span>
                          )}
                          {rec.unplanned_visit_count > 0 && (
                            <span className="text-[11px] text-sky-600 font-semibold">
                              {rec.unplanned_visit_count} unplanned visit{rec.unplanned_visit_count > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-14">
                      {isActioning ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
                      ) : (
                        <>
                          {!isNewClinician && (
                            <button
                              onClick={() => handleApprove(rec.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                              style={{ transition: "background-color 0.15s" }}
                            >
                              <FiCheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {isNewClinician && (
                            <button
                              onClick={() => handleForward(rec.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                              style={{ transition: "background-color 0.15s" }}
                            >
                              <LuSendHorizontal className="w-3.5 h-3.5" />
                              Forward to KibagRep
                            </button>
                          )}
                          <button
                            onClick={() => handleReject(rec.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                            style={{ transition: "background-color 0.15s" }}
                          >
                            <FiXCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default HcpDirectory;
