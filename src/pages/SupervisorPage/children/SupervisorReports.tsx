import { useEffect, useState, useCallback } from "react";
import { LuFileText, LuChevronDown, LuChevronUp, LuCheck, LuX, LuUsers, LuBeaker, LuClock, LuActivity, LuDownload } from "react-icons/lu";
import DownloadReportWidget from "../../../componets/DownloadReportWidget/DownloadReportWidget";
import { MdOutlineWarningAmber } from "react-icons/md";
import { TbActivityHeartbeat, TbPill } from "react-icons/tb";
import {
  getCompanyReportsApi, approveReportApi, rejectReportApi, getDailyReportActivitiesApi,
  getTeamPerformanceApi, getTeamSampleBalancesFullApi,
  getPendingLateRequestsApi, approveLateRequestApi, rejectLateRequestApi,
  getJfwReportsApi,
} from "../../../services/api";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface Report {
  id: string; report_date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  visits_count: number; samples_count: number;
  summary: string | null; review_note: string | null;
  jfw_observer_id: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
}
interface Activity {
  id: string; activity_type: "doctor" | "pharmacy";
  visit_type?: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given?: number; nca_reason?: string | null; gps_anomaly_flag?: boolean;
  doctor?: { doctor_name: string; location?: string; town?: string } | null;
  pharmacy?: { pharmacy_name: string; location?: string; town?: string } | null;
  focused_product?: { id: string; product_name: string } | null;
  date: string;
}
interface RepPerf {
  user: { id: string; firstname: string; lastname: string };
  today_visits: number; week_visits: number; month_visits: number;
  cycle_adherence_pct: number | null; gps_anomaly_count: number;
  pending_reports: number; pending_expenses: number;
  days_since_last_visit: number | null;
}
interface SampleRow {
  id: string;
  user: { id: string; firstname: string; lastname: string };
  product: { id: string; product_name: string };
  issued: number; given: number;
}
interface LateReq {
  id: string; type: string; month: number; year: number;
  note: string; status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string; review_note: string | null;
  user: { id: string; firstname: string; lastname: string };
}
interface JfwReport {
  id: string; report_date: string;
  jfw_score: Record<string, number> | null; jfw_overall: number | null;
  jfw_notes: string | null; jfw_scored_at: string | null;
  user: { id: string; firstname: string; lastname: string };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

type StatusTab = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL";
type Days = 7 | 30 | 60;
type MainTab = "reports" | "team" | "late" | "samples" | "jfw" | "download";

const INITIALS = (u: { firstname: string; lastname: string }) =>
  `${u.firstname?.[0] ?? ""}${u.lastname?.[0] ?? ""}`.toUpperCase();

const FMT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS = {
  SUBMITTED: { bg: "bg-amber-50",    text: "text-amber-700",   label: "Pending"  },
  APPROVED:  { bg: "bg-[#f0fdf4]",   text: "text-[#16a34a]",   label: "Approved" },
  REJECTED:  { bg: "bg-red-50",      text: "text-red-600",     label: "Rejected" },
  DRAFT:     { bg: "bg-gray-100",    text: "text-gray-500",    label: "Draft"    },
} as const;

const VTYPE: Record<string, string> = {
  PLANNED:   "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  UNPLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  NCA:       "bg-amber-50 text-amber-700 border-amber-200",
};

const Spinner = () => (
  <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
);

const Empty = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center py-14">
    <LuFileText className="w-10 h-10 text-gray-200 mb-3" />
    <p className="text-gray-500 font-poppins-semibold text-sm">{text}</p>
  </div>
);

// ─── Reject inline input ──────────────────────────────────────────────────────

const RejectInput = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-poppins-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-none"
      style={{ transition: "background-color 0.15s" }}>
      <LuX className="w-3.5 h-3.5" /> Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <input autoFocus type="text" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Reason…"
        className="flex-1 text-xs font-poppins border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 min-w-[120px]" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700">Send</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 font-poppins hover:text-gray-600">Cancel</button>
    </div>
  );
};

// ─── Tab: Daily Reports ───────────────────────────────────────────────────────

const ReportsTab = () => {
  const [tab, setTab]       = useState<StatusTab>("SUBMITTED");
  const [days, setDays]     = useState<Days>(30);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [acts, setActs]           = useState<Record<string, Activity[]>>({});
  const [loadingAct, setLoadingAct] = useState<string | null>(null);
  const [actioning, setActioning]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    const sp = tab === "ALL" ? "SUBMITTED,APPROVED,REJECTED" : tab;
    getCompanyReportsApi(`days=${days}&status=${sp}`)
      .then((r) => setReports(r.data?.data ?? []))
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, [tab, days]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (acts[id]) return;
    setLoadingAct(id);
    try {
      const r = await getDailyReportActivitiesApi(id);
      setActs((p) => ({ ...p, [id]: r.data?.data ?? [] }));
    } catch { setActs((p) => ({ ...p, [id]: [] })); }
    finally { setLoadingAct(null); }
  };

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveReportApi(id);
      setReports((p) => p.map((r) => r.id === id ? { ...r, status: "APPROVED" as const } : r));
    } catch { setError("Failed to approve."); }
    finally { setActioning(null); }
  };

  const handleReject = async (id: string, reason: string) => {
    setActioning(id);
    try {
      await rejectReportApi(id, { note: reason });
      setReports((p) => p.map((r) => r.id === id ? { ...r, status: "REJECTED" as const, review_note: reason } : r));
    } catch { setError("Failed to reject."); }
    finally { setActioning(null); }
  };

  const pendingCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const TABS: { key: StatusTab; label: string }[] = [
    { key: "SUBMITTED", label: "Pending" }, { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" }, { key: "ALL", label: "All" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-gray-400 font-poppins text-sm">Daily reports from your team</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 30, 60] as Days[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-poppins-semibold focus-visible:outline-none ${days === d ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={{ transition: "background-color 0.15s" }}>{d}d</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">x</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => { setTab(key); setExpanded(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs sm:text-sm font-poppins sm:font-poppins-semibold focus-visible:outline-none ${tab === key ? "text-[#16a34a] border-b-2 border-[#16a34a] bg-[#f0fdf4]/50" : "text-gray-400 hover:text-gray-600"}`}
              style={{ transition: "color 0.15s" }}>
              {label}
              {key === "SUBMITTED" && pendingCount > 0 && !loading && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-poppins-bold ${tab === "SUBMITTED" ? "bg-[#16a34a] text-white" : "bg-amber-100 text-amber-700"}`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-gray-400 text-sm"><Spinner />Loading reports...</div>
        ) : reports.length === 0 ? (
          <Empty text="No reports found" />
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((rep) => {
              const s = STATUS[rep.status] ?? STATUS.DRAFT;
              const isOpen = expanded === rep.id;
              const isActioning = actioning === rep.id;
              const repActs = acts[rep.id] ?? [];
              return (
                <div key={rep.id}>
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer" onClick={() => toggleExpand(rep.id)}>
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] hidden sm:flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-poppins-bold text-xs">{INITIALS(rep.user)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins-semibold text-[#1a1a1a] text-sm leading-tight">{rep.user.firstname} {rep.user.lastname}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{FMT(rep.report_date)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <span><strong className="text-[#1a1a1a]">{rep.visits_count}</strong> visits</span>
                      <span><strong className="text-[#1a1a1a]">{rep.samples_count}</strong> samples</span>
                    </div>
                    {rep.jfw_observer_id && (
                      <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">JFW</span>
                    )}
                    <span className={`text-[11px] font-poppins-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    <div className="text-gray-400 flex-shrink-0">{isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}</div>
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-4 sm:px-5 py-4 flex flex-col gap-3">
                      {rep.summary && (
                        <p className="text-sm text-gray-600 font-poppins italic bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">"{rep.summary}"</p>
                      )}
                      {rep.review_note && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                          <LuX className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-poppins text-red-700">{rep.review_note}</p>
                        </div>
                      )}
                      {loadingAct === rep.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-1"><div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />Loading visits...</div>
                      ) : repActs.length === 0 ? (
                        <p className="text-xs font-poppins text-gray-400 py-1">No visit activities recorded.</p>
                      ) : (() => {
                        const docActs   = repActs.filter((a) => a.activity_type === "doctor");
                        const pharmActs = repActs.filter((a) => a.activity_type === "pharmacy");
                        const totalSamples = docActs.reduce((s, a) => s + (a.samples_given ?? 0), 0);
                        return (
                          <div className="flex flex-col gap-3">
                            {docActs.length > 0 && (
                              <div className="rounded-xl overflow-hidden border border-[#dcfce7]">
                                <div className="bg-[#16a34a] px-3 py-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <TbActivityHeartbeat className="w-4 h-4 text-white" />
                                    <span className="text-xs font-poppins-bold text-white uppercase tracking-wider">HCP Visits — {docActs.length}</span>
                                  </div>
                                  {totalSamples > 0 && (
                                    <span className="text-[10px] font-poppins-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">{totalSamples} samples total</span>
                                  )}
                                </div>
                                <div className="grid bg-[#f0fdf4] border-b border-[#dcfce7] px-3 py-1.5" style={{ gridTemplateColumns: "1.5rem 1fr 1fr 3.5rem 4rem" }}>
                                  {["#","Doctor / Facility","Products Detailed","Smp","Type"].map((h) => (
                                    <span key={h} className="text-[9px] font-poppins-bold text-[#16a34a] uppercase">{h}</span>
                                  ))}
                                </div>
                                {docActs.map((act, idx) => {
                                  const detailedProducts: { id: string; product_name: string }[] = (act as any).products_detailed ?? [];
                                  const focusedId = act.focused_product?.id;
                                  const allProds = [
                                    ...(act.focused_product ? [{ ...act.focused_product, isFocus: true }] : []),
                                    ...detailedProducts.filter((p) => p.id !== focusedId).map((p) => ({ ...p, isFocus: false })),
                                  ];
                                  return (
                                    <div key={act.id}
                                      className={`grid items-start px-3 py-2 border-b border-gray-50 last:border-0 ${idx % 2 === 1 ? "bg-[#f9fefb]" : "bg-white"}`}
                                      style={{ gridTemplateColumns: "1.5rem 1fr 1fr 3.5rem 4rem" }}>
                                      <span className="text-[10px] font-poppins-bold text-gray-400 pt-0.5">{idx + 1}</span>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-poppins-semibold truncate ${act.nca_reason ? "text-amber-700 italic" : "text-[#1a1a1a]"}`}>
                                          {act.nca_reason ? "NCA — " : ""}{act.doctor?.doctor_name ?? "Unknown"}
                                        </p>
                                        <p className="text-[10px] font-poppins text-gray-400 truncate">
                                          {[act.doctor?.location, act.doctor?.town].filter(Boolean).join(" · ") || "—"}
                                        </p>
                                        {act.nca_reason && <p className="text-[10px] font-poppins text-amber-600 truncate">↳ {act.nca_reason}</p>}
                                        {act.gps_anomaly_flag && <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 mt-0.5">GPS flag</span>}
                                      </div>
                                      <div className="flex flex-wrap gap-1 pt-0.5">
                                        {allProds.length > 0 ? allProds.map((p) => (
                                          <span key={p.id} className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${p.isFocus ? "bg-[#dcfce7] text-[#16a34a] border-[#86efac]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                            {p.isFocus ? "★ " : ""}{p.product_name}
                                          </span>
                                        )) : <span className="text-gray-300 text-[10px]">—</span>}
                                      </div>
                                      <div className="text-center pt-0.5">
                                        {(act.samples_given ?? 0) > 0
                                          ? <span className="text-xs font-poppins-bold text-blue-700">{act.samples_given}</span>
                                          : <span className="text-gray-300 text-[10px]">—</span>}
                                      </div>
                                      <div className="text-center pt-0.5">
                                        {act.visit_type && (
                                          <span className={`text-[9px] font-poppins-bold px-1.5 py-0.5 rounded-full border ${VTYPE[act.visit_type ?? ""] ?? ""}`}>{act.visit_type}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {pharmActs.length > 0 && (
                              <div className="rounded-xl overflow-hidden border border-violet-200">
                                <div className="bg-violet-700 px-3 py-2 flex items-center gap-2">
                                  <TbPill className="w-4 h-4 text-white" />
                                  <span className="text-xs font-poppins-bold text-white uppercase tracking-wider">Pharmacy Coverage — {pharmActs.length}</span>
                                </div>
                                <div className="grid bg-violet-50 border-b border-violet-100 px-3 py-1.5" style={{ gridTemplateColumns: "1fr 5rem 1fr" }}>
                                  {["Pharmacy / Location","Contact","Stock on Shelf"].map((h) => (
                                    <span key={h} className="text-[9px] font-poppins-bold text-violet-700 uppercase">{h}</span>
                                  ))}
                                </div>
                                {pharmActs.map((act, idx) => {
                                  const stockNoted = (act as any).stock_noted ?? {};
                                  const productsInStock: { id: string; product_name: string }[] = (act as any).products_in_stock ?? [];
                                  return (
                                    <div key={act.id}
                                      className={`grid items-start px-3 py-2 border-b border-violet-50 last:border-0 gap-2 ${idx % 2 === 1 ? "bg-violet-50/40" : "bg-white"}`}
                                      style={{ gridTemplateColumns: "1fr 5rem 1fr" }}>
                                      <div className="min-w-0">
                                        <p className="text-xs font-poppins-semibold text-[#1a1a1a] truncate">{act.pharmacy?.pharmacy_name ?? "Unknown"}</p>
                                        <p className="text-[10px] font-poppins text-gray-400 truncate">{[act.pharmacy?.location, act.pharmacy?.town].filter(Boolean).join(" · ") || "—"}</p>
                                      </div>
                                      <div className="text-center">
                                        <span className="text-[10px] font-poppins text-gray-500">{(act.pharmacy as any)?.contact ?? "—"}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {productsInStock.length > 0 ? productsInStock.map((p) => {
                                          const qty = stockNoted[p.id] ?? 0;
                                          return (
                                            <span key={p.id} className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${qty > 0 ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                                              {p.product_name}{qty > 0 ? ` ×${qty}` : ""}
                                            </span>
                                          );
                                        }) : <span className="text-[10px] font-poppins text-gray-300 italic">No stock recorded</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {rep.status === "SUBMITTED" && (
                        <div className="flex items-center gap-2 pt-1">
                          {isActioning ? <Spinner /> : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(rep.id); }}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-poppins-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none"
                                style={{ transition: "background-color 0.15s" }}><LuCheck className="w-3.5 h-3.5" />Approve</button>
                              <RejectInput onConfirm={(note) => handleReject(rep.id, note)} />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Tab: Team Performance ────────────────────────────────────────────────────

const TeamTab = () => {
  const [data, setData]     = useState<RepPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamPerformanceApi()
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-3 py-10 text-gray-400 text-sm px-1"><Spinner />Loading team data...</div>;
  if (data.length === 0) return <Empty text="No reps found in your company" />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-poppins text-gray-400">Activity overview for all reps — current month</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Column headers */}
        <div className="grid bg-[#f0fdf4] border-b border-[#dcfce7] px-4 py-2.5 text-[10px] font-poppins-bold text-[#16a34a] uppercase tracking-wider"
          style={{ gridTemplateColumns: "1fr 3rem 4rem 4.5rem 4.5rem 3.5rem 4rem" }}>
          <span>Rep</span>
          <span className="text-center">Today</span>
          <span className="text-center">Week</span>
          <span className="text-center">Month</span>
          <span className="text-center">Cycle %</span>
          <span className="text-center">GPS ⚠</span>
          <span className="text-center">Pending</span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.map((r, idx) => {
            const cycleColor = r.cycle_adherence_pct == null ? "text-gray-300"
              : r.cycle_adherence_pct >= 80 ? "text-[#16a34a] font-poppins-bold"
              : r.cycle_adherence_pct >= 60 ? "text-amber-600 font-poppins-bold"
              : "text-red-600 font-poppins-bold";
            const daysBadge = r.days_since_last_visit == null ? null
              : r.days_since_last_visit === 0 ? { label: "Today", cls: "bg-[#f0fdf4] text-[#16a34a]" }
              : r.days_since_last_visit <= 2 ? { label: `${r.days_since_last_visit}d ago`, cls: "bg-amber-50 text-amber-700" }
              : { label: `${r.days_since_last_visit}d ago`, cls: "bg-red-50 text-red-600" };
            const pending = (r.pending_reports ?? 0) + (r.pending_expenses ?? 0);
            return (
              <div key={r.user.id}
                className={`grid items-center px-4 py-3 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                style={{ gridTemplateColumns: "1fr 3rem 4rem 4.5rem 4.5rem 3.5rem 4rem" }}>
                <div>
                  <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{r.user.firstname} {r.user.lastname}</p>
                  {daysBadge && (
                    <span className={`text-[10px] font-poppins-semibold px-1.5 py-0.5 rounded-full ${daysBadge.cls}`}>{daysBadge.label}</span>
                  )}
                </div>
                <span className="text-center text-sm font-poppins-bold text-[#1a1a1a]">{r.today_visits ?? 0}</span>
                <span className="text-center text-sm font-poppins text-gray-600">{r.week_visits ?? 0}</span>
                <span className="text-center text-sm font-poppins text-gray-600">{r.month_visits ?? 0}</span>
                <span className={`text-center text-sm ${cycleColor}`}>
                  {r.cycle_adherence_pct != null ? `${r.cycle_adherence_pct}%` : "—"}
                </span>
                <span className={`text-center text-sm font-poppins ${(r.gps_anomaly_count ?? 0) > 0 ? "text-red-600 font-poppins-bold" : "text-gray-300"}`}>
                  {r.gps_anomaly_count ?? 0}
                </span>
                <span className={`text-center text-sm font-poppins ${pending > 0 ? "text-amber-600 font-poppins-bold" : "text-gray-300"}`}>
                  {pending > 0 ? pending : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] font-poppins text-gray-400">
        Cycle % = visits done / total target frequency for this month. GPS ⚠ = anomalies flagged this week.
        Pending = unreviewed reports + expense claims.
      </p>
    </div>
  );
};

// ─── Tab: Late Requests ───────────────────────────────────────────────────────

const LateTab = () => {
  const [data, setData]     = useState<LateReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getPendingLateRequestsApi()
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveLateRequestApi(id);
      setData((p) => p.filter((r) => r.id !== id));
    } catch { /* ignore */ }
    finally { setActioning(null); }
  };

  const handleReject = async (id: string, note: string) => {
    setActioning(id);
    try {
      await rejectLateRequestApi(id, { note });
      setData((p) => p.filter((r) => r.id !== id));
    } catch { /* ignore */ }
    finally { setActioning(null); }
  };

  if (loading) return <div className="flex items-center gap-3 py-10 text-gray-400 text-sm px-1"><Spinner />Loading requests...</div>;
  if (data.length === 0) return <Empty text="No pending late requests" />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-poppins text-gray-400">Reps requesting permission to submit after the deadline</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {data.map((req) => (
          <div key={req.id} className="px-5 py-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{req.user.firstname} {req.user.lastname}</p>
                <p className="text-xs font-poppins text-gray-400 mt-0.5">
                  {req.type.replace("_", " ")} — {new Date(2000, req.month - 1).toLocaleString("default", { month: "long" })} {req.year}
                </p>
              </div>
              <span className="text-[11px] font-poppins-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex-shrink-0">Pending</span>
            </div>
            <p className="text-sm font-poppins text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 italic">
              "{req.note}"
            </p>
            <div className="flex items-center gap-2">
              {actioning === req.id ? <Spinner /> : (
                <>
                  <button onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-poppins-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none"
                    style={{ transition: "background-color 0.15s" }}>
                    <LuCheck className="w-3.5 h-3.5" />Approve
                  </button>
                  <RejectInput onConfirm={(note) => handleReject(req.id, note)} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Sample Balances ─────────────────────────────────────────────────────

const SamplesTab = () => {
  const [data, setData]     = useState<SampleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamSampleBalancesFullApi()
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-3 py-10 text-gray-400 text-sm px-1"><Spinner />Loading balances...</div>;
  if (data.length === 0) return <Empty text="No sample records yet" />;

  // Group by product for a cleaner view
  const byProduct: Record<string, SampleRow[]> = {};
  data.forEach((row) => {
    const key = row.product?.product_name ?? "Unknown";
    (byProduct[key] = byProduct[key] ?? []).push(row);
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-poppins text-gray-400">Issued / given / remaining for every rep on your team</p>
      {Object.entries(byProduct).map(([product, rows]) => {
        const totalIssued    = rows.reduce((s, r) => s + r.issued, 0);
        const totalGiven     = rows.reduce((s, r) => s + r.given, 0);
        const totalRemaining = totalIssued - totalGiven;
        return (
          <div key={product} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-[#16a34a] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-poppins-bold text-white uppercase tracking-wider">{product}</span>
              <span className="text-[11px] font-poppins text-white/80">
                {totalGiven}/{totalIssued} given · {totalRemaining} remaining
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {rows.map((row, idx) => {
                const remaining = row.issued - row.given;
                const usedPct = row.issued > 0 ? Math.round((row.given / row.issued) * 100) : 0;
                const low = remaining <= 5 && row.issued > 0;
                return (
                  <div key={row.id}
                    className={`flex items-center gap-4 px-4 py-3 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-poppins-bold text-[10px]">{INITIALS(row.user)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{row.user.firstname} {row.user.lastname}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-poppins text-gray-400">
                        <span>{row.issued} issued</span>
                        <span>·</span>
                        <span>{row.given} given ({usedPct}%)</span>
                      </div>
                    </div>
                    <span className={`text-sm font-poppins-bold flex-shrink-0 ${low ? "text-red-600" : "text-[#16a34a]"}`}>
                      {remaining} left
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Tab: JFW Log ─────────────────────────────────────────────────────────────

const JfwTab = () => {
  const [data, setData]     = useState<JfwReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJfwReportsApi()
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-3 py-10 text-gray-400 text-sm px-1"><Spinner />Loading JFW records...</div>;
  if (data.length === 0) return <Empty text="No JFW records yet" />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-poppins text-gray-400">Reports where you joined a rep in the field</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {data.map((r) => {
          const scores = r.jfw_score ?? {};
          const scoreEntries = Object.entries(scores);
          return (
            <div key={r.id} className="px-5 py-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{r.user.firstname} {r.user.lastname}</p>
                  <p className="text-xs font-poppins text-gray-400 mt-0.5">{FMT(r.report_date)}</p>
                </div>
                {r.jfw_overall != null && (
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-poppins-extrabold ${r.jfw_overall >= 4 ? "text-[#16a34a]" : r.jfw_overall >= 3 ? "text-amber-600" : "text-red-600"}`}>
                      {r.jfw_overall}/5
                    </span>
                    <p className="text-[10px] font-poppins text-gray-400">overall</p>
                  </div>
                )}
              </div>
              {scoreEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {scoreEntries.map(([criteria, score]) => (
                    <div key={criteria} className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-center">
                      <p className="text-[10px] font-poppins text-gray-400 capitalize">{criteria.replace(/_/g, " ")}</p>
                      <p className={`text-sm font-poppins-bold ${score >= 4 ? "text-[#16a34a]" : score >= 3 ? "text-amber-600" : "text-red-600"}`}>{score}/5</p>
                    </div>
                  ))}
                </div>
              )}
              {!r.jfw_scored_at && (
                <span className="text-xs font-poppins text-amber-600 italic">Score not submitted yet</span>
              )}
              {r.jfw_notes && (
                <p className="text-xs font-poppins text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 italic">"{r.jfw_notes}"</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Page Shell ───────────────────────────────────────────────────────────────

const MAIN_TABS: { key: MainTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "reports",  label: "Reports",   Icon: LuFileText  },
  { key: "team",     label: "Team",      Icon: LuActivity  },
  { key: "late",     label: "Late Req",  Icon: LuClock     },
  { key: "samples",  label: "Samples",   Icon: LuBeaker    },
  { key: "jfw",      label: "JFW",       Icon: LuUsers     },
  { key: "download", label: "Download",  Icon: LuDownload  },
];

const SupervisorReports = () => {
  const [mainTab, setMainTab] = useState<MainTab>("reports");

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Reports</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Team activity, approvals, and performance</p>
      </div>

      {/* Main tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {MAIN_TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMainTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-poppins-semibold whitespace-nowrap focus-visible:outline-none flex-shrink-0 ${mainTab === key ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ transition: "background-color 0.15s" }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {mainTab === "reports"  && <ReportsTab />}
      {mainTab === "team"     && <TeamTab />}
      {mainTab === "late"     && <LateTab />}
      {mainTab === "samples"  && <SamplesTab />}
      {mainTab === "jfw"      && <JfwTab />}
      {mainTab === "download" && <DownloadReportWidget roles={["MedicalRep", "Supervisor"]} />}
    </div>
  );
};

export default SupervisorReports;
