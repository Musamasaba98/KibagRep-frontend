import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FaUserCheck, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { MdOutlineHistory, MdOutlineWarningAmber, MdOutlineGpsOff } from "react-icons/md";
import {
  LuReceiptText,
  LuCircleCheck,
  LuWallet,
  LuCalendarClock,
} from "react-icons/lu";
import { BsDroplet } from "react-icons/bs";
import { IoCalendarOutline, IoWarningOutline } from "react-icons/io5";
import { FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  getCompanyFeedApi,
  getPendingReportsApi,
  approveReportApi,
  rejectReportApi,
  getPendingCyclesApi,
  approveCycleApi,
  rejectCycleApi,
  getPendingExpenseClaimsApi,
  approveExpenseClaimApi,
  rejectExpenseClaimApi,
} from "../../../services/api";

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
  samples: number;
}

interface Activity {
  id: string;
  date: string;
  samples_given: number;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
  doctor: { id: string; doctor_name: string; town: string; gps_lat?: number; gps_lng?: number };
  focused_product: { id: string; product_name: string } | null;
}

interface PendingReport {
  id: string;
  report_date: string;
  summary: string | null;
  visits_count: number;
  samples_count: number;
  status: "SUBMITTED";
  user: { id: string; firstname: string; lastname: string; role: string };
}

interface PendingCycle {
  id: string;
  month: number;
  year: number;
  status: string;
  user: { id: string; firstname: string; lastname: string };
  items: Array<{ id: string; tier: string; frequency: number; doctor: { doctor_name: string } }>;
}

interface PendingExpense {
  id: string;
  period: string;
  total_amount: number;
  status: string;
  submitted_at: string | null;
  user: { id: string; firstname: string; lastname: string };
}

// ─── RejectRow ────────────────────────────────────────────────────────────────
const RejectRow = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return open ? (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason for rejection…"
        className="flex-1 text-xs border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
      />
      <button
        onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
        style={{ transition: "opacity 0.15s" }}
      >
        Send
      </button>
      <button
        onClick={() => setOpen(false)}
        className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600"
        style={{ transition: "color 0.15s" }}
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
      style={{ transition: "background-color 0.15s" }}
    >
      <FiXCircle className="w-3.5 h-3.5" />
      Reject
    </button>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [summary, setSummary] = useState<RepSummary[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [pendingCycles, setPendingCycles] = useState<PendingCycle[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [actioningReport, setActioningReport] = useState<string | null>(null);
  const [actioningCycle, setActioningCycle] = useState<string | null>(null);
  const [actioningExpense, setActioningExpense] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyFeedApi({ days: 7 }),
      getPendingReportsApi(),
      getPendingCyclesApi(),
      getPendingExpenseClaimsApi(),
    ]).then(([feedResult, reportsResult, cyclesResult, expensesResult]) => {
      if (feedResult.status === "fulfilled") {
        setSummary(feedResult.value.data?.summary ?? []);
        setFeed(feedResult.value.data?.data ?? []);
      } else {
        setError("Could not load team activity.");
      }
      if (reportsResult.status === "fulfilled") {
        setPendingReports(reportsResult.value.data?.data ?? []);
      }
      if (cyclesResult.status === "fulfilled") {
        setPendingCycles(cyclesResult.value.data?.data ?? []);
      }
      if (expensesResult.status === "fulfilled") {
        setPendingExpenses(expensesResult.value.data?.data ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleApproveReport = async (id: string) => {
    setActioningReport(id);
    try {
      await approveReportApi(id);
      setPendingReports((p) => p.filter((r) => r.id !== id));
    } catch {
      setError("Failed to approve report.");
    } finally {
      setActioningReport(null);
    }
  };

  const handleRejectReport = async (id: string, note: string) => {
    setActioningReport(id);
    try {
      await rejectReportApi(id, note);
      setPendingReports((p) => p.filter((r) => r.id !== id));
    } catch {
      setError("Failed to reject report.");
    } finally {
      setActioningReport(null);
    }
  };

  const handleApproveCycle = async (id: string) => {
    setActioningCycle(id);
    try {
      await approveCycleApi(id);
      setPendingCycles((p) => p.filter((c) => c.id !== id));
    } catch {
      setError("Failed to approve cycle.");
    } finally {
      setActioningCycle(null);
    }
  };

  const handleRejectCycle = async (id: string, note: string) => {
    setActioningCycle(id);
    try {
      await rejectCycleApi(id, note);
      setPendingCycles((p) => p.filter((c) => c.id !== id));
    } catch {
      setError("Failed to reject cycle.");
    } finally {
      setActioningCycle(null);
    }
  };

  const handleApproveExpense = async (id: string) => {
    setActioningExpense(id);
    try {
      await approveExpenseClaimApi(id);
      setPendingExpenses((p) => p.filter((e) => e.id !== id));
    } catch {
      setError("Failed to approve expense claim.");
    } finally {
      setActioningExpense(null);
    }
  };

  const handleRejectExpense = async (id: string, note: string) => {
    setActioningExpense(id);
    try {
      await rejectExpenseClaimApi(id, note);
      setPendingExpenses((p) => p.filter((e) => e.id !== id));
    } catch {
      setError("Failed to reject expense claim.");
    } finally {
      setActioningExpense(null);
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  const repsActive = summary.filter((r) => r.visits > 0).length;
  const totalVisits = summary.reduce((s, r) => s + r.visits, 0);
  const totalSamples = summary.reduce((s, r) => s + r.samples, 0);
  const inactiveReps = summary.filter((r) => r.visits === 0);
  const gpsAnomalies = feed.filter((a) => a.gps_anomaly === true);
  const ncaVisits = feed.filter((a) => a.nca_reason && a.nca_reason.length > 0);

  // ─── KPI cards ─────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Reps Active",
      value: loading ? "—" : repsActive,
      sub: "Visited at least once this week",
      gradient: "from-[#16a34a] to-[#15803d]",
      icon: FaUserCheck,
      shadow: "shadow-green-200",
    },
    {
      label: "Team Visits",
      value: loading ? "—" : totalVisits,
      sub: "Last 7 days combined",
      gradient: "from-sky-500 to-sky-600",
      icon: MdOutlineHistory,
      shadow: "shadow-sky-100",
    },
    {
      label: "Samples Given",
      value: loading ? "—" : totalSamples,
      sub: "Across all rep visits",
      gradient: "from-amber-500 to-amber-600",
      icon: BsDroplet,
      shadow: "shadow-amber-100",
    },
    {
      label: "Pending Reports",
      value: loading ? "—" : pendingReports.length,
      sub: "Awaiting your approval",
      gradient: pendingReports.length > 0 ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500",
      icon: LuReceiptText,
      shadow: pendingReports.length > 0 ? "shadow-orange-100" : "shadow-gray-100",
    },
    {
      label: "Pending Cycles",
      value: loading ? "—" : pendingCycles.length,
      sub: "Call cycles to review",
      gradient: pendingCycles.length > 0 ? "from-violet-500 to-violet-600" : "from-gray-400 to-gray-500",
      icon: IoCalendarOutline,
      shadow: pendingCycles.length > 0 ? "shadow-violet-100" : "shadow-gray-100",
    },
  ];

  return (
    <div className="w-full p-6 flex flex-col gap-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Supervisor Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your team activity — last 7 days</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.shadow} cursor-pointer hover:-translate-y-0.5`}
              style={{ transition: "transform 0.2s ease" }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10">
                {loading ? (
                  <div className="w-7 h-7 rounded-full border-[3px] border-white/30 border-t-white animate-spin mb-3" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <p className="font-black text-white text-3xl leading-none">{card.value}</p>
                <p className="text-white/90 font-bold text-[13px] mt-2 leading-tight">{card.label}</p>
                <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Approval Queue ── */}

      {/* Block 1 — Pending Daily Reports */}
      {!loading && pendingReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm shadow-orange-50">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
            <LuReceiptText className="w-5 h-5 text-orange-500" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Daily Reports</h2>
              <p className="text-xs text-gray-400">Rep daily reports awaiting review</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
              {pendingReports.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-orange-50">
            {pendingReports.map((r) => {
              const isExpanded = expandedReport === r.id;
              const isActioning = actioningReport === r.id;
              return (
                <div key={r.id}>
                  <div className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#16a34a] font-black text-sm">
                          {r.user.firstname.charAt(0)}{r.user.lastname.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#1a1a1a]">
                          {r.user.firstname} {r.user.lastname}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(r.report_date), "dd MMM yyyy")}
                          <span className="mx-1.5">·</span>
                          {r.visits_count} visits
                          {r.samples_count > 0 && (
                            <><span className="mx-1.5">·</span>{r.samples_count} samples</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActioning ? (
                        <span className="text-xs text-gray-400">Saving…</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApproveReport(r.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                            style={{ transition: "opacity 0.15s" }}
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <RejectRow onConfirm={(note) => handleRejectReport(r.id, note)} />
                        </>
                      )}
                      {r.summary && (
                        <button
                          onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                          className="text-gray-400 hover:text-gray-600 focus-visible:outline-none"
                          style={{ transition: "color 0.15s" }}
                        >
                          {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && r.summary && (
                    <div className="px-6 pb-4 pt-0">
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-line border border-gray-100">
                        {r.summary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Block 2 — Pending Call Cycles */}
      {!loading && pendingCycles.length > 0 && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm shadow-violet-50">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-100">
            <IoCalendarOutline className="w-5 h-5 text-violet-500" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Call Cycles</h2>
              <p className="text-xs text-gray-400">Monthly call plans awaiting approval</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-600">
              {pendingCycles.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-violet-50">
            {pendingCycles.map((c) => {
              const isActioning = actioningCycle === c.id;
              const monthLabel = format(new Date(c.year, c.month - 1), "MMMM yyyy");
              const firstThreeDoctors = c.items.slice(0, 3);
              return (
                <div key={c.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#16a34a] font-black text-sm">
                          {c.user.firstname.charAt(0)}{c.user.lastname.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#1a1a1a]">
                          {c.user.firstname} {c.user.lastname}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {monthLabel}
                          <span className="mx-1.5">·</span>
                          {c.items.length} doctors in cycle
                        </p>
                        {firstThreeDoctors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {firstThreeDoctors.map((item) => (
                              <span
                                key={item.id}
                                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100"
                              >
                                {item.doctor.doctor_name}
                              </span>
                            ))}
                            {c.items.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
                                +{c.items.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      {isActioning ? (
                        <span className="text-xs text-gray-400">Saving…</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApproveCycle(c.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                            style={{ transition: "opacity 0.15s" }}
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <RejectRow onConfirm={(note) => handleRejectCycle(c.id, note)} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Block 3 — Pending Expense Claims */}
      {!loading && pendingExpenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm shadow-amber-50">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100">
            <LuWallet className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Expense Claims</h2>
              <p className="text-xs text-gray-400">Rep expense claims awaiting approval</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-600">
              {pendingExpenses.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-amber-50">
            {pendingExpenses.map((e) => {
              const isActioning = actioningExpense === e.id;
              return (
                <div key={e.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-black text-sm">
                        {e.user.firstname.charAt(0)}{e.user.lastname.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#1a1a1a]">
                        {e.user.firstname} {e.user.lastname}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {e.period}
                        <span className="mx-1.5">·</span>
                        <span className="font-semibold text-[#1a1a1a]">
                          UGX {e.total_amount.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActioning ? (
                      <span className="text-xs text-gray-400">Saving…</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApproveExpense(e.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                          style={{ transition: "opacity 0.15s" }}
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <RejectRow onConfirm={(note) => handleRejectExpense(e.id, note)} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rep Performance Table ── */}
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-gray-50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Rep Performance</h2>
            <p className="text-xs text-gray-400 mt-0.5">Visit activity over the last 7 days</p>
          </div>
          {!loading && (
            <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-full border border-[#dcfce7]">
              {summary.length} reps
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#16a34a] animate-spin" />
          </div>
        ) : summary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LuCircleCheck className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No activity data yet</p>
            <p className="text-gray-400 text-xs mt-1">Check back after your reps start logging visits</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Visits</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Samples</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.map((row) => {
                  const pct = Math.min(100, Math.round((row.visits / 10) * 100));
                  const status =
                    row.visits >= 5
                      ? { label: "On Track", cls: "bg-green-50 text-[#16a34a]", icon: FaArrowTrendUp, iconCls: "text-[#16a34a]" }
                      : row.visits >= 2
                      ? { label: "Behind", cls: "bg-amber-50 text-amber-600", icon: FaArrowTrendDown, iconCls: "text-amber-500" }
                      : { label: "Inactive", cls: "bg-red-50 text-red-600", icon: FaArrowTrendDown, iconCls: "text-red-500" };
                  const StatusIcon = status.icon;
                  return (
                    <tr key={row.user.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#16a34a] font-black text-xs">
                              {row.user.firstname.charAt(0)}{row.user.lastname.charAt(0)}
                            </span>
                          </div>
                          <span className="font-semibold text-[#1a1a1a]">
                            {row.user.firstname} {row.user.lastname}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">{row.visits}</td>
                      <td className="px-4 py-3 text-gray-500">{row.samples}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.visits >= 5 ? "bg-[#16a34a]" : row.visits >= 2 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                          <StatusIcon className={`w-3 h-3 ${status.iconCls}`} />
                          {status.label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── GPS Anomaly Alerts ── */}
      {!loading && gpsAnomalies.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100">
            <MdOutlineGpsOff className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">GPS Anomalies Detected</h2>
              <p className="text-xs text-gray-400">Visits where GPS location did not match doctor's registered facility</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
              {gpsAnomalies.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-red-50">
            {gpsAnomalies.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1a1a1a]">
                      {a.user.firstname} {a.user.lastname}
                    </span>
                    <span className="text-gray-300 text-xs">→</span>
                    <span className="text-sm text-gray-600">{a.doctor.doctor_name}</span>
                    <span className="text-xs text-gray-400">{a.doctor.town}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(a.date), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                  Anomaly
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-red-50">
            <div className="flex items-center gap-2 text-amber-600">
              <IoWarningOutline className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-semibold">These visits require follow-up</p>
            </div>
          </div>
        </div>
      )}

      {/* ── NCA Log ── */}
      {!loading && ncaVisits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100">
            <IoWarningOutline className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">No-Activity Visits (NCA)</h2>
              <p className="text-xs text-gray-400">Visits logged with no meaningful activity</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-600">
              {ncaVisits.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-amber-50">
            {ncaVisits.map((a) => (
              <div key={a.id} className="flex items-start gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1a1a1a]">
                      {a.user.firstname} {a.user.lastname}
                    </span>
                    <span className="text-gray-300 text-xs">→</span>
                    <span className="text-sm text-gray-600">{a.doctor.doctor_name}</span>
                  </div>
                  {a.nca_reason && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-1.5 border border-amber-100">
                      {a.nca_reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(a.date), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Activity Feed ── */}
      {!loading && feed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-gray-50 p-5">
          <div className="mb-4">
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest visits logged by your team</p>
          </div>
          <div className="flex flex-col gap-2">
            {feed.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1a1a1a] truncate">
                      {act.user.firstname} {act.user.lastname}
                    </span>
                    <span className="text-gray-300 text-xs">→</span>
                    <span className="text-sm text-gray-600 truncate">{act.doctor.doctor_name}</span>
                    {act.gps_anomaly && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                        GPS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{act.doctor.town}</span>
                    {act.focused_product && (
                      <><span>·</span><span className="text-[#16a34a] font-medium">{act.focused_product.product_name}</span></>
                    )}
                    {act.samples_given > 0 && (
                      <><span>·</span><span>{act.samples_given} samples</span></>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(act.date), "MMM d, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Needs Attention ── */}
      {!loading && inactiveReps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-orange-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineWarningAmber className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Needs Attention</h2>
              <p className="text-xs text-gray-400">No visits logged in the last 7 days</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {inactiveReps.map((r) => (
              <div
                key={r.user.id}
                className="flex items-center justify-between gap-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-black text-xs">
                      {r.user.firstname.charAt(0)}{r.user.lastname.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#1a1a1a] text-sm">
                      {r.user.firstname} {r.user.lastname}
                    </p>
                    <p className="text-xs text-gray-400">0 visits this week</p>
                  </div>
                </div>
                <button
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                  style={{ transition: "background-color 0.15s" }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
