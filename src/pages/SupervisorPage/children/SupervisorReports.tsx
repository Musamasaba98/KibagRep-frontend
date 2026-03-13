import { useEffect, useState, useCallback } from "react";
import { LuFileText, LuChevronDown, LuChevronUp, LuCheck, LuX } from "react-icons/lu";
import { MdOutlineWarningAmber } from "react-icons/md";
import { TbActivityHeartbeat } from "react-icons/tb";
import { getCompanyReportsApi, approveReportApi, rejectReportApi, getDailyReportActivitiesApi } from "../../../services/api";

interface Report {
  id: string; report_date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  visits_count: number; samples_count: number;
  summary: string | null; review_note: string | null;
  jfw_observer_id: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
}
interface Activity {
  id: string; visit_type: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given: number; nca_reason: string | null; gps_anomaly_flag: boolean;
  doctor: { doctor_name: string; location?: string; town?: string } | null;
  focused_product: { product_name: string } | null;
}
type StatusTab = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL";
type Days = 7 | 30 | 60;

const INITIALS = (r: Report) => `${r.user.firstname?.[0] ?? ""}${r.user.lastname?.[0] ?? ""}`.toUpperCase();
const FMT = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const STATUS = {
  SUBMITTED: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  APPROVED:  { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", label: "Approved" },
  REJECTED:  { bg: "bg-red-50", text: "text-red-600", label: "Rejected" },
  DRAFT:     { bg: "bg-gray-100", text: "text-gray-500", label: "Draft" },
} as const;
const VTYPE: Record<string, string> = {
  PLANNED: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  UNPLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  NCA: "bg-amber-50 text-amber-700 border-amber-200",
};

const SupervisorReports = () => {
  const [tab, setTab] = useState<StatusTab>("SUBMITTED");
  const [days, setDays] = useState<Days>(30);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acts, setActs] = useState<Record<string, Activity[]>>({});
  const [loadingAct, setLoadingAct] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

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

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason?.trim()) return;
    setActioning(id);
    try {
      await rejectReportApi(id, { reason });
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
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">Daily reports from your team</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 30, 60] as Days[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus-visible:outline-none ${days === d ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => { setTab(key); setExpanded(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold focus-visible:outline-none ${tab === key ? "text-[#16a34a] border-b-2 border-[#16a34a] bg-[#f0fdf4]/50" : "text-gray-400 hover:text-gray-600"}`}
              style={{ transition: "color 0.15s" }}>
              {label}
              {key === "SUBMITTED" && pendingCount > 0 && !loading && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${tab === "SUBMITTED" ? "bg-[#16a34a] text-white" : "bg-amber-100 text-amber-700"}`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-gray-400 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <LuFileText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No reports found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different filter or date range</p>
          </div>
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
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-black text-xs">{INITIALS(rep)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1a1a] text-sm leading-tight">{rep.user.firstname} {rep.user.lastname}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{FMT(rep.report_date)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <span><strong className="text-[#1a1a1a]">{rep.visits_count}</strong> visits</span>
                      <span><strong className="text-[#1a1a1a]">{rep.samples_count}</strong> samples</span>
                    </div>
                    {rep.jfw_observer_id && (
                      <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">JFW</span>
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    <div className="text-gray-400 flex-shrink-0">{isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}</div>
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-4 sm:px-5 py-4 flex flex-col gap-3">
                      {rep.summary && (
                        <p className="text-sm text-gray-600 italic bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">"{rep.summary}"</p>
                      )}
                      {rep.review_note && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                          <LuX className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700">{rep.review_note}</p>
                        </div>
                      )}
                      {loadingAct === rep.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />Loading visits...
                        </div>
                      ) : repActs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">No visit activities recorded.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{repActs.length} Visit{repActs.length !== 1 ? "s" : ""}</p>
                          {repActs.map((act) => (
                            <div key={act.id} className="bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 flex items-start gap-3">
                              <TbActivityHeartbeat className={`w-4 h-4 mt-0.5 flex-shrink-0 ${act.visit_type === "NCA" ? "text-amber-500" : act.visit_type === "UNPLANNED" ? "text-sky-500" : "text-[#16a34a]"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-[#1a1a1a]">{act.doctor?.doctor_name ?? "Unknown HCP"}</p>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${VTYPE[act.visit_type] ?? ""}`}>{act.visit_type}</span>
                                  {act.gps_anomaly_flag && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">GPS flag</span>}
                                </div>
                                {act.doctor && <p className="text-xs text-gray-400 mt-0.5">{[act.doctor.location, act.doctor.town].filter(Boolean).join(" - ") || "-"}</p>}
                                {act.visit_type === "NCA" && act.nca_reason && <p className="text-xs text-amber-700 mt-0.5">Reason: {act.nca_reason}</p>}
                                {act.focused_product && <p className="text-xs text-[#16a34a] mt-0.5">{act.focused_product.product_name}{act.samples_given > 0 ? ` - ${act.samples_given} samples` : ""}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {rep.status === "SUBMITTED" && (
                        <div className="flex items-center gap-2 pt-1">
                          {isActioning ? (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(rep.id); }}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none"
                                style={{ transition: "background-color 0.15s" }}><LuCheck className="w-3.5 h-3.5" />Approve</button>
                              <button onClick={(e) => { e.stopPropagation(); handleReject(rep.id); }}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-none"
                                style={{ transition: "background-color 0.15s" }}><LuX className="w-3.5 h-3.5" />Reject</button>
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

export default SupervisorReports;
