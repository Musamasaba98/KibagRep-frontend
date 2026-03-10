import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FiFileText, FiCheckCircle, FiXCircle, FiClock, FiSend } from "react-icons/fi";
import { getTodayReportApi, submitDailyReportApi, getMyReportsApi } from "../../../services/api";

interface DailyReport {
  id: string;
  report_date: string;
  summary: string | null;
  visits_count: number;
  samples_count: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  review_note: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  DRAFT:     { label: "Draft",     icon: FiFileText,    bg: "bg-gray-100",   text: "text-gray-600"   },
  SUBMITTED: { label: "Submitted", icon: FiClock,       bg: "bg-amber-100",  text: "text-amber-700"  },
  APPROVED:  { label: "Approved",  icon: FiCheckCircle, bg: "bg-green-100",  text: "text-green-700"  },
  REJECTED:  { label: "Rejected",  icon: FiXCircle,     bg: "bg-red-100",    text: "text-red-700"    },
};

const StatusBadge = ({ status }: { status: DailyReport["status"] }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const Reports = () => {
  const [today, setToday] = useState<DailyReport | null>(null);
  const [history, setHistory] = useState<DailyReport[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        getTodayReportApi(),
        getMyReportsApi(30),
      ]);
      const todayReport: DailyReport = todayRes.data.data;
      setToday(todayReport);
      setSummary(todayReport.summary ?? "");
      // history excluding today
      const hist: DailyReport[] = histRes.data.data;
      setHistory(hist.filter((r) => r.id !== todayReport.id));
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!summary.trim()) { setError("Please write a summary before submitting."); return; }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await submitDailyReportApi({ summary });
      setToday(res.data.data);
      setSuccess("Report submitted successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  const canSubmit = today && (today.status === "DRAFT" || today.status === "REJECTED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Today's report */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-base">
              Today's Report — {format(new Date(), "dd MMM yyyy")}
            </h2>
            {today && (
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-md">
              {success}
            </div>
          )}

          {today?.status === "REJECTED" && today.review_note && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
              <span className="font-semibold">Rejected: </span>{today.review_note}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Summary / Notes
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!canSubmit}
              rows={5}
              placeholder="How was your day? Key highlights, challenges, follow-ups needed…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "opacity 0.15s" }}
            >
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          )}

          {today?.status === "SUBMITTED" && (
            <p className="text-center text-sm text-amber-600 font-medium">
              Awaiting supervisor review
            </p>
          )}
          {today?.status === "APPROVED" && (
            <p className="text-center text-sm text-green-600 font-medium">
              Report approved
            </p>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
            Past 30 days
          </h3>
          {history.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-start justify-between gap-4 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700">
                  {format(new Date(r.report_date), "dd MMM yyyy")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.visits_count} visits · {r.samples_count} samples
                </p>
                {r.summary && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.summary}</p>
                )}
                {r.status === "REJECTED" && r.review_note && (
                  <p className="text-xs text-red-600 mt-1">
                    <span className="font-medium">Note: </span>{r.review_note}
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
