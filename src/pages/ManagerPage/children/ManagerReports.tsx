import { useEffect, useState, useCallback } from "react";
import { Column } from "@ant-design/plots";
import {
  FiChevronDown, FiChevronUp, FiCheck, FiX, FiAlertCircle, FiFileText,
} from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  LuTrendingUp, LuFlaskConical, LuTriangleAlert, LuUsers, LuFileText, LuDownload,
} from "react-icons/lu";
import {
  getCompanyReportsApi, approveReportApi, rejectReportApi,
  getDailyReportActivitiesApi, getTeamPerformanceApi, getTeamTargetsApi,
  getVisitTrendApi, getProductDetailingApi, getAnomaliesApi,
} from "../../../services/api";
import DownloadReportWidget from "../../../componets/DownloadReportWidget/DownloadReportWidget";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTab = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL";
type Days = 7 | 30 | 60;
type MainTab = "reports" | "team" | "trend" | "detailing" | "anomalies" | "download";

interface Report {
  id: string; report_date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  visits_count: number; samples_count: number;
  summary: string | null; review_note: string | null;
  jfw_observer_id: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
}
interface Activity {
  id: string; activity_type?: "doctor" | "pharmacy"; visit_type?: string;
  samples_given?: number; nca_reason?: string | null; gps_anomaly_flag?: boolean;
  doctor?: { doctor_name: string; town?: string } | null;
  pharmacy?: { pharmacy_name: string; town?: string } | null;
  focused_product?: { product_name: string } | null;
}
interface RepPerf {
  user: { id: string; firstname: string; lastname: string };
  today_visits: number; week_visits: number; month_visits: number;
  cycle_adherence_pct: number | null; gps_anomaly_count: number;
  pending_reports: number; pending_expenses: number;
  days_since_last_visit: number | null;
}
interface Target {
  user: { id: string; firstname: string; lastname: string };
  target: { doctor_visits_target: number; pharmacy_visits_target: number } | null;
}
interface TrendPoint {
  date: string; doctor_visits: number; pharmacy_visits: number; total: number;
}
interface ProductRow {
  product_id: string; product_name: string; detailed: number; as_focus: number;
}
interface AnomalyRow {
  user: { id: string; firstname: string; lastname: string };
  nca_count: number; gps_count: number; last_nca_date: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIALS = (u: { firstname: string; lastname: string }) =>
  `${u.firstname?.[0] ?? ""}${u.lastname?.[0] ?? ""}`.toUpperCase();

const FMT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const FMT_SHORT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS = {
  SUBMITTED: { label: "Pending",  bg: "bg-amber-50",  text: "text-amber-700"  },
  APPROVED:  { label: "Approved", bg: "bg-[#f0fdf4]", text: "text-[#16a34a]" },
  REJECTED:  { label: "Rejected", bg: "bg-red-50",    text: "text-red-600"   },
  DRAFT:     { label: "Draft",    bg: "bg-gray-100",  text: "text-gray-500"  },
} as const;

const Spinner = ({ sm }: { sm?: boolean }) => (
  <div className={`rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin ${sm ? "w-4 h-4" : "w-6 h-6"}`} />
);

const Empty = ({ text, sub }: { text: string; sub?: string }) => (
  <div className="flex flex-col items-center py-16">
    <FiFileText className="w-10 h-10 text-gray-200 mb-3" />
    <p className="text-gray-500 font-poppins-semibold text-sm">{text}</p>
    {sub && <p className="text-gray-400 font-poppins text-xs mt-1">{sub}</p>}
  </div>
);

const Bar = ({ value, max, color = "#16a34a" }: { value: number; max: number; color?: string }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.3s" }} />
    </div>
  );
};

// ─── Tab: Daily Reports ───────────────────────────────────────────────────────

const ReportsTab = () => {
  const [tab,      setTab]      = useState<StatusTab>("SUBMITTED");
  const [days,     setDays]     = useState<Days>(30);
  const [reports,  setReports]  = useState<Report[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acts,     setActs]     = useState<Record<string, Activity[]>>({});
  const [loadingAct, setLoadingAct] = useState<string | null>(null);
  const [actioning,  setActioning]  = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    const sp = tab === "ALL" ? "SUBMITTED,APPROVED,REJECTED" : tab;
    getCompanyReportsApi(`days=${days}&status=${sp}`)
      .then((r) => setReports(r.data?.data ?? []))
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, [tab, days]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string) => {
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

  const approve = async (id: string) => {
    setActioning(id);
    try { await approveReportApi(id); setReports((p) => p.map((r) => r.id === id ? { ...r, status: "APPROVED" as const } : r)); }
    catch { setError("Failed."); } finally { setActioning(null); }
  };

  const reject = async (id: string, note: string) => {
    setActioning(id);
    try { await rejectReportApi(id, { note }); setReports((p) => p.map((r) => r.id === id ? { ...r, status: "REJECTED" as const, review_note: note } : r)); }
    catch { setError("Failed."); } finally { setActioning(null); }
  };

  const pendingCount = reports.filter((r) => r.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">All company daily reports</p>
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
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["SUBMITTED","APPROVED","REJECTED","ALL"] as StatusTab[]).map((key) => (
            <button key={key} onClick={() => { setTab(key); setExpanded(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-poppins-semibold focus-visible:outline-none ${tab === key ? "text-[#16a34a] border-b-2 border-[#16a34a] bg-[#f0fdf4]/50" : "text-gray-400 hover:text-gray-600"}`}
              style={{ transition: "color 0.15s" }}>
              {key === "SUBMITTED" ? "Pending" : key === "ALL" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()}
              {key === "SUBMITTED" && pendingCount > 0 && !loading && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-poppins-bold ${tab === "SUBMITTED" ? "bg-[#16a34a] text-white" : "bg-amber-100 text-amber-700"}`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-gray-400 text-sm"><Spinner sm />Loading...</div>
        ) : reports.length === 0 ? (
          <Empty text="No reports found" />
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((rep) => {
              const s = STATUS[rep.status] ?? STATUS.DRAFT;
              const isOpen = expanded === rep.id;
              return (
                <div key={rep.id}>
                  <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer" onClick={() => toggle(rep.id)}>
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] hidden sm:flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-poppins-bold text-xs">{INITIALS(rep.user)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{rep.user.firstname} {rep.user.lastname}</p>
                      <p className="text-xs text-gray-400">{FMT(rep.report_date)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                      <span><strong className="text-[#1a1a1a]">{rep.visits_count}</strong> visits</span>
                      <span><strong className="text-[#1a1a1a]">{rep.samples_count}</strong> samples</span>
                    </div>
                    <span className={`text-[11px] font-poppins-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                    {isOpen ? <FiChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <FiChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-5 py-4 flex flex-col gap-3">
                      {rep.summary && <p className="text-sm text-gray-600 italic bg-white rounded-xl px-3.5 py-2.5 border border-gray-100 font-poppins">"{rep.summary}"</p>}
                      {rep.review_note && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                          <FiAlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-poppins text-red-700">{rep.review_note}</p>
                        </div>
                      )}
                      {loadingAct === rep.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400"><Spinner sm />Loading visits...</div>
                      ) : (acts[rep.id] ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400 font-poppins">No activities recorded.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(acts[rep.id] ?? []).map((a) => (
                            <span key={a.id} className="text-[10px] font-poppins bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-600">
                              {a.activity_type === "pharmacy"
                                ? (a.pharmacy?.pharmacy_name ?? "Pharmacy")
                                : (a.nca_reason ? `NCA — ${a.doctor?.doctor_name ?? ""}` : (a.doctor?.doctor_name ?? "HCP"))}
                            </span>
                          ))}
                        </div>
                      )}
                      {rep.status === "SUBMITTED" && (
                        <div className="flex items-center gap-2 pt-1">
                          {actioning === rep.id ? <Spinner sm /> : (
                            <>
                              <button onClick={() => approve(rep.id)}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-poppins-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none"
                                style={{ transition: "background-color 0.15s" }}>
                                <FiCheck className="w-3.5 h-3.5" />Approve
                              </button>
                              <RejectInline onConfirm={(n) => reject(rep.id, n)} />
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

const RejectInline = ({ onConfirm }: { onConfirm: (n: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-poppins-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-none"
      style={{ transition: "background-color 0.15s" }}>
      <FiX className="w-3.5 h-3.5" />Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason…"
        className="flex-1 text-xs font-poppins border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 min-w-[140px]" />
      <button onClick={() => note.trim() && onConfirm(note.trim())}
        className="px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700">Send</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 font-poppins">Cancel</button>
    </div>
  );
};

// ─── Tab: Team KPI ────────────────────────────────────────────────────────────

const TeamTab = () => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [perf,     setPerf]     = useState<RepPerf[]>([]);
  const [targets,  setTargets]  = useState<Target[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTeamPerformanceApi(),
      getTeamTargetsApi(selMonth, selYear),
    ])
      .then(([p, t]) => { setPerf(p.data?.data ?? []); setTargets(t.data?.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selMonth, selYear]);

  const targetMap = Object.fromEntries(targets.map((t) => [t.user.id, t.target]));
  const thisYear = now.getFullYear();

  if (loading) return <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner sm />Loading...</div>;
  if (perf.length === 0) return <Empty text="No reps found" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Visits vs targets per rep</p>
        <div className="flex items-center gap-2">
          <select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m.slice(0, 3)}</option>)}
          </select>
          <select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
            {[thisYear - 1, thisYear].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {perf.map((r) => {
          const tgt = targetMap[r.user.id];
          const drTarget = tgt?.doctor_visits_target ?? 0;
          const phTarget = tgt?.pharmacy_visits_target ?? 0;
          const cycleColor = r.cycle_adherence_pct == null ? "text-gray-300"
            : r.cycle_adherence_pct >= 80 ? "text-[#16a34a]"
            : r.cycle_adherence_pct >= 60 ? "text-amber-600"
            : "text-red-600";
          const daysBadge = r.days_since_last_visit == null ? null
            : r.days_since_last_visit === 0 ? { label: "Active today", cls: "bg-[#f0fdf4] text-[#16a34a]" }
            : r.days_since_last_visit <= 2  ? { label: `${r.days_since_last_visit}d ago`, cls: "bg-amber-50 text-amber-700" }
            : { label: `${r.days_since_last_visit}d ago`, cls: "bg-red-50 text-red-600" };
          return (
            <div key={r.user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#16a34a] font-poppins-bold text-xs">{INITIALS(r.user)}</span>
                  </div>
                  <div>
                    <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{r.user.firstname} {r.user.lastname}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {daysBadge && <span className={`text-[10px] font-poppins-semibold px-1.5 py-0.5 rounded-full ${daysBadge.cls}`}>{daysBadge.label}</span>}
                      {(r.gps_anomaly_count ?? 0) > 0 && (
                        <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">{r.gps_anomaly_count} GPS ⚠</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-poppins-extrabold ${cycleColor}`}>
                    {r.cycle_adherence_pct != null ? `${r.cycle_adherence_pct}%` : "—"}
                  </p>
                  <p className="text-[10px] font-poppins text-gray-400">cycle</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Today",  value: r.today_visits },
                  { label: "Week",   value: r.week_visits  },
                  { label: "Month",  value: r.month_visits },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg py-2">
                    <p className="text-base font-poppins-bold text-[#1a1a1a]">{value ?? 0}</p>
                    <p className="text-[10px] font-poppins text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {(drTarget > 0 || phTarget > 0) && (
                <div className="flex flex-col gap-2">
                  {drTarget > 0 && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-poppins text-gray-500">Doctor visits</span>
                        <span className="text-[10px] font-poppins text-gray-400">{r.month_visits}/{drTarget}</span>
                      </div>
                      <Bar value={r.month_visits} max={drTarget} color={r.month_visits >= drTarget ? "#16a34a" : r.month_visits / drTarget >= 0.6 ? "#d97706" : "#dc2626"} />
                    </div>
                  )}
                  {phTarget > 0 && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-poppins text-gray-500">Pharmacy visits</span>
                        <span className="text-[10px] font-poppins text-gray-400">{r.today_visits}/{phTarget}</span>
                      </div>
                      <Bar value={r.today_visits} max={phTarget} color="#0284c7" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab: Visit Trend ─────────────────────────────────────────────────────────

const TrendTab = () => {
  const [data,    setData]    = useState<TrendPoint[]>([]);
  const [days,    setDays]    = useState<Days>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVisitTrendApi(days)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  // Flatten for stacked column: one row per type per day
  const chartData = data.flatMap((d) => [
    { date: FMT_SHORT(d.date), type: "Doctor",   count: d.doctor_visits   },
    { date: FMT_SHORT(d.date), type: "Pharmacy", count: d.pharmacy_visits },
  ]);

  const totalVisits = data.reduce((s, d) => s + d.total, 0);
  const avgPerDay   = data.length > 0 ? Math.round(totalVisits / data.length) : 0;
  const peak        = data.length > 0 ? data.reduce((a, b) => a.total >= b.total ? a : b) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Daily visit volume across all reps</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 30, 60] as Days[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-poppins-semibold focus-visible:outline-none ${days === d ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={{ transition: "background-color 0.15s" }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total visits",  value: totalVisits },
          { label: "Avg per day",   value: avgPerDay   },
          { label: "Peak day",      value: peak ? peak.total : 0, sub: peak ? FMT_SHORT(peak.date) : "—" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xl font-poppins-bold text-[#1a1a1a]">{value}</p>
            <p className="text-[10px] font-poppins text-gray-400">{label}</p>
            {sub && <p className="text-[10px] font-poppins text-[#16a34a]">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : chartData.length === 0 ? (
          <Empty text="No visit data" sub="No activities logged in this period" />
        ) : (
          <Column
            data={chartData}
            xField="date"
            yField="count"
            seriesField="type"
            isStack
            color={["#16a34a", "#7c3aed"]}
            columnStyle={{ radius: [3, 3, 0, 0] }}
            legend={{ position: "top-right" }}
            xAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af", fontFamily: "inherit" } } }}
            yAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af", fontFamily: "inherit" } } }}
            tooltip={{ formatter: (d: any) => ({ name: d.type, value: d.count }) }}
            height={240}
          />
        )}
      </div>
    </div>
  );
};

// ─── Tab: Product Detailing ───────────────────────────────────────────────────

const DetailingTab = () => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [data,     setData]     = useState<ProductRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    getProductDetailingApi(selMonth, selYear)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selMonth, selYear]);

  const maxCount = data.length > 0 ? data[0].detailed : 1;
  const thisYear = now.getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">How often each product is being detailed</p>
        <div className="flex items-center gap-2">
          <select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m.slice(0, 3)}</option>)}
          </select>
          <select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
            {[thisYear - 1, thisYear].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner sm />Loading...</div>
      ) : data.length === 0 ? (
        <Empty text="No detailing data" sub={`No doctor visits with products recorded in ${MONTH_NAMES[selMonth - 1]} ${selYear}`} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid px-5 py-2.5 bg-[#f0fdf4] border-b border-[#dcfce7] text-[10px] font-poppins-bold text-[#16a34a] uppercase tracking-wider"
            style={{ gridTemplateColumns: "1fr 5rem 5rem 7rem" }}>
            <span>Product</span>
            <span className="text-center">Detailed</span>
            <span className="text-center">As Focus</span>
            <span className="text-center">Frequency</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data.map((row, idx) => {
              const focusPct = row.detailed > 0 ? Math.round((row.as_focus / row.detailed) * 100) : 0;
              return (
                <div key={row.product_id}
                  className={`grid items-center px-5 py-3.5 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                  style={{ gridTemplateColumns: "1fr 5rem 5rem 7rem" }}>
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">#1</span>}
                    <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{row.product_name}</p>
                  </div>
                  <p className="text-center text-sm font-poppins-bold text-[#1a1a1a]">{row.detailed}</p>
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-sm font-poppins-bold text-[#16a34a]">{row.as_focus}</p>
                    <p className="text-[10px] font-poppins text-gray-400">{focusPct}%</p>
                  </div>
                  <div className="flex items-center gap-2 px-2">
                    <Bar value={row.detailed} max={maxCount} />
                    <span className="text-[10px] font-poppins text-gray-400 flex-shrink-0">{Math.round((row.detailed / maxCount) * 100)}%</span>
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

// ─── Tab: Anomalies ───────────────────────────────────────────────────────────

const AnomaliesTab = () => {
  const [days,    setDays]    = useState<Days>(14 as Days);
  const [data,    setData]    = useState<AnomalyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnomaliesApi(days)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Reps with GPS anomalies or NCA activity</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 30, 60] as Days[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-poppins-semibold focus-visible:outline-none ${days === d ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={{ transition: "background-color 0.15s" }}>{d}d</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner sm />Loading...</div>
      ) : data.length === 0 ? (
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl px-5 py-8 text-center">
          <p className="text-[#16a34a] font-poppins-semibold text-sm">All clear — no anomalies in the last {days} days</p>
          <p className="text-[#16a34a]/60 font-poppins text-xs mt-1">No GPS flags or NCA patterns to review</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((row) => {
            const severity = row.gps_count >= 3 || row.nca_count >= 5 ? "high"
              : row.gps_count >= 1 || row.nca_count >= 3 ? "medium"
              : "low";
            const colors = {
              high:   { border: "border-red-200",   bg: "bg-red-50",    text: "text-red-700",   badge: "bg-red-100 text-red-700"     },
              medium: { border: "border-amber-200", bg: "bg-amber-50",  text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
              low:    { border: "border-gray-200",  bg: "bg-white",     text: "text-gray-700",  badge: "bg-gray-100 text-gray-500"   },
            }[severity];
            return (
              <div key={row.user.id} className={`border ${colors.border} ${colors.bg} rounded-2xl px-5 py-4 flex items-start justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="font-poppins-bold text-xs text-gray-600">{INITIALS(row.user)}</span>
                  </div>
                  <div>
                    <p className={`font-poppins-semibold text-sm ${colors.text}`}>{row.user.firstname} {row.user.lastname}</p>
                    {row.last_nca_date && (
                      <p className="text-[10px] font-poppins text-gray-400 mt-0.5">Last NCA: {FMT(row.last_nca_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {row.gps_count > 0 && (
                    <span className={`text-[11px] font-poppins-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {row.gps_count} GPS flag{row.gps_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {row.nca_count > 0 && (
                    <span className="text-[11px] font-poppins-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                      {row.nca_count} NCA{row.nca_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Page Shell ───────────────────────────────────────────────────────────────

const MAIN_TABS: { key: MainTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "reports",   label: "Reports",    Icon: LuFileText as React.FC<{ className?: string }>     },
  { key: "team",      label: "Team KPI",   Icon: LuUsers as React.FC<{ className?: string }>        },
  { key: "trend",     label: "Trend",      Icon: LuTrendingUp as React.FC<{ className?: string }>   },
  { key: "detailing", label: "Detailing",  Icon: LuFlaskConical as React.FC<{ className?: string }> },
  { key: "anomalies", label: "Anomalies",  Icon: LuTriangleAlert as React.FC<{ className?: string }>},
  { key: "download",  label: "Download",   Icon: LuDownload as React.FC<{ className?: string }>     },
];

const ManagerReports = () => {
  const [mainTab, setMainTab] = useState<MainTab>("reports");

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Reports</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Team performance, trends, and anomalies</p>
      </div>

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

      {mainTab === "reports"   && <ReportsTab />}
      {mainTab === "team"      && <TeamTab />}
      {mainTab === "trend"     && <TrendTab />}
      {mainTab === "detailing" && <DetailingTab />}
      {mainTab === "anomalies" && <AnomaliesTab />}
      {mainTab === "download"  && <DownloadReportWidget roles={["MedicalRep", "Supervisor"]} />}
    </div>
  );
};

export default ManagerReports;
