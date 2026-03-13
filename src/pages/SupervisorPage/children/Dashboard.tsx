import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FaUserCheck, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { MdOutlineHistory, MdOutlineWarningAmber, MdOutlineGpsOff } from "react-icons/md";
import {
  LuReceiptText,
  LuCircleCheck,
  LuWallet,
} from "react-icons/lu";
import { BsDroplet } from "react-icons/bs";
import { IoCalendarOutline, IoWarningOutline } from "react-icons/io5";
import { FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { TbUserCheck, TbSend } from "react-icons/tb";
import {
  getCompanyFeedApi,
  getDailyReportActivitiesApi,
  getPendingReportsApi,
  approveReportApi,
  rejectReportApi,
  getPendingCyclesApi,
  approveCycleApi,
  rejectCycleApi,
  getPendingExpenseClaimsApi,
  approveExpenseClaimApi,
  rejectExpenseClaimApi,
  getRecommendationsApi,
  approveRecommendationApi,
  rejectRecommendationApi,
  forwardRecommendationApi,
  getTeamPerformanceApi,
} from "../../../services/api";

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
  samples: number;
}

interface TeamPerf {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_visits_done: number;
  cycle_total_target: number;
  cycle_adherence_pct: number | null;
  last_visit_date: string | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
  pending_expenses: number;
}

interface Activity {
  id: string;
  date: string;
  samples_given: number;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  outcome?: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
  doctor: { id: string; doctor_name: string; speciality?: string[]; location?: string; town: string; gps_lat?: number; gps_lng?: number };
  focused_product: { id: string; product_name: string } | null;
  products_detailed?: { id: string; product_name: string }[];
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
  items: Array<{ id: string; tier: string; frequency: number; doctor: { doctor_name: string; speciality?: string[]; location?: string; town?: string } }>;
}

interface PendingExpense {
  id: string;
  period: string;
  total_amount: number;
  status: string;
  submitted_at: string | null;
  user: { id: string; firstname: string; lastname: string };
}

interface Recommendation {
  id: string;
  status: string;
  created_at: string;
  clinician_name?: string | null;
  clinician_cadre?: string | null;
  clinician_location?: string | null;
  doctor?: { id: string; doctor_name: string; town: string; speciality: string[] } | null;
  recommended_by: { id: string; firstname: string; lastname: string };
  unplanned_visit_count: number;
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
  const [teamPerf, setTeamPerf] = useState<TeamPerf[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [pendingCycles, setPendingCycles] = useState<PendingCycle[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [reportActivities, setReportActivities] = useState<Record<string, Activity[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<Record<string, boolean>>({});
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [actioningReport, setActioningReport] = useState<string | null>(null);
  const [actioningCycle, setActioningCycle] = useState<string | null>(null);
  const [actioningExpense, setActioningExpense] = useState<string | null>(null);
  const [actioningRec, setActioningRec] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyFeedApi({ days: 7 }),
      getPendingReportsApi(),
      getPendingCyclesApi(),
      getPendingExpenseClaimsApi(),
      getRecommendationsApi("PENDING"),
      getTeamPerformanceApi(),
    ]).then(([feedResult, reportsResult, cyclesResult, expensesResult, recsResult, perfResult]) => {
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
      if (recsResult.status === "fulfilled") {
        setRecommendations(recsResult.value.data?.data ?? []);
      }
      if (perfResult.status === "fulfilled") {
        setTeamPerf(perfResult.value.data?.data ?? []);
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

  const handleApproveRec = async (id: string) => {
    setActioningRec(id);
    try {
      await approveRecommendationApi(id);
      setRecommendations((p) => p.filter((r) => r.id !== id));
    } catch {
      setError("Failed to approve recommendation.");
    } finally {
      setActioningRec(null);
    }
  };

  const handleRejectRec = async (id: string, note: string) => {
    setActioningRec(id);
    try {
      await rejectRecommendationApi(id, note);
      setRecommendations((p) => p.filter((r) => r.id !== id));
    } catch {
      setError("Failed to reject recommendation.");
    } finally {
      setActioningRec(null);
    }
  };

  const handleToggleReport = (id: string) => {
    if (expandedReport === id) { setExpandedReport(null); return; }
    setExpandedReport(id);
    if (!reportActivities[id]) {
      setLoadingActivities((p) => ({ ...p, [id]: true }));
      getDailyReportActivitiesApi(id)
        .then((res) => setReportActivities((p) => ({ ...p, [id]: res.data?.data ?? [] })))
        .catch(() => setReportActivities((p) => ({ ...p, [id]: [] })))
        .finally(() => setLoadingActivities((p) => ({ ...p, [id]: false })));
    }
  };

  const handleForwardRec = async (id: string) => {
    setActioningRec(id);
    try {
      await forwardRecommendationApi(id);
      setRecommendations((p) => p.filter((r) => r.id !== id));
    } catch {
      setError("Failed to forward recommendation.");
    } finally {
      setActioningRec(null);
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  // Use teamPerf when loaded (accurate MTD + real cycle data), fall back to feed summary
  const repsActive = teamPerf.length > 0
    ? teamPerf.filter((r) => r.days_since_last_visit !== null && r.days_since_last_visit <= 6).length
    : summary.filter((r) => r.visits > 0).length;
  const totalVisits = teamPerf.length > 0
    ? teamPerf.reduce((s, r) => s + r.visits_this_week, 0)
    : summary.reduce((s, r) => s + r.visits, 0);
  const totalSamples = summary.reduce((s, r) => s + r.samples, 0);
  const inactiveReps = teamPerf.length > 0
    ? teamPerf.filter((r) => r.days_since_last_visit === null || r.days_since_last_visit > 2)
    : summary.filter((r) => r.visits === 0);
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
                      <button
                        onClick={() => handleToggleReport(r.id)}
                        className="text-gray-400 hover:text-gray-600 focus-visible:outline-none"
                        style={{ transition: "color 0.15s" }}
                      >
                        {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1">
                      {loadingActivities[r.id] ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-orange-400 animate-spin" />
                          Loading visit log…
                        </div>
                      ) : (
                        <div className="rounded-xl border border-orange-100 overflow-hidden">
                          {/* Report header */}
                          <div className="bg-orange-50 px-4 py-2.5 flex items-center justify-between gap-4 border-b border-orange-100">
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="font-black text-[#1a1a1a]">{r.user.firstname} {r.user.lastname}</span>
                              <span className="text-gray-300">·</span>
                              <span>{format(new Date(r.report_date), "EEEE, d MMMM yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs shrink-0">
                              <span className="font-bold text-[#1a1a1a]">{r.visits_count} visit{r.visits_count !== 1 ? "s" : ""}</span>
                              {r.samples_count > 0 && (
                                <span className="font-bold text-[#16a34a]">{r.samples_count} samples</span>
                              )}
                            </div>
                          </div>

                          {/* Column headers */}
                          <div className="grid text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-orange-50 px-0"
                               style={{ gridTemplateColumns: "2.5rem 3.5rem 1fr 1fr 1fr 5rem" }}>
                            <span className="px-3 py-2">#</span>
                            <span className="px-2 py-2">Time</span>
                            <span className="px-3 py-2">Doctor</span>
                            <span className="px-3 py-2">Facility · Town</span>
                            <span className="px-3 py-2">Products Detailed</span>
                            <span className="px-3 py-2 text-right">Smp · Flags</span>
                          </div>

                          {/* Visit rows */}
                          {(reportActivities[r.id] ?? []).length === 0 ? (
                            <div className="px-4 py-4 text-xs text-gray-400">No visit activities found for this date.</div>
                          ) : (
                            (reportActivities[r.id] ?? []).map((a, idx) => {
                              const allProducts = [
                                ...(a.products_detailed ?? []).map(p => p.product_name),
                              ];
                              if (a.focused_product && !allProducts.includes(a.focused_product.product_name)) {
                                allProducts.unshift(a.focused_product.product_name);
                              }
                              return (
                                <div
                                  key={a.id}
                                  className={`grid border-b border-orange-50 last:border-0 text-xs ${a.gps_anomaly ? "bg-red-50/40" : idx % 2 === 0 ? "bg-white" : "bg-orange-50/20"}`}
                                  style={{ gridTemplateColumns: "2.5rem 3.5rem 1fr 1fr 1fr 5rem" }}
                                >
                                  <span className="px-3 py-3 text-gray-400 font-mono">{idx + 1}</span>
                                  <span className="px-2 py-3 text-gray-500 font-mono">{format(new Date(a.date), "HH:mm")}</span>
                                  <div className="px-3 py-3 min-w-0">
                                    <p className="font-semibold text-[#1a1a1a] truncate">{a.doctor.doctor_name}</p>
                                    {(a.doctor.speciality ?? []).length > 0 && (
                                      <p className="text-[10px] text-gray-400 truncate">{(a.doctor.speciality ?? []).join(", ")}</p>
                                    )}
                                  </div>
                                  <div className="px-3 py-3 min-w-0">
                                    <p className="text-gray-600 truncate">{a.doctor.location ?? "—"}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{a.doctor.town}</p>
                                  </div>
                                  <div className="px-3 py-3 min-w-0">
                                    {allProducts.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {allProducts.map((p, i) => (
                                          <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">{p}</span>
                                        ))}
                                      </div>
                                    ) : <span className="text-gray-300">—</span>}
                                    {a.nca_reason && (
                                      <p className="text-[10px] text-amber-600 mt-0.5">NCA: {a.nca_reason}</p>
                                    )}
                                  </div>
                                  <div className="px-3 py-3 flex flex-col items-end gap-1">
                                    {a.samples_given > 0 && (
                                      <span className="font-bold text-[#16a34a]">{a.samples_given}</span>
                                    )}
                                    {a.gps_anomaly && (
                                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                                        <MdOutlineGpsOff className="w-3 h-3" /> GPS
                                      </span>
                                    )}
                                    {a.outcome && (
                                      <span className="text-[10px] text-gray-400 text-right">{a.outcome}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}

                          {/* Footer totals */}
                          {(reportActivities[r.id] ?? []).length > 0 && (
                            <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border-t border-orange-100 text-xs">
                              <span className="text-gray-500">
                                {r.summary && <span className="italic text-gray-400">"{r.summary}"</span>}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className="text-gray-500">Total visits: <span className="font-bold text-[#1a1a1a]">{r.visits_count}</span></span>
                                <span className="text-gray-500">Total samples: <span className="font-bold text-[#16a34a]">{r.samples_count}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
              const isCycleExpanded = expandedCycle === c.id;
              const monthLabel = format(new Date(c.year, c.month - 1), "MMMM yyyy");
              const tierCounts = { A: 0, B: 0, C: 0 };
              c.items.forEach((i) => { if (i.tier in tierCounts) tierCounts[i.tier as keyof typeof tierCounts]++; });
              return (
                <div key={c.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#16a34a] font-black text-sm">
                          {c.user.firstname.charAt(0)}{c.user.lastname.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-[#1a1a1a]">
                          {c.user.firstname} {c.user.lastname}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {monthLabel} · {c.items.length} doctors
                          {tierCounts.A > 0 && <span className="ml-1.5 font-semibold text-[#16a34a]">A×{tierCounts.A}</span>}
                          {tierCounts.B > 0 && <span className="ml-1 font-semibold text-amber-500">B×{tierCounts.B}</span>}
                          {tierCounts.C > 0 && <span className="ml-1 font-semibold text-gray-400">C×{tierCounts.C}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      <button
                        onClick={() => setExpandedCycle(isCycleExpanded ? null : c.id)}
                        className="text-gray-400 hover:text-violet-600 focus-visible:outline-none"
                        style={{ transition: "color 0.15s" }}
                        title="Review full doctor list"
                      >
                        {isCycleExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
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

                  {isCycleExpanded && (
                    <div className="mt-3 rounded-xl border border-violet-100 overflow-hidden">
                      {/* Column headers */}
                      <div className="grid text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-violet-50 border-b border-violet-100"
                           style={{ gridTemplateColumns: "2rem 1fr 1fr 3.5rem 3.5rem" }}>
                        <span className="px-3 py-2">#</span>
                        <span className="px-3 py-2">Doctor</span>
                        <span className="px-3 py-2">Facility · Town</span>
                        <span className="px-3 py-2 text-center">Tier</span>
                        <span className="px-3 py-2 text-center">Target</span>
                      </div>

                      {/* Rows sorted by tier A → B → C */}
                      {["A","B","C"].flatMap((tier) =>
                        c.items
                          .filter((item) => item.tier === tier)
                          .map((item, idx, arr) => (
                            <div
                              key={item.id}
                              className={`grid items-center border-b border-violet-50 last:border-0 text-xs
                                ${tier === "A" ? "hover:bg-green-50/40" : tier === "B" ? "hover:bg-amber-50/30" : "hover:bg-gray-50/60"}`}
                              style={{ gridTemplateColumns: "2rem 1fr 1fr 3.5rem 3.5rem" }}
                            >
                              <span className="px-3 py-3 text-gray-300 font-mono text-[10px]">
                                {c.items.filter(i => i.tier === tier).indexOf(item) + 1}
                              </span>
                              <div className="px-3 py-3 min-w-0">
                                <p className="font-semibold text-[#1a1a1a] truncate">{item.doctor.doctor_name}</p>
                                {(item.doctor.speciality ?? []).length > 0 && (
                                  <p className="text-[10px] text-gray-400 truncate">{(item.doctor.speciality ?? []).join(", ")}</p>
                                )}
                              </div>
                              <div className="px-3 py-3 min-w-0">
                                <p className="text-gray-600 truncate">{item.doctor.location ?? "—"}</p>
                                {item.doctor.town && <p className="text-[10px] text-gray-400 truncate">{item.doctor.town}</p>}
                              </div>
                              <div className="px-3 py-3 flex justify-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  tier === "A" ? "bg-green-100 text-[#16a34a]"
                                  : tier === "B" ? "bg-amber-100 text-amber-600"
                                  : "bg-gray-100 text-gray-500"
                                }`}>{tier}</span>
                              </div>
                              <span className="px-3 py-3 text-center font-bold text-gray-600">{item.frequency}×</span>
                            </div>
                          ))
                      )}

                      {/* Tier summary footer */}
                      <div className="flex items-center gap-4 px-4 py-2.5 bg-violet-50 border-t border-violet-100 text-[11px]">
                        <span className="text-gray-400">Totals:</span>
                        {tierCounts.A > 0 && <span className="font-bold text-[#16a34a]">Tier A: {tierCounts.A} × {c.items.filter(i=>i.tier==="A").reduce((s,i)=>s+i.frequency,0)} visits</span>}
                        {tierCounts.B > 0 && <span className="font-bold text-amber-500">Tier B: {tierCounts.B} × {c.items.filter(i=>i.tier==="B").reduce((s,i)=>s+i.frequency,0)} visits</span>}
                        {tierCounts.C > 0 && <span className="font-bold text-gray-400">Tier C: {tierCounts.C} × {c.items.filter(i=>i.tier==="C").reduce((s,i)=>s+i.frequency,0)} visits</span>}
                        <span className="ml-auto text-gray-500 font-semibold">
                          Total target: {c.items.reduce((s,i)=>s+i.frequency,0)} visits/month
                        </span>
                      </div>
                    </div>
                  )}
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
            <p className="text-xs text-gray-400 mt-0.5">Cycle adherence, visit frequency &amp; field alerts — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
          </div>
          {!loading && teamPerf.length > 0 && (
            <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-full border border-[#dcfce7]">
              {teamPerf.length} rep{teamPerf.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#16a34a] animate-spin" />
          </div>
        ) : teamPerf.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LuCircleCheck className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No reps found</p>
            <p className="text-gray-400 text-xs mt-1">Add reps to your company to see performance data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Today</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">MTD</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Cycle</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Seen</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Flags</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamPerf.map((row) => {
                  const pct = row.cycle_adherence_pct ?? 0;
                  const daysSince = row.days_since_last_visit;
                  const isInactive = daysSince === null || daysSince > 2;
                  const hasGpsFlag = row.gps_anomaly_count_week > 0;
                  const lowCycle = pct < 50 && row.cycle_total_target > 0;
                  const hasPending = row.pending_reports > 0 || row.pending_expenses > 0;

                  const status = isInactive
                    ? { label: "Inactive", cls: "bg-red-50 text-red-600", icon: FaArrowTrendDown, iconCls: "text-red-500" }
                    : lowCycle
                    ? { label: "Behind", cls: "bg-amber-50 text-amber-600", icon: FaArrowTrendDown, iconCls: "text-amber-500" }
                    : { label: "On Track", cls: "bg-green-50 text-[#16a34a]", icon: FaArrowTrendUp, iconCls: "text-[#16a34a]" };
                  const StatusIcon = status.icon;

                  const lastSeenLabel = daysSince === null
                    ? "Never"
                    : daysSince === 0 ? "Today"
                    : daysSince === 1 ? "Yesterday"
                    : `${daysSince}d ago`;

                  return (
                    <tr key={row.user.id} className={`hover:bg-gray-50/60 ${isInactive ? "bg-red-50/30" : ""}`} style={{ transition: "background-color 0.15s" }}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#16a34a] font-black text-xs">
                              {row.user.firstname.charAt(0)}{row.user.lastname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1a1a] leading-tight">{row.user.firstname} {row.user.lastname}</p>
                            {hasPending && (
                              <p className="text-[10px] text-orange-500 font-semibold leading-tight">
                                {[row.pending_reports > 0 && `${row.pending_reports} report${row.pending_reports > 1 ? "s" : ""}`, row.pending_expenses > 0 && `${row.pending_expenses} expense${row.pending_expenses > 1 ? "s" : ""}`].filter(Boolean).join(" · ")} pending
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-black text-lg leading-none ${row.visits_today > 0 ? "text-[#16a34a]" : "text-gray-300"}`}>
                          {row.visits_today}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">{row.visits_this_month}</td>
                      <td className="px-4 py-3">
                        {row.cycle_total_target > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 70 ? "bg-[#16a34a]" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${Math.min(100, pct)}%`, transition: "width 0.4s ease" }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${pct >= 70 ? "text-[#16a34a]" : pct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">No cycle</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${daysSince === 0 ? "text-[#16a34a]" : daysSince !== null && daysSince <= 1 ? "text-gray-600" : "text-red-500"}`}>
                          {lastSeenLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {hasGpsFlag && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                              <MdOutlineGpsOff className="w-3 h-3" />
                              {row.gps_anomaly_count_week}
                            </span>
                          )}
                          {!hasGpsFlag && !isInactive && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
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

      {/* ── Doctor Recommendations ── */}
      {!loading && recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#dcfce7] shadow-sm shadow-green-50">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#dcfce7]">
            <TbUserCheck className="w-5 h-5 text-[#16a34a]" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Doctor Recommendations</h2>
              <p className="text-xs text-gray-400">Reps requesting to add doctors to your company list</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
              {recommendations.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-[#f0fdf4]">
            {recommendations.map((rec) => {
              const isActioning = actioningRec === rec.id;
              const isNewClinician = !rec.doctor;
              const displayName = rec.doctor
                ? rec.doctor.doctor_name
                : rec.clinician_name ?? "Unknown clinician";
              const subLine = rec.doctor
                ? `${rec.doctor.speciality?.join(" · ") || ""} · ${rec.doctor.town}`
                : [rec.clinician_cadre, rec.clinician_location].filter(Boolean).join(" · ");

              return (
                <div key={rec.id} className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between gap-x-6">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isNewClinician ? "bg-amber-50 border border-amber-200" : "bg-[#f0fdf4] border border-[#dcfce7]"
                    }`}>
                      <TbUserCheck className={`w-4 h-4 ${isNewClinician ? "text-amber-600" : "text-[#16a34a]"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-[#1a1a1a]">{displayName}</p>
                        {isNewClinician && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            New clinician
                          </span>
                        )}
                        {rec.unplanned_visit_count >= 3 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                            {rec.unplanned_visit_count} unplanned visits
                          </span>
                        )}
                      </div>
                      {subLine && <p className="text-xs text-gray-400 mt-0.5">{subLine}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Recommended by <span className="font-semibold text-gray-600">{rec.recommended_by.firstname} {rec.recommended_by.lastname}</span>
                        {" · "}{format(new Date(rec.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pl-12 sm:pl-0">
                    {isActioning ? (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
                    ) : (
                      <>
                        {/* Approve — only for known doctors on master list */}
                        {!isNewClinician && (
                          <button
                            onClick={() => handleApproveRec(rec.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                            style={{ transition: "background-color 0.15s" }}
                          >
                            <TbUserCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {/* Forward to KibagRep — for new clinicians not on master list */}
                        {isNewClinician && (
                          <button
                            onClick={() => handleForwardRec(rec.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
                            style={{ transition: "background-color 0.15s" }}
                          >
                            <TbSend className="w-3.5 h-3.5" />
                            Forward to KibagRep
                          </button>
                        )}

                        <RejectRow onConfirm={(note) => handleRejectRec(rec.id, note)} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
