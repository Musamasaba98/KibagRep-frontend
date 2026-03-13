import { useEffect, useState, useCallback } from "react";
import { LuClipboardCheck, LuCheck, LuX, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { TbStethoscope } from "react-icons/tb";
import {
  getPendingReportsApi, approveReportApi, rejectReportApi,
  getPendingCyclesApi, approveCycleApi, rejectCycleApi,
  getPendingExpenseClaimsApi, approveExpenseClaimApi, rejectExpenseClaimApi,
  getRecommendationsApi, approveRecommendationApi, rejectRecommendationApi, forwardRecommendationApi,
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

type Tab = "reports" | "cycles" | "expenses" | "recs";
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
        className="flex-1 text-xs border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
        style={{ transition: "opacity 0.15s" }}>Send</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Empty = ({ label }: { label: string }) => (
  <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
    <LuClipboardCheck className="w-10 h-10 opacity-30" />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Approvals = () => {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [cycles, setCycles] = useState<PendingCycle[]>([]);
  const [expenses, setExpenses] = useState<PendingExpense[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPendingReportsApi().then(r => setReports(r.data?.data ?? [])).catch(() => {}),
      getPendingCyclesApi().then(r => setCycles(r.data?.data ?? [])).catch(() => {}),
      getPendingExpenseClaimsApi().then(r => setExpenses(r.data?.data ?? [])).catch(() => {}),
      getRecommendationsApi().then(r => setRecs((r.data?.data ?? []).filter((x: Recommendation) => x.status === "PENDING"))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveReport = async (id: string) => {
    setActioning(id);
    await approveReportApi(id).catch(() => {});
    setReports(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const rejectReport = async (id: string, note: string) => {
    setActioning(id);
    await rejectReportApi(id, { reason: note }).catch(() => {});
    setReports(p => p.filter(r => r.id !== id));
    setActioning(null);
  };
  const approveCycle = async (id: string) => {
    setActioning(id);
    await approveCycleApi(id).catch(() => {});
    setCycles(p => p.filter(c => c.id !== id));
    setActioning(null);
  };
  const rejectCycle = async (id: string, reason: string) => {
    setActioning(id);
    await rejectCycleApi(id, { reason }).catch(() => {});
    setCycles(p => p.filter(c => c.id !== id));
    setActioning(null);
  };
  const approveExpense = async (id: string) => {
    setActioning(id);
    await approveExpenseClaimApi(id).catch(() => {});
    setExpenses(p => p.filter(e => e.id !== id));
    setActioning(null);
  };
  const rejectExpense = async (id: string, reason: string) => {
    setActioning(id);
    await rejectExpenseClaimApi(id, { reason }).catch(() => {});
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

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "reports",  label: "Daily Reports", count: reports.length },
    { key: "cycles",   label: "Call Cycles",   count: cycles.length },
    { key: "expenses", label: "Expenses",       count: expenses.length },
    { key: "recs",     label: "HCP Recs",       count: recs.length },
  ];

  const totalPending = reports.length + cycles.length + expenses.length + recs.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <LuClipboardCheck className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Approval Queue</h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : totalPending === 0 ? "All caught up" : `${totalPending} item${totalPending !== 1 ? "s" : ""} pending review`}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
              tab === t.key ? "bg-white text-[#16a34a] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-gray-500 hover:text-[#1a1a1a]"
            }`}
            style={{ transition: "background-color 0.15s, color 0.15s" }}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden">

          {/* ── REPORTS ── */}
          {tab === "reports" && (
            reports.length === 0 ? <Empty label="No pending daily reports" /> :
            <div className="divide-y divide-gray-50">
              {reports.map(r => (
                <div key={r.id} className={`p-4 ${actioning === r.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0 text-xs font-bold text-[#16a34a]">
                        {r.user.firstname[0]}{r.user.lastname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{r.user.firstname} {r.user.lastname}</p>
                        <p className="text-xs text-gray-500">{FMT(r.report_date)} · {r.visits_count} visits · {r.samples_count} samples</p>
                        {r.summary && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.summary}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => approveReport(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <RejectInput onConfirm={note => rejectReport(r.id, note)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CYCLES ── */}
          {tab === "cycles" && (
            cycles.length === 0 ? <Empty label="No pending call cycles" /> :
            <div className="divide-y divide-gray-50">
              {cycles.map(c => (
                <div key={c.id} className={`p-4 ${actioning === c.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-xs font-bold text-amber-700">
                        {c.user.firstname[0]}{c.user.lastname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{c.user.firstname} {c.user.lastname}</p>
                        <p className="text-xs text-gray-500">{MONTHS[c.month]} {c.year} · {c.items.length} doctors</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setExpandedCycle(expandedCycle === c.id ? null : c.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                        style={{ transition: "background-color 0.15s" }}>
                        {expandedCycle === c.id ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                        Doctors
                      </button>
                      <button onClick={() => approveCycle(c.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <RejectInput onConfirm={reason => rejectCycle(c.id, reason)} />
                    </div>
                  </div>
                  {expandedCycle === c.id && (
                    <div className="mt-3 ml-12 grid grid-cols-1 gap-1">
                      {c.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-gray-50 rounded-lg">
                          <span className="font-medium text-[#1a1a1a]">{item.doctor.doctor_name}</span>
                          <span className="text-gray-400">{item.doctor.town} · Tier {item.tier} · {item.frequency}×/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── EXPENSES ── */}
          {tab === "expenses" && (
            expenses.length === 0 ? <Empty label="No pending expense claims" /> :
            <div className="divide-y divide-gray-50">
              {expenses.map(e => (
                <div key={e.id} className={`p-4 ${actioning === e.id ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700">
                        {e.user.firstname[0]}{e.user.lastname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a]">{e.user.firstname} {e.user.lastname}</p>
                        <p className="text-xs text-gray-500">
                          {e.period} · UGX {e.total_amount.toLocaleString()}
                          {e.submitted_at && ` · submitted ${FMT(e.submitted_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => approveExpense(e.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <RejectInput onConfirm={reason => rejectExpense(e.id, reason)} />
                    </div>
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <TbStethoscope className="w-4.5 h-4.5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        {rec.doctor ? (
                          <>
                            <p className="text-sm font-semibold text-[#1a1a1a]">{rec.doctor.doctor_name}</p>
                            <p className="text-xs text-gray-500">{rec.doctor.town} · {rec.doctor.speciality?.join(", ")}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-[#1a1a1a]">{rec.clinician_name ?? "Unknown clinician"}</p>
                            <p className="text-xs text-gray-500">
                              {rec.clinician_cadre} {rec.clinician_location ? `· ${rec.clinician_location}` : ""}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          By {rec.recommended_by.firstname} {rec.recommended_by.lastname} · {rec.unplanned_visit_count} unplanned visit{rec.unplanned_visit_count !== 1 ? "s" : ""} · {FMT(rec.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <button onClick={() => approveRec(rec.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <FiCheckCircle className="w-3.5 h-3.5" /> Add to List
                      </button>
                      <button onClick={() => forwardRec(rec.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
                        style={{ transition: "background-color 0.15s" }}>
                        Forward
                      </button>
                      <RejectInput onConfirm={note => rejectRec(rec.id, note)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Approvals;
