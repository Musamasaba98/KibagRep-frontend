import { useEffect, useState, useCallback } from "react";
import { LuClipboardCheck, LuCheck, LuChevronDown, LuChevronUp, LuCalendarDays } from "react-icons/lu";
import { FiCheckCircle, FiXCircle, FiEye } from "react-icons/fi";
import { TbStethoscope } from "react-icons/tb";
import ReportPreviewSlideOver from "../../SupervisorPage/components/ReportPreviewSlideOver";
import {
  getPendingReportsApi, approveReportApi, rejectReportApi,
  getPendingCyclesApi, approveCycleApi, rejectCycleApi,
  getPendingExpenseClaimsApi, approveExpenseClaimApi, rejectExpenseClaimApi,
  getRecommendationsApi, approveRecommendationApi, rejectRecommendationApi, forwardRecommendationApi,
  getPendingTourPlansApi, approveTourPlanApi, rejectTourPlanApi,
  getPendingLateRequestsApi, approveLateRequestApi, rejectLateRequestApi,
  getPendingStaffSupervisorApi, supervisorApproveStaffApi, rejectStaffApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PendingReport {
  id: string; report_date: string; summary: string | null;
  visits_count: number; samples_count: number;
  user: { id: string; firstname: string; lastname: string };
}
interface PendingCycle {
  id: string; month: number; year: number;
  user: { id: string; firstname: string; lastname: string };
  items: Array<{ id: string; tier: string; frequency: number; doctor: { doctor_name: string; town?: string } }>;
}
interface PendingExpense {
  id: string; period: string; total_amount: number; submitted_at: string | null;
  user: { id: string; firstname: string; lastname: string };
}
interface Recommendation {
  id: string; status: string; created_at: string;
  clinician_name?: string | null; clinician_cadre?: string | null; clinician_location?: string | null;
  doctor?: { id: string; doctor_name: string; town: string; speciality: string[] } | null;
  recommended_by: { id: string; firstname: string; lastname: string };
  unplanned_visit_count: number;
}
interface TourPlanEntry {
  id: string; day_number: number; entry_type: string; slot: string;
  doctor?: { doctor_name: string; town?: string; cadre?: string } | null;
  pharmacy?: { pharmacy_name: string; town?: string } | null;
  notes?: string | null;
}
interface PendingTourPlan {
  id: string; month: number; year: number; created_at: string;
  user: { id: string; firstname: string; lastname: string };
  entries: TourPlanEntry[];
}

interface LateRequest {
  id: string; type: "CYCLE" | "TOUR_PLAN" | "DAILY_REPORT"; month: number; year: number;
  note: string; status: string; review_note: string | null;
  user: { id: string; firstname: string; lastname: string };
}
interface PharmacyStaffSuggestion {
  id: string; name: string; role: string; phone: string | null; notes: string | null;
  status: string; created_at: string;
  suggested_by: { id: string; firstname: string; lastname: string };
  pharmacy_links: Array<{ pharmacy: { id: string; pharmacy_name: string; town: string | null } }>;
}

type Tab = "reports" | "cycles" | "expenses" | "recs" | "tourplans" | "late" | "staff";
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FMT = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// ─── Reject input inline ──────────────────────────────────────────────────────
const RejectInput = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
      style={{ transition: "background-color 0.15s" }}>
      <FiXCircle className="w-3.5 h-3.5" /> Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus type="text" value={note} onChange={e => setNote(e.target.value)}
        placeholder="Reason…"
        className="flex-1 text-xs font-poppins border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
        style={{ transition: "opacity 0.15s" }}>Send</button>
      <button onClick={() => setOpen(false)} className="text-xs font-poppins text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ label }: { label: string }) => (
  <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
    <LuClipboardCheck className="w-10 h-10 opacity-30" />
    <p className="text-sm font-poppins-semibold">{label}</p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Approvals = () => {
  const [tab, setTab] = useState<Tab>("reports");
  const [previewReport, setPreviewReport] = useState<PendingReport | null>(null);
  const [reports, setReports]       = useState<PendingReport[]>([]);
  const [cycles, setCycles]         = useState<PendingCycle[]>([]);
  const [expenses, setExpenses]     = useState<PendingExpense[]>([]);
  const [recs, setRecs]             = useState<Recommendation[]>([]);
  const [tourplans, setTourplans]   = useState<PendingTourPlan[]>([]);
  const [lateRequests, setLateRequests] = useState<LateRequest[]>([]);
  const [staffSuggestions, setStaffSuggestions] = useState<PharmacyStaffSuggestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actioning, setActioning]   = useState<string | null>(null);
  const [expandedCycle, setExpandedCycle]     = useState<string | null>(null);
  const [expandedTourPlan, setExpandedTourPlan] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPendingReportsApi().then(r => setReports(r.data?.data ?? [])).catch(() => {}),
      getPendingCyclesApi("SUBMITTED").then(r => setCycles(r.data?.data ?? [])).catch(() => {}),
      getPendingExpenseClaimsApi().then(r => setExpenses(r.data?.data ?? [])).catch(() => {}),
      getRecommendationsApi().then(r => setRecs((r.data?.data ?? []).filter((x: Recommendation) => x.status === "PENDING"))).catch(() => {}),
      getPendingTourPlansApi().then(r => setTourplans(r.data?.data ?? [])).catch(() => {}),
      getPendingLateRequestsApi().then(r => setLateRequests(r.data?.data ?? [])).catch(() => {}),
      getPendingStaffSupervisorApi().then(r => setStaffSuggestions(r.data?.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const approveReport = async (id: string) => {
    setActioning(id);
    await approveReportApi(id).catch(() => {});
    setReports(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const rejectReport = async (id: string, note: string) => {
    setActioning(id);
    await rejectReportApi(id, { note }).catch(() => {});
    setReports(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const approveCycle = async (id: string) => {
    setActioning(id);
    await approveCycleApi(id).catch(() => {});
    setCycles(p => p.filter(c => c.id !== id));
    setActioning(null);
  };
  const rejectCycle = async (id: string, note: string) => {
    setActioning(id);
    await rejectCycleApi(id, { note }).catch(() => {});
    setCycles(p => p.filter(c => c.id !== id));
    setActioning(null);
  };
  const approveExpense = async (id: string) => {
    setActioning(id);
    await approveExpenseClaimApi(id).catch(() => {});
    setExpenses(p => p.filter(e => e.id !== id));
    setActioning(null);
  };
  const rejectExpense = async (id: string, note: string) => {
    setActioning(id);
    await rejectExpenseClaimApi(id, { note }).catch(() => {});
    setExpenses(p => p.filter(e => e.id !== id));
    setActioning(null);
  };
  const approveRec = async (id: string) => {
    setActioning(id);
    await approveRecommendationApi(id).catch(() => {});
    setRecs(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const rejectRec = async (id: string, note: string) => {
    setActioning(id);
    await rejectRecommendationApi(id, note).catch(() => {});
    setRecs(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const forwardRec = async (id: string) => {
    setActioning(id);
    await forwardRecommendationApi(id).catch(() => {});
    setRecs(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const approveTourPlan = async (id: string) => {
    setActioning(id);
    await approveTourPlanApi(id).catch(() => {});
    setTourplans(p => p.filter(t => t.id !== id));
    setActioning(null);
  };
  const rejectTourPlan = async (id: string, note: string) => {
    setActioning(id);
    await rejectTourPlanApi(id, { review_note: note }).catch(() => {});
    setTourplans(p => p.filter(t => t.id !== id));
    setActioning(null);
  };
  const approveLate = async (id: string) => {
    setActioning(id);
    await approveLateRequestApi(id).catch(() => {});
    setLateRequests(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const rejectLate = async (id: string, note: string) => {
    setActioning(id);
    await rejectLateRequestApi(id, { note }).catch(() => {});
    setLateRequests(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const approveStaff = async (id: string) => {
    setActioning(id);
    await supervisorApproveStaffApi(id).catch(() => {});
    setStaffSuggestions(p => p.filter(s => s.id !== id));
    setActioning(null);
  };
  const rejectStaff = async (id: string, note: string) => {
    setActioning(id);
    await rejectStaffApi(id, note).catch(() => {});
    setStaffSuggestions(p => p.filter(s => s.id !== id));
    setActioning(null);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "reports",   label: "Daily Reports", count: reports.length },
    { key: "cycles",    label: "Call Cycles",   count: cycles.length },
    { key: "tourplans", label: "Tour Plans",    count: tourplans.length },
    { key: "expenses",  label: "Expenses",      count: expenses.length },
    { key: "recs",      label: "HCP Recs",      count: recs.length },
    { key: "late",      label: "Late Requests", count: lateRequests.length },
    { key: "staff",     label: "Pharm. Staff",  count: staffSuggestions.length },
  ];

  const totalPending = reports.length + cycles.length + expenses.length + recs.length + tourplans.length + lateRequests.length + staffSuggestions.length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      {previewReport && (
        <ReportPreviewSlideOver
          reportId={previewReport.id}
          repName={`${previewReport.user.firstname} ${previewReport.user.lastname}`}
          reportDate={previewReport.report_date}
          visitCount={previewReport.visits_count}
          sampleCount={previewReport.samples_count}
          status="SUBMITTED"
          summary={previewReport.summary}
          onClose={() => setPreviewReport(null)}
          onActioned={() => {
            setReports(p => p.filter(r => r.id !== previewReport.id));
            setPreviewReport(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <LuClipboardCheck className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div>
          <h1 className="text-xl font-poppins-bold text-[#1a1a1a] tracking-tight">Approval Queue</h1>
          <p className="text-sm font-poppins text-gray-500">
            {loading ? "Loading…" : totalPending === 0 ? "All caught up" : `${totalPending} item${totalPending !== 1 ? "s" : ""} pending review`}
          </p>
        </div>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[11px] sm:text-sm font-poppins-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
              tab === t.key ? "bg-white text-[#16a34a]" : "text-gray-500 hover:text-[#1a1a1a]"
            }`}
            style={{ transition: "background-color 0.15s, color 0.15s" }}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-poppins px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-[#16a34a] text-white" : "bg-orange-500 text-white"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* ── DAILY REPORTS ── */}
          {tab === "reports" && (
            reports.length === 0 ? <Empty label="No pending daily reports" /> :
            <div className="divide-y divide-gray-50">
              {reports.map(r => (
                <div key={r.id} className={`p-4 ${actioning === r.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0 text-xs font-poppins-bold text-[#16a34a]">
                      {r.user.firstname[0]}{r.user.lastname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate">{r.user.firstname} {r.user.lastname}</p>
                      <p className="text-xs font-poppins text-gray-500 truncate">{FMT(r.report_date)} · {r.visits_count} visits · {r.samples_count} samples</p>
                      {r.summary && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.summary}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                    <button onClick={() => setPreviewReport(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#16a34a] hover:border-[#16a34a]/30 focus-visible:outline-none"
                      style={{ transition: "background-color 0.15s, color 0.15s" }}>
                      <FiEye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => approveReport(r.id)}
                      className="flex items-center font-poppins gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                      style={{ transition: "background-color 0.15s" }}>
                      <LuCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <RejectInput onConfirm={note => rejectReport(r.id, note)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CALL CYCLES ── */}
          {tab === "cycles" && (
            cycles.length === 0 ? <Empty label="No pending call cycles" /> :
            <div className="divide-y divide-gray-50">
              {cycles.map(c => (
                <div key={c.id} className={`p-4 ${actioning === c.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-xs font-bold text-amber-700">
                      {c.user.firstname[0]}{c.user.lastname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{c.user.firstname} {c.user.lastname}</p>
                      <p className="text-xs font-poppins text-gray-500">{MONTHS[c.month]} {c.year} · {(c.items ?? []).length} doctors</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                    <button onClick={() => setExpandedCycle(expandedCycle === c.id ? null : c.id)}
                      className="flex items-center font-poppins gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                      style={{ transition: "background-color 0.15s" }}>
                      {expandedCycle === c.id ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                      Doctors
                    </button>
                    <button onClick={() => approveCycle(c.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                      style={{ transition: "background-color 0.15s" }}>
                      <LuCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <RejectInput onConfirm={reason => rejectCycle(c.id, reason)} />
                  </div>
                  {expandedCycle === c.id && (
                    <div className="mt-3 ml-12 grid grid-cols-1 gap-1">
                      {(c.items ?? []).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-gray-50 rounded-lg">
                          <span className="font-poppins-semibold text-[#1a1a1a]">{item.doctor.doctor_name}</span>
                          <span className="text-gray-400 font-poppins">{item.doctor.town} · Tier {item.tier} · {item.frequency}×/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── TOUR PLANS ── */}
          {tab === "tourplans" && (
            tourplans.length === 0 ? <Empty label="No pending tour plans" /> :
            <div className="divide-y divide-gray-50">
              {tourplans.map(tp => {
                const isExpanded = expandedTourPlan === tp.id;
                const isActioning = actioning === tp.id;
                const uniqueDays = new Set((tp.entries ?? []).map(e => e.day_number)).size;
                const clinicianCount = (tp.entries ?? []).filter(e => e.entry_type === "CLINICIAN").length;
                const pharmacyCount  = (tp.entries ?? []).filter(e => e.entry_type === "PHARMACY").length;

                return (
                  <div key={tp.id} className={`p-4 ${isActioning ? "opacity-50 pointer-events-none" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700">
                        {tp.user.firstname[0]}{tp.user.lastname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{tp.user.firstname} {tp.user.lastname}</p>
                        <p className="text-xs font-poppins text-gray-500">
                          {MONTHS[tp.month]} {tp.year}
                          {uniqueDays > 0 && ` · ${uniqueDays} day${uniqueDays !== 1 ? "s" : ""} planned`}
                          {clinicianCount > 0 && ` · ${clinicianCount} HCP${clinicianCount !== 1 ? "s" : ""}`}
                          {pharmacyCount > 0 && ` · ${pharmacyCount} pharmacies`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                      <button
                        onClick={() => setExpandedTourPlan(isExpanded ? null : tp.id)}
                        className="flex items-center font-poppins gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                        style={{ transition: "background-color 0.15s" }}>
                        {isExpanded ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                        View
                      </button>
                      <button onClick={() => approveTourPlan(tp.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <RejectInput onConfirm={note => rejectTourPlan(tp.id, note)} />
                    </div>

                    {isExpanded && (tp.entries ?? []).length > 0 && (
                      <div className="mt-3 ml-12 space-y-1">
                        {/* Group by day */}
                        {Array.from(new Set((tp.entries ?? []).map(e => e.day_number))).sort((a, b) => a - b).map(day => {
                          const dayEntries = (tp.entries ?? []).filter(e => e.day_number === day);
                          return (
                            <div key={day}>
                              <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-wider mb-1">
                                Day {day}
                              </p>
                              {dayEntries.map(entry => (
                                <div key={entry.id} className="flex items-center gap-2 text-xs py-1 px-2.5 bg-gray-50 rounded-lg mb-0.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    entry.slot === "MORNING" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"
                                  }`}>{entry.slot}</span>
                                  <span className="font-poppins-semibold text-[#1a1a1a] truncate">
                                    {entry.doctor?.doctor_name ?? entry.pharmacy?.pharmacy_name ?? "—"}
                                  </span>
                                  <span className="text-gray-400 font-poppins truncate">
                                    {entry.doctor?.town ?? entry.pharmacy?.town ?? ""}
                                  </span>
                                  {entry.notes && (
                                    <span className="text-gray-300 font-poppins truncate italic">{entry.notes}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && (tp.entries ?? []).length === 0 && (
                      <div className="mt-3 ml-12 flex items-center gap-2 text-xs text-gray-400">
                        <LuCalendarDays className="w-3.5 h-3.5" />
                        No entries added to this plan yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── EXPENSES ── */}
          {tab === "expenses" && (
            expenses.length === 0 ? <Empty label="No pending expense claims" /> :
            <div className="divide-y divide-gray-50">
              {expenses.map(e => (
                <div key={e.id} className={`p-4 ${actioning === e.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700">
                      {e.user.firstname[0]}{e.user.lastname[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{e.user.firstname} {e.user.lastname}</p>
                      <p className="text-xs font-poppins text-gray-500">
                        {e.period} · UGX {e.total_amount.toLocaleString()}
                        {e.submitted_at && ` · submitted ${FMT(e.submitted_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                    <button onClick={() => approveExpense(e.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                      style={{ transition: "background-color 0.15s" }}>
                      <LuCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <RejectInput onConfirm={reason => rejectExpense(e.id, reason)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HCP RECOMMENDATIONS ── */}
          {tab === "recs" && (
            recs.length === 0 ? <Empty label="No pending HCP recommendations" /> :
            <div className="divide-y divide-gray-50">
              {recs.map(rec => (
                <div key={rec.id} className={`p-4 ${actioning === rec.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <TbStethoscope className="w-4.5 h-4.5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      {rec.doctor ? (
                        <>
                          <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{rec.doctor.doctor_name}</p>
                          <p className="text-xs font-poppins text-gray-500">{rec.doctor.town} · {rec.doctor.speciality?.join(", ")}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{rec.clinician_name ?? "Unknown clinician"}</p>
                          <p className="text-xs font-poppins text-gray-500">
                            {rec.clinician_cadre} {rec.clinician_location ? `· ${rec.clinician_location}` : ""}
                          </p>
                        </>
                      )}
                      <p className="text-xs font-poppins text-gray-400 mt-0.5">
                        By {rec.recommended_by.firstname} {rec.recommended_by.lastname} · {rec.unplanned_visit_count} unplanned visit{rec.unplanned_visit_count !== 1 ? "s" : ""} · {FMT(rec.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-12 flex-wrap">
                    <button onClick={() => approveRec(rec.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                      style={{ transition: "background-color 0.15s" }}>
                      <FiCheckCircle className="w-3.5 h-3.5" /> Add to List
                    </button>
                    <button onClick={() => forwardRec(rec.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
                      style={{ transition: "background-color 0.15s" }}>
                      Forward
                    </button>
                    <RejectInput onConfirm={note => rejectRec(rec.id, note)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "staff" && (
            staffSuggestions.length === 0 ? <Empty label="No pending pharmacy staff suggestions" /> :
            <div className="space-y-3">
              {staffSuggestions.map(s => {
                const repName = `${s.suggested_by.firstname} ${s.suggested_by.lastname}`;
                const pharmacy = s.pharmacy_links[0]?.pharmacy;
                const roleColour: Record<string, string> = {
                  Dispenser: "bg-violet-50 text-violet-700 border-violet-200",
                  Pharmacist: "bg-blue-50 text-blue-700 border-blue-200",
                  Procurement: "bg-amber-50 text-amber-700 border-amber-200",
                  Owner: "bg-green-50 text-green-700 border-green-200",
                  Manager: "bg-gray-50 text-gray-600 border-gray-200",
                };
                return (
                  <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-poppins-bold text-violet-700">{s.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-poppins-semibold text-gray-800">{s.name}</p>
                          {s.phone && <p className="text-xs font-poppins text-gray-400">{s.phone}</p>}
                          {pharmacy && (
                            <p className="text-xs font-poppins text-gray-400">
                              {pharmacy.pharmacy_name}{pharmacy.town ? ` · ${pharmacy.town}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-poppins-bold px-2 py-0.5 rounded-full border ${roleColour[s.role] ?? roleColour.Manager}`}>
                        {s.role}
                      </span>
                    </div>
                    {s.notes && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-poppins text-gray-700 border border-gray-100">
                        <span className="text-xs font-poppins-semibold text-gray-400 block mb-0.5">Notes</span>
                        {s.notes}
                      </div>
                    )}
                    <p className="text-xs font-poppins text-gray-400">Suggested by {repName} · {FMT(s.created_at)}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveStaff(s.id)} disabled={actioning === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
                        style={{ transition: "background-color 0.15s" }}>
                        <FiCheckCircle className="w-3.5 h-3.5" /> Approve → Admin
                      </button>
                      <RejectInput onConfirm={note => rejectStaff(s.id, note)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "late" && (
            lateRequests.length === 0 ? <Empty label="No pending late-submission requests" /> :
            <div className="space-y-3">
              {lateRequests.map(req => {
                const repName = `${req.user.firstname} ${req.user.lastname}`;
                const typeLabel = req.type === "CYCLE" ? "Call Cycle" : req.type === "TOUR_PLAN" ? "Tour Plan" : "Daily Report";
                const monthName = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][req.month];
                return (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-poppins-bold text-amber-700">
                            {req.user.firstname[0]}{req.user.lastname[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-poppins-semibold text-gray-800">{repName}</p>
                          <p className="text-xs font-poppins text-gray-400">
                            {typeLabel} · {monthName} {req.year} · late submission request
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-poppins-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        PENDING
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm font-poppins text-gray-700 border border-gray-100">
                      <span className="text-xs font-poppins-semibold text-gray-400 block mb-1">Rep's note</span>
                      {req.note}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveLate(req.id)}
                        disabled={actioning === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <FiCheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <RejectInput onConfirm={note => rejectLate(req.id, note)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Approvals;
