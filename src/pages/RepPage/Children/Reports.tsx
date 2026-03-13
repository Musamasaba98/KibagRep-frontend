import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FiFileText, FiCheckCircle, FiXCircle, FiClock, FiSend, FiUsers } from "react-icons/fi";
import { getTodayReportApi, submitDailyReportApi, getMyReportsApi, getCompanyObserversApi } from "../../../services/api";

interface DailyReport {
  id: string;
  report_date: string;
  summary: string | null;
  visits_count: number;
  samples_count: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  review_note: string | null;
  jfw_observer_id: string | null;
  created_at: string;
}

interface Observer {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
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
  const [jfwEnabled,     setJfwEnabled]     = useState(false);
  const [jfwObserverIds, setJfwObserverIds] = useState<string[]>([]);
  const [observers,      setObservers]      = useState<Observer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [todayRes, histRes, obsRes] = await Promise.all([
        getTodayReportApi(),
        getMyReportsApi(30),
        getCompanyObserversApi(),
      ]);
      const todayReport: DailyReport = todayRes.data.data;
      setToday(todayReport);
      setSummary(todayReport.summary ?? "");
      if (todayReport.jfw_observer_id) {
        setJfwEnabled(true);
        setJfwObserverIds([todayReport.jfw_observer_id]);
      }
      const hist: DailyReport[] = histRes.data.data;
      setHistory(hist.filter((r) => r.id !== todayReport.id));
      setObservers(obsRes.data.data ?? []);
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
      const res = await submitDailyReportApi({
        summary,
        jfw_observer_id:  jfwEnabled && jfwObserverIds.length > 0 ? jfwObserverIds[0] : undefined,
        jfw_observer_ids: jfwEnabled && jfwObserverIds.length > 0 ? jfwObserverIds    : undefined,
      });
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
                <span className="text-sm font-semibold text-gray-700">Joint Field Work today</span>
              </div>
            </label>

            {jfwEnabled && (
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500">
                  Observers — who joined you in the field
                </label>

                {/* Selected observer chips */}
                {jfwObserverIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {jfwObserverIds.map((id) => {
                      const obs = observers.find((o) => o.id === id);
                      return (
                        <span key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                          {obs ? `${obs.firstname} ${obs.lastname}` : 'Observer'}
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

                {/* Add observer dropdown */}
                {canSubmit && (() => {
                  const unselected = observers.filter((o) => !jfwObserverIds.includes(o.id));
                  if (unselected.length === 0) return null;
                  return (
                    <select defaultValue=""
                      onChange={(e) => {
                        const selected = e.target.value;
                        if (selected) {
                          setJfwObserverIds((prev) => [...prev, selected]);
                          e.target.value = "";
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white">
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
                  <p className="text-xs text-gray-400">No observers added yet.</p>
                )}
              </div>
            )}
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
                {r.jfw_observer_id && (() => {
                  const obs = observers.find((o) => o.id === r.jfw_observer_id);
                  return obs ? (
                    <p className="text-xs text-[#16a34a] mt-1 flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      JFW — {obs.firstname} {obs.lastname}
                    </p>
                  ) : (
                    <p className="text-xs text-[#16a34a] mt-1 flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      JFW (observer)
                    </p>
                  );
                })()}
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
