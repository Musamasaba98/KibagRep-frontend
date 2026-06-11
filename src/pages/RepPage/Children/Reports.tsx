import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  FiFileText, FiCheckCircle, FiXCircle, FiClock, FiSend,
  FiUsers, FiDownload, FiAlertTriangle,
} from "react-icons/fi";
import {
  LuTrendingUp, LuCalendarCheck, LuActivity, LuBeaker,
} from "react-icons/lu";
import {
  getTodayReportApi, submitDailyReportApi, getMyReportsApi,
  getCompanyObserversApi, downloadReportApi,
  createLateRequestApi, getMyLateRequestsApi, getMyReportSummaryApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyReport {
  id: string;
  report_date: string;
  summary: string | null;
  visits_count: number;
  samples_count: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  review_note: string | null;
  jfw_observer_id: string | null;
}

interface Observer {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
}

interface SampleBalance {
  product_id: string;
  product_name: string;
  issued: number;
  given: number;
  remaining: number;
}

interface MonthlySummary {
  month: number;
  year: number;
  doctor_visits: number;
  pharmacy_visits: number;
  total_visits: number;
  samples_given: number;
  nca_count: number;
  working_days: number;
  reports_submitted: number;
  reports_approved: number;
  cycle_planned: number;
  cycle_visited: number;
  cycle_status: string | null;
  sample_balances: SampleBalance[];
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG = {
  DRAFT:     { label: "Draft",     Icon: FiFileText,    bg: "bg-gray-100",   text: "text-gray-600"   },
  SUBMITTED: { label: "Submitted", Icon: FiClock,       bg: "bg-amber-100",  text: "text-amber-700"  },
  APPROVED:  { label: "Approved",  Icon: FiCheckCircle, bg: "bg-green-100",  text: "text-green-700"  },
  REJECTED:  { label: "Rejected",  Icon: FiXCircle,     bg: "bg-red-100",    text: "text-red-700"    },
} as const;

const StatusBadge = ({ status }: { status: DailyReport["status"] }) => {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-poppins-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const ProgressBar = ({ value, max, color = "#16a34a" }: { value: number; max: number; color?: string }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.4s" }} />
    </div>
  );
};

// ─── Monthly Performance Section ─────────────────────────────────────────────

const MonthlyPerformance = ({
  summary, month, year,
}: { summary: MonthlySummary | null; month: number; year: number }) => {
  if (!summary) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-8 text-center text-sm text-gray-400 font-poppins">
      No data for {MONTH_NAMES[month - 1]} {year}
    </div>
  );

  const submissionRate = summary.working_days > 0
    ? Math.round((summary.reports_submitted / summary.working_days) * 100)
    : 0;
  const cycleRate = summary.cycle_planned > 0
    ? Math.round((summary.cycle_visited / summary.cycle_planned) * 100)
    : 0;

  const kpis = [
    {
      label: "Total Visits",
      value: summary.total_visits,
      sub: `${summary.doctor_visits} Dr · ${summary.pharmacy_visits} Ph`,
      Icon: LuActivity,
      color: "#16a34a",
    },
    {
      label: "Samples Given",
      value: summary.samples_given,
      sub: `${summary.nca_count} NCA this month`,
      Icon: LuBeaker,
      color: "#0284c7",
    },
    {
      label: "Report Rate",
      value: `${submissionRate}%`,
      sub: `${summary.reports_submitted}/${summary.working_days} working days`,
      Icon: LuTrendingUp,
      color: submissionRate >= 80 ? "#16a34a" : submissionRate >= 60 ? "#d97706" : "#dc2626",
    },
    {
      label: "Cycle Coverage",
      value: `${cycleRate}%`,
      sub: `${summary.cycle_visited}/${summary.cycle_planned} doctors`,
      Icon: LuCalendarCheck,
      color: cycleRate >= 80 ? "#16a34a" : cycleRate >= 60 ? "#d97706" : "#dc2626",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-poppins-bold text-gray-800 text-base">
          {MONTH_NAMES[month - 1]} {year} — Performance
        </h2>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
        {kpis.map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="px-4 py-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] font-poppins-semibold uppercase tracking-wider text-gray-400">{label}</span>
            </div>
            <span className="text-2xl font-poppins-bold" style={{ color }}>{value}</span>
            <span className="text-[11px] font-poppins text-gray-400">{sub}</span>
          </div>
        ))}
      </div>

      {/* Cycle progress bar */}
      {summary.cycle_planned > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-poppins-semibold text-gray-600">Call cycle progress</span>
            <span className="text-xs font-poppins text-gray-400">{summary.cycle_visited}/{summary.cycle_planned} doctors</span>
          </div>
          <ProgressBar value={summary.cycle_visited} max={summary.cycle_planned} />
        </div>
      )}

      {/* Submission progress bar */}
      {summary.working_days > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-poppins-semibold text-gray-600">Report submissions</span>
            <span className="text-xs font-poppins text-gray-400">{summary.reports_submitted}/{summary.working_days} days</span>
          </div>
          <ProgressBar
            value={summary.reports_submitted}
            max={summary.working_days}
            color={submissionRate >= 80 ? "#16a34a" : submissionRate >= 60 ? "#d97706" : "#dc2626"}
          />
        </div>
      )}
    </div>
  );
};

// ─── Sample Balance Section ───────────────────────────────────────────────────

const SampleBalanceSection = ({ balances }: { balances: SampleBalance[] }) => {
  if (balances.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5">
      <div className="flex items-center gap-2 mb-2">
        <LuBeaker className="w-4 h-4 text-[#16a34a]" />
        <h2 className="font-poppins-bold text-gray-800 text-base">Sample Balance</h2>
      </div>
      <p className="text-sm font-poppins text-gray-400">No samples issued yet.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <LuBeaker className="w-4 h-4 text-[#16a34a]" />
        <h2 className="font-poppins-bold text-gray-800 text-base">Sample Balance</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {balances.map((b) => {
          const usedPct = b.issued > 0 ? Math.round((b.given / b.issued) * 100) : 0;
          const lowStock = b.remaining <= 5 && b.issued > 0;
          return (
            <div key={b.product_id} className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-poppins-semibold text-gray-700">{b.product_name}</span>
                <span className={`text-xs font-poppins-bold px-2 py-0.5 rounded-full ${
                  lowStock ? "bg-red-100 text-red-600" : "bg-[#f0fdf4] text-[#16a34a]"
                }`}>
                  {b.remaining} left
                </span>
              </div>
              <ProgressBar value={b.given} max={b.issued} color={lowStock ? "#dc2626" : "#16a34a"} />
              <div className="flex justify-between mt-1.5 text-[11px] font-poppins text-gray-400">
                <span>{b.given} given ({usedPct}%)</span>
                <span>{b.issued} issued</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Reports = () => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const [summary,   setSummary]   = useState<MonthlySummary | null>(null);
  const [today,     setToday]     = useState<DailyReport | null>(null);
  const [history,   setHistory]   = useState<DailyReport[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);

  const [reportSummary,  setReportSummary]  = useState("");
  const [jfwEnabled,     setJfwEnabled]     = useState(false);
  const [jfwObserverIds, setJfwObserverIds] = useState<string[]>([]);

  const [loading,      setLoading]      = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [midnightLocked, setMidnightLocked] = useState(false);
  const [lateReqStatus,  setLateReqStatus]  = useState<"none"|"pending"|"approved">("none");
  const [sendingLateReq, setSendingLateReq] = useState(false);
  const [lateNote,       setLateNote]       = useState("");

  const [dlMonth, setDlMonth] = useState(now.getMonth() + 1);
  const [dlYear,  setDlYear]  = useState(now.getFullYear());

  const thisYear = now.getFullYear();
  const years    = [thisYear - 1, thisYear];

  // Load fixed data once
  useEffect(() => {
    const fetchCore = async () => {
      const curMonth = now.getMonth() + 1;
      const curYear  = now.getFullYear();
      const [todayRes, histRes, obsRes, lateRes, sumRes] = await Promise.allSettled([
        getTodayReportApi(),
        getMyReportsApi(30),
        getCompanyObserversApi(),
        getMyLateRequestsApi(),
        getMyReportSummaryApi(curMonth, curYear),
      ]);

      // Today's report is critical — show error if it fails
      if (todayRes.status === "fulfilled") {
        const todayRpt: DailyReport = todayRes.value.data.data;
        setToday(todayRpt);
        setReportSummary(todayRpt.summary ?? "");
        if (todayRpt.jfw_observer_id) {
          setJfwEnabled(true);
          setJfwObserverIds([todayRpt.jfw_observer_id]);
        }
      } else {
        setError("Failed to load today's report.");
      }

      if (histRes.status === "fulfilled") {
        const todayId = todayRes.status === "fulfilled" ? todayRes.value.data.data?.id : null;
        setHistory((histRes.value.data.data as DailyReport[]).filter((r) => r.id !== todayId));
      }

      if (obsRes.status === "fulfilled") {
        setObservers(obsRes.value.data.data ?? []);
      }

      if (lateRes.status === "fulfilled") {
        const reqs = lateRes.value.data.data ?? [];
        const match = reqs.find((r: any) => r.type === "DAILY_REPORT" && r.month === curMonth && r.year === curYear);
        if (match?.status === "APPROVED")    setLateReqStatus("approved");
        else if (match?.status === "PENDING") setLateReqStatus("pending");
      }

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.data.data);
      }

      setLoading(false);
    };
    fetchCore();
  }, []);

  // Reload summary when month/year selector changes
  useEffect(() => {
    setSummaryLoading(true);
    getMyReportSummaryApi(selMonth, selYear)
      .then((r) => setSummary(r.data.data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selMonth, selYear]);

  const handleSubmit = async () => {
    if (!reportSummary.trim()) { setError("Please write a summary before submitting."); return; }
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      const res = await submitDailyReportApi({
        summary: reportSummary,
        jfw_observer_id:  jfwEnabled && jfwObserverIds.length > 0 ? jfwObserverIds[0] : undefined,
        jfw_observer_ids: jfwEnabled && jfwObserverIds.length > 0 ? jfwObserverIds    : undefined,
      });
      setToday(res.data.data);
      setSuccess("Report submitted successfully.");
      setMidnightLocked(false);
    } catch (err: any) {
      if (err.response?.data?.error === "LATE_SUBMISSION_REQUIRED") {
        setMidnightLocked(true);
      } else {
        setError(err.response?.data?.message || "Failed to submit report.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendLateReq = async () => {
    if (!lateNote.trim()) return;
    setSendingLateReq(true);
    try {
      await createLateRequestApi({ type: "DAILY_REPORT", month: now.getMonth() + 1, year: now.getFullYear(), note: lateNote });
      setLateReqStatus("pending");
      setLateNote("");
    } catch { /* ignore */ }
    finally { setSendingLateReq(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadReportApi(dlMonth, dlYear);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `Report_${dlMonth}_${dlYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silently fail */ }
    finally { setDownloading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-poppins">
        Loading…
      </div>
    );
  }

  const canSubmit = today && (today.status === "DRAFT" || today.status === "REJECTED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* ── Monthly Performance ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-poppins-semibold uppercase tracking-wider text-gray-400">
            Monthly Performance
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={selMonth}
              onChange={(e) => setSelMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m.slice(0, 3)}</option>
              ))}
            </select>
            <select
              value={selYear}
              onChange={(e) => setSelYear(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {summaryLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-32 flex items-center justify-center text-sm text-gray-400 font-poppins">
            Loading…
          </div>
        ) : (
          <MonthlyPerformance summary={summary} month={selMonth} year={selYear} />
        )}
      </div>

      {/* ── Sample Balance ────────────────────────────────────────────────── */}
      <SampleBalanceSection balances={summary?.sample_balances ?? []} />

      {/* ── Download Monthly Report ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FiDownload className="w-4 h-4 text-[#16a34a]" />
          <h2 className="font-poppins-bold text-gray-800 text-base">Download Monthly Report</h2>
        </div>
        <div className="px-5 py-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-poppins-semibold text-gray-500">Month</label>
            <select
              value={dlMonth}
              onChange={(e) => setDlMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-[#16a34a] bg-white"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-poppins-semibold text-gray-500">Year</label>
            <select
              value={dlYear}
              onChange={(e) => setDlYear(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-[#16a34a] bg-white"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-poppins-semibold px-4 py-2 rounded-lg text-sm"
            style={{ transition: "background-color 0.15s" }}
          >
            <FiDownload className="w-4 h-4" />
            {downloading ? "Generating…" : "Download Excel"}
          </button>
          <p className="text-xs font-poppins text-gray-400 w-full">
            Veeram-style report — all visits, samples, and pharmacy coverage for the selected month.
          </p>
        </div>
      </div>

      {/* ── Today's Report ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-poppins-bold text-gray-800 text-base">
              Today's Report — {format(new Date(), "dd MMM yyyy")}
            </h2>
            {today && (
              <div className="flex font-poppins items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{today.visits_count} visits</span>
                <span>·</span>
                <span>{today.samples_count} samples</span>
              </div>
            )}
          </div>
          {today && <StatusBadge status={today.status} />}
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 font-poppins border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 font-poppins border border-green-200 text-green-700 text-sm px-3 py-2 rounded-md">
              {success}
            </div>
          )}

          {today?.status === "REJECTED" && today.review_note && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
              <span className="font-poppins-semibold">Rejected: </span>{today.review_note}
            </div>
          )}

          {midnightLocked && today?.status === "DRAFT" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-3">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-poppins-semibold text-red-700">Report window closed at midnight</p>
                  <p className="text-xs font-poppins text-red-600 mt-0.5">
                    {lateReqStatus === "pending"
                      ? "Your request is pending supervisor approval."
                      : "You need supervisor approval to submit a late report."}
                  </p>
                </div>
              </div>
              {lateReqStatus === "none" && (
                <div className="space-y-2">
                  <textarea
                    value={lateNote}
                    onChange={(e) => setLateNote(e.target.value)}
                    rows={2}
                    placeholder="Explain why you couldn't submit before midnight…"
                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-red-400 resize-none bg-white"
                  />
                  <button
                    onClick={handleSendLateReq}
                    disabled={sendingLateReq || !lateNote.trim()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-poppins-semibold px-4 py-2 rounded-lg"
                    style={{ transition: "background-color 0.15s" }}>
                    {sendingLateReq ? "Sending…" : "Request Late Submission"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-poppins-semibold text-gray-700 mb-1">
              Summary / Notes
            </label>
            <textarea
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              disabled={!canSubmit}
              rows={5}
              placeholder="How was your day? Key highlights, challenges, follow-ups needed…"
              className="w-full font-poppins border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Joint Field Work */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0">
                <input type="checkbox" className="sr-only" checked={jfwEnabled} disabled={!canSubmit}
                  onChange={(e) => { setJfwEnabled(e.target.checked); if (!e.target.checked) setJfwObserverIds([]); }} />
                <div className={`w-10 h-5 rounded-full ${jfwEnabled ? "bg-[#16a34a]" : "bg-gray-300"} ${!canSubmit ? "opacity-50" : ""}`}
                  style={{ transition: "background-color 0.2s" }} />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  style={{ transform: jfwEnabled ? "translateX(20px)" : "translateX(0)", transition: "transform 0.2s" }} />
              </div>
              <div className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-[#16a34a]" />
                <span className="text-sm font-poppins-semibold text-gray-700">Joint Field Work today</span>
              </div>
            </label>

            {jfwEnabled && (
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-xs font-poppins-semibold text-gray-500">
                  Observers — who joined you in the field
                </label>

                {jfwObserverIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {jfwObserverIds.map((id) => {
                      const obs = observers.find((o) => o.id === id);
                      return (
                        <span key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-poppins-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                          {obs ? `${obs.firstname} ${obs.lastname}` : "Observer"}
                          {canSubmit && (
                            <button type="button"
                              onClick={() => setJfwObserverIds((prev) => prev.filter((x) => x !== id))}
                              className="text-[#16a34a]/60 hover:text-red-500 focus-visible:outline-none ml-0.5"
                              style={{ transition: "color 0.15s" }}>
                              ×
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {canSubmit && (() => {
                  const unselected = observers.filter((o) => !jfwObserverIds.includes(o.id));
                  if (unselected.length === 0) return null;
                  return (
                    <select defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setJfwObserverIds((prev) => [...prev, e.target.value]);
                          e.target.value = "";
                        }
                      }}
                      className="w-full font-poppins border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16a34a] bg-white">
                      <option value="">+ Add observer…</option>
                      {unselected.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.firstname} {o.lastname} ({o.role})
                        </option>
                      ))}
                    </select>
                  );
                })()}

                {jfwObserverIds.length === 0 && (
                  <p className="text-xs font-poppins text-gray-400">No observers added yet.</p>
                )}
              </div>
            )}
          </div>

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center font-poppins justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm"
              style={{ transition: "opacity 0.15s" }}
            >
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          )}

          {today?.status === "SUBMITTED" && (
            <p className="text-center text-sm text-amber-600 font-poppins-semibold">
              Awaiting supervisor review
            </p>
          )}
          {today?.status === "APPROVED" && (
            <p className="text-center font-poppins-semibold text-sm text-green-600">
              Report approved
            </p>
          )}
        </div>
      </div>

      {/* ── History ───────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-poppins-semibold uppercase tracking-wider text-gray-400 px-1">
            Past 30 days
          </h3>
          {history.map((r) => (
            <div key={r.id}
              className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-start justify-between gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-poppins-semibold text-gray-700">
                  {format(new Date(r.report_date), "dd MMM yyyy")}
                </p>
                <p className="text-xs font-poppins text-gray-400 mt-0.5">
                  {r.visits_count} visits · {r.samples_count} samples
                </p>
                {r.summary && (
                  <p className="text-xs text-gray-500 font-poppins mt-1 line-clamp-2">{r.summary}</p>
                )}
                {r.jfw_observer_id && (() => {
                  const obs = observers.find((o) => o.id === r.jfw_observer_id);
                  return (
                    <p className="text-xs font-poppins text-[#16a34a] mt-1 flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      JFW — {obs ? `${obs.firstname} ${obs.lastname}` : "observer"}
                    </p>
                  );
                })()}
                {r.status === "REJECTED" && r.review_note && (
                  <p className="text-xs font-poppins text-red-600 mt-1">
                    <span className="font-poppins-semibold">Note: </span>{r.review_note}
                  </p>
                )}
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Reports;
