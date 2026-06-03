import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { LuSearch, LuUserCheck, LuSendHorizontal, LuStethoscope, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { TbUserQuestion, TbUserCheck } from "react-icons/tb";
import { MdOutlineWarningAmber } from "react-icons/md";
import { FaUserDoctor } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
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

const PAGE_SIZE = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CadreChip = ({ cadre }: { cadre?: string }) => {
  if (!cadre) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-poppins-semibold">
      {cadre}
    </span>
  );
};

const Spinner = () => (
  <div className="flex items-center gap-3 px-6 py-12 text-gray-400 text-sm">
    <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
    Loading…
  </div>
);

const EmptyState = ({ message, sub }: { message: string; sub: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <LuStethoscope className="w-10 h-10 text-gray-200 mb-3" />
    <p className="text-gray-500 font-poppins-semibold text-sm">{message}</p>
    <p className="text-gray-400 font-poppins text-xs mt-1">{sub}</p>
  </div>
);

// ─── Doctor card (grid layout) ─────────────────────────────────────────────────

const DoctorCard = ({
  name, cadre, town, location, speciality, contact,
  badge, tierBadge,
}: {
  name: string; cadre?: string; town?: string; location?: string;
  speciality?: string[]; contact?: string;
  badge?: React.ReactNode; tierBadge?: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2.5 hover:shadow-sm hover:border-[#dcfce7]"
    style={{ transition: "box-shadow 0.15s, border-color 0.15s" }}>
    {/* Top row */}
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
        <FaUserDoctor className="w-5 h-5 text-[#16a34a]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-poppins-semibold text-[#1a1a1a] text-sm leading-tight truncate">{name}</p>
          <CadreChip cadre={cadre} />
        </div>
        {speciality && speciality.length > 0 && (
          <p className="text-xs font-poppins text-[#16a34a] mt-0.5 truncate">
            {speciality.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
      {tierBadge}
    </div>

    {/* Location */}
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <FaLocationDot className="w-3 h-3 text-gray-300 shrink-0" />
      <span className="truncate font-poppins">
        {[location, town].filter(Boolean).join(" · ") || "—"}
      </span>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
      {contact
        ? <span className="text-[10px] font-poppins text-gray-400 truncate">{contact}</span>
        : <span />}
      {badge}
    </div>
  </div>
);

// ─── Pagination bar ───────────────────────────────────────────────────────────

const Pagination = ({
  page, totalPages, total, onPage,
}: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  const withEllipsis = pages.reduce<(number | "…")[]>((acc, p, i, arr) => {
    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
    acc.push(p);
    return acc;
  }, []);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-gray-50">
      <p className="text-xs font-poppins text-gray-400">
        Showing {from}–{to} of <span className="font-poppins-semibold text-gray-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-none">
          <LuChevronLeft className="w-3.5 h-3.5" />
        </button>
        {withEllipsis.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-gray-300 text-xs">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)}
              className={`w-7 h-7 rounded-lg text-xs font-poppins-semibold border focus-visible:outline-none ${
                p === page ? "bg-[#16a34a] border-[#16a34a] text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-none">
          <LuChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const HcpDirectory = () => {
  const [tab, setTab] = useState<Tab>("company");
  const [search, setSearch] = useState("");

  // Company list state (small, client-side filter)
  const [companyDocs, setCompanyDocs] = useState<CompanyDoc[]>([]);

  // Directory state (server-side pagination + search)
  const [directoryDocs, setDirectoryDocs] = useState<DirectoryDoc[]>([]);
  const [dirPage, setDirPage]       = useState(1);
  const [dirTotal, setDirTotal]     = useState(0);
  const [dirTotalPages, setDirTotalPages] = useState(1);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dirLoading, setDirLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load company list + recommendations once
  const loadInitial = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyDoctorListApi({ limit: 200 }),
      getRecommendationsApi(),
    ]).then(([cRes, rRes]) => {
      if (cRes.status === "fulfilled") setCompanyDocs(cRes.value.data?.data ?? []);
      if (rRes.status === "fulfilled") setRecommendations(rRes.value.data?.data ?? []);
      setLoading(false);
    });
  }, []);

  // Load directory with pagination + server-side search
  const loadDirectory = useCallback((page: number, q: string) => {
    setDirLoading(true);
    getDoctorDirectoryApi({ page, limit: PAGE_SIZE, ...(q.trim() ? { q: q.trim() } : {}) })
      .then((res) => {
        const raw  = res.data?.data ?? [];
        const meta = res.data?.meta ?? {};
        setDirectoryDocs(raw.map((d: any) => ({
          id:             d.id,
          doctor_name:    d.doctor_name,
          town:           d.town,
          location:       d.location,
          speciality:     d.speciality ?? [],
          cadre:          d.cadre,
          contact:        d.contact,
          on_company_list: (d.company_doctors?.length ?? 0) > 0,
        })));
        setDirTotal(meta.total ?? raw.length);
        setDirTotalPages(meta.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setDirLoading(false));
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // Load directory when tab switches to it, or page changes
  useEffect(() => {
    if (tab === "directory") loadDirectory(dirPage, search);
  }, [tab, dirPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search for directory tab
  useEffect(() => {
    if (tab !== "directory") return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDirPage(1);
      loadDirectory(1, search);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = search.toLowerCase();

  const filteredCompany = useMemo(
    () => companyDocs.filter((d) =>
      d.doctor &&
      ((d.doctor.doctor_name ?? "").toLowerCase().includes(q) ||
       (d.doctor.town ?? "").toLowerCase().includes(q))
    ),
    [companyDocs, q]
  );

  const filteredRecs = useMemo(
    () => recommendations.filter((r) => {
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
      loadInitial();
    } catch { setError("Failed to approve recommendation."); }
    finally { setActioning(null); }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejection:");
    if (!note) return;
    setActioning(id);
    try {
      await rejectRecommendationApi(id, note);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch { setError("Failed to reject recommendation."); }
    finally { setActioning(null); }
  };

  const handleForward = async (id: string) => {
    setActioning(id);
    try {
      await forwardRecommendationApi(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch { setError("Failed to forward recommendation."); }
    finally { setActioning(null); }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "company",         label: "Company List",    count: companyDocs.length },
    { key: "directory",       label: "Full Directory",  count: dirTotal || undefined },
    { key: "recommendations", label: "Recommendations", count: recommendations.length },
  ];

  return (
    <div className="w-full p-4 md:p-6 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl tracking-tight">HCP Directory</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">
          Company doctor list, full KibagRep directory, and pending recommendations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Tab bar + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(({ key, label, count }) => (
            <button key={key}
              onClick={() => { setTab(key); setSearch(""); setDirPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-poppins sm:font-poppins-semibold focus-visible:outline-none transition-colors ${
                tab === key
                  ? "text-[#16a34a] border-b-2 border-[#16a34a] bg-[#f0fdf4]/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/60"
              }`}>
              {label}
              {count !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-poppins ${
                  tab === key ? "bg-[#16a34a] text-white"
                  : key === "recommendations" && count > 0 ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {loading || dirLoading ? "…" : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20">
            <LuSearch className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none font-poppins text-sm text-gray-700 placeholder:text-gray-400"
              placeholder={
                tab === "company" ? "Search company doctors…"
                : tab === "directory" ? "Search all HCPs by name or town…"
                : "Search recommendations…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Company List ── */}
        {tab === "company" && (
          loading ? <Spinner /> :
          filteredCompany.length === 0 ? (
            <EmptyState
              message={search ? "No doctors match your search" : "No doctors on company list"}
              sub={search ? "Try a different name or town" : "Approve recommendations to add doctors"}
            />
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCompany.map((d) => (
                <DoctorCard
                  key={d.doctor_id}
                  name={d.doctor.doctor_name}
                  cadre={d.doctor.cadre}
                  town={d.doctor.town}
                  location={d.doctor.location}
                  speciality={d.doctor.speciality}
                  contact={d.doctor.contact}
                  tierBadge={d.doctor.company_tier?.tier ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-poppins-bold border ${
                      d.doctor.company_tier.tier === "A" ? "bg-[#f0fdf4] border-[#dcfce7] text-[#16a34a]"
                      : d.doctor.company_tier.tier === "B" ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}>
                      Tier {d.doctor.company_tier.tier}
                    </span>
                  ) : undefined}
                  badge={
                    <span className="flex items-center gap-1 text-[11px] font-poppins-semibold text-[#16a34a]">
                      <LuUserCheck className="w-3.5 h-3.5" /> On List
                    </span>
                  }
                />
              ))}
            </div>
          )
        )}

        {/* ── Full Directory ── */}
        {tab === "directory" && (
          dirLoading ? <Spinner /> :
          directoryDocs.length === 0 ? (
            <EmptyState
              message={search ? "No HCPs match your search" : "No HCPs in directory"}
              sub={search ? "Try a different name or town" : "The KibagRep master directory will appear here"}
            />
          ) : (
            <>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {directoryDocs.map((d) => (
                  <DoctorCard
                    key={d.id}
                    name={d.doctor_name}
                    cadre={d.cadre}
                    town={d.town}
                    location={d.location}
                    speciality={d.speciality}
                    contact={d.contact}
                    badge={
                      d.on_company_list ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-[#16a34a] font-poppins-bold">
                          ✓ On List
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </div>
              <Pagination
                page={dirPage}
                totalPages={dirTotalPages}
                total={dirTotal}
                onPage={(p) => { setDirPage(p); }}
              />
            </>
          )
        )}

        {/* ── Recommendations ── */}
        {tab === "recommendations" && (
          loading ? <Spinner /> :
          filteredRecs.length === 0 ? (
            <EmptyState
              message={search ? "No recommendations match your search" : "No pending recommendations"}
              sub="When reps recommend doctors, they'll appear here for review"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRecs.map((rec) => {
                const isActioning   = actioning === rec.id;
                const isNewClinician = !rec.doctor_id;
                const name = rec.doctor?.doctor_name ?? rec.clinician_name ?? "Unknown";
                return (
                  <div key={rec.id} className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 border border-amber-100">
                        {isNewClinician
                          ? <TbUserQuestion className="w-5 h-5 text-amber-500" />
                          : <TbUserCheck className="w-5 h-5 text-[#16a34a]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-poppins-semibold text-[#1a1a1a] text-sm">{name}</p>
                          {isNewClinician && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-poppins-bold">New Clinician</span>
                          )}
                          {rec.clinician_cadre && <CadreChip cadre={rec.clinician_cadre} />}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {(rec.doctor?.town ?? rec.clinician_location) && (
                            <p className="text-xs font-poppins text-gray-400">{rec.doctor?.town ?? rec.clinician_location}</p>
                          )}
                          {rec.clinician_contact && <p className="text-xs font-poppins text-gray-400">{rec.clinician_contact}</p>}
                        </div>
                        {rec.user && (
                          <p className="text-[11px] font-poppins text-gray-400 mt-1">
                            Recommended by <span className="font-poppins-semibold text-gray-600">{rec.user.firstname} {rec.user.lastname}</span>
                            {rec.unplanned_visit_count > 0 && (
                              <> · <span className="text-sky-600 font-semibold">{rec.unplanned_visit_count} unplanned visit{rec.unplanned_visit_count > 1 ? "s" : ""}</span></>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-14">
                      {isActioning ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
                      ) : (
                        <>
                          {!isNewClinician && (
                            <button onClick={() => handleApprove(rec.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {isNewClinician && (
                            <button onClick={() => handleForward(rec.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white focus-visible:outline-none">
                              <LuSendHorizontal className="w-3.5 h-3.5" /> Forward to KibagRep
                            </button>
                          )}
                          <button onClick={() => handleReject(rec.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-none">
                            <FiXCircle className="w-3.5 h-3.5" /> Reject
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
