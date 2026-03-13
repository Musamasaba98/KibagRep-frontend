import { useEffect, useState, useCallback } from "react";
import {
  FiChevronDown, FiChevronUp, FiCheck, FiX, FiAlertCircle,
  FiFileText, FiUser, FiPackage,
} from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  getCompanyReportsApi,
  approveReportApi,
  rejectReportApi,
  getDailyReportActivitiesApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTab = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL";
type Days = 7 | 30 | 60;

interface Report {
  id: string;
  report_date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  visits_count: number;
  samples_count: number;
  summary: string | null;
  review_note: string | null;
  jfw_observer_id: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
}

interface Activity {
  id: string;
  visit_type: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given: number;
  nca_reason: string | null;
  gps_anomaly_flag: boolean;
  doctor: { doctor_name: string; town?: string } | null;
  focused_product: { product_name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (firstname: string, lastname: string) =>
  `${firstname[0] ?? ""}${lastname[0] ?? ""}`.toUpperCase();

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const StatusPill = ({ status }: { status: Report["status"] }) => {
  const map: Record<Report["status"], { label: string; cls: string }> = {
    SUBMITTED: { label: "Pending", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    APPROVED:  { label: "Approved", cls: "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]" },
    REJECTED:  { label: "Rejected", cls: "bg-red-50 text-red-700 border border-red-200" },
    DRAFT:     { label: "Draft",    cls: "bg-gray-100 text-gray-500 border border-gray-200" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
      {label}
    </span>
  );
};

const VisitTypePill = ({ type }: { type: Activity["visit_type"] }) => {
  const map: Record<Activity["visit_type"], { label: string; cls: string }> = {
    PLANNED:   { label: "Planned",   cls: "bg-[#f0fdf4] text-[#15803d]" },
    UNPLANNED: { label: "Unplanned", cls: "bg-sky-50 text-sky-700" },
    NCA:       { label: "NCA",       cls: "bg-amber-50 text-amber-700" },
  };
  const { label, cls } = map[type];
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
};

// ─── Activity row ─────────────────────────────────────────────────────────────

const ActivityRow = ({ act }: { act: Activity }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <FiUser className="w-3.5 h-3.5 text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-xs font-semibold text-[#222f36] truncate">
          {act.doctor?.doctor_name ?? "Unknown HCP"}
        </p>
        {act.doctor?.town && (
          <span className="text-[10px] text-gray-400">{act.doctor.town}</span>
        )}
        <VisitTypePill type={act.visit_type} />
        {act.gps_anomaly_flag && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
            <MdOutlineWarningAmber className="w-2.5 h-2.5" />
            GPS
          </span>
        )}
      </div>
      {act.focused_product && (
        <div className="flex items-center gap-1 mt-0.5">
          <FiPackage className="w-3 h-3 text-gray-300" />
          <p className="text-[10px] text-gray-400">{act.focused_product.product_name}</p>
        </div>
      )}
      {act.nca_reason && (
        <p className="text-[10px] text-amber-600 mt-0.5 italic">NCA: {act.nca_reason}</p>
      )}
    </div>
    {act.samples_given > 0 && (
      <span className="text-[10px] font-semibold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded-full shrink-0">
        {act.samples_given} sample{act.samples_given !== 1 ? "s" : ""}
      </span>
    )}
  </div>
);

// ─── Reject inline form ───────────────────────────────────────────────────────

const RejectForm = ({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 border border-red-200 rounded-xl p-3 bg-red-50/40">
      <p className="text-xs font-semibold text-red-700 mb-2">Provide a rejection reason</p>
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Visit counts don't match territory plan..."
        className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-none bg-white transition-colors"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={() => reason.trim() && onConfirm(reason.trim())}
          disabled={loading || !reason.trim()}
          className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
        >
          {loading ? "Rejecting..." : "Confirm Reject"}
        </button>
      </div>
    </div>
  );
};

// ─── Report row ───────────────────────────────────────────────────────────────

const ReportRow = ({
  report,
  onApproved,
  onRejected,
}: {
  report: Report;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}) => {
  const [expanded, setExpanded]       = useState(false);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [actsLoading, setActsLoading] = useState(false);
  const [actsLoaded, setActsLoaded]   = useState(false);
  const [approving, setApproving]     = useState(false);
  const [showReject, setShowReject]   = useState(false);
  const [rejecting, setRejecting]     = useState(false);

  const toggle = () => {
    setExpanded((v) => !v);
    if (!actsLoaded) {
      setActsLoading(true);
      getDailyReportActivitiesApi(report.id)
        .then((res) => setActivities(res.data.data ?? []))
        .catch(() => {})
        .finally(() => { setActsLoading(false); setActsLoaded(true); });
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveReportApi(report.id);
      onApproved(report.id);
    } catch { /* ignore */ } finally { setApproving(false); }
  };

  const handleReject = async (reason: string) => {
    setRejecting(true);
    try {
      await rejectReportApi(report.id, { reason });
      onRejected(report.id);
    } catch { /* ignore */ } finally { setRejecting(false); setShowReject(false); }
  };

  const av = initials(report.user.firstname, report.user.lastname);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors"
        onClick={toggle}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0 text-xs font-black text-[#15803d]">
          {av}
        </div>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#222f36] truncate">
            {report.user.firstname} {report.user.lastname}
            <span className="ml-1.5 text-[10px] font-medium text-gray-400">{report.user.role}</span>
          </p>
          <p className="text-[11px] text-gray-400">{fmtDate(report.report_date)}</p>
        </div>

        {/* Counts — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 shrink-0">
          <span>{report.visits_count} visits</span>
          <span className="text-gray-200">|</span>
          <span>{report.samples_count} samples</span>
        </div>

        {/* JFW badge */}
        {report.jfw_observer_id && (
          <span className="hidden sm:inline text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full shrink-0">
            JFW
          </span>
        )}

        {/* Status pill */}
        <StatusPill status={report.status} />

        {/* Chevron */}
        {expanded
          ? <FiChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <FiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Summary */}
          {report.summary && (
            <blockquote className="text-xs text-gray-600 italic border-l-2 border-[#16a34a] pl-3">
              {report.summary}
            </blockquote>
          )}

          {/* Review note (rejected) */}
          {report.review_note && report.status === "REJECTED" && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <FiAlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{report.review_note}</p>
            </div>
          )}

          {/* Activities */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Activities
            </p>
            {actsLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
              </div>
            ) : activities.length > 0 ? (
              <div className="border border-gray-100 rounded-xl px-3 divide-y divide-gray-50">
                {activities.map((a) => <ActivityRow key={a.id} act={a} />)}
              </div>
            ) : actsLoaded ? (
              <p className="text-xs text-gray-400 py-3 text-center">No activities recorded</p>
            ) : null}
          </div>

          {/* Approve / Reject — only on SUBMITTED */}
          {report.status === "SUBMITTED" && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16a34a] hover:bg-[#15803d] rounded-lg disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                <FiCheck className="w-3.5 h-3.5" />
                {approving ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => setShowReject((v) => !v)}
                disabled={rejecting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
              >
                <FiX className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}

          {showReject && (
            <RejectForm
              onCancel={() => setShowReject(false)}
              onConfirm={handleReject}
              loading={rejecting}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: StatusTab }[] = [
  { label: "Pending",  value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED"  },
  { label: "Rejected", value: "REJECTED"  },
  { label: "All",      value: "ALL"       },
];

const DAY_OPTIONS: Days[] = [7, 30, 60];

const ManagerReports = () => {
  const [reports, setReports]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeTab, setTab]     = useState<StatusTab>("SUBMITTED");
  const [days, setDays]         = useState<Days>(30);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = `days=${days}`;
    getCompanyReportsApi(params)
      .then((res) => setReports(res.data.data ?? []))
      .catch((e: any) => setError(e?.response?.data?.error ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const handleApproved = useCallback((id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "APPROVED" } : r));
  }, []);

  const handleRejected = useCallback((id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r));
  }, []);

  const visible = activeTab === "ALL"
    ? reports
    : reports.filter((r) => r.status === activeTab);

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">All company daily reports</p>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => {
            const count = tab.value === "ALL"
              ? reports.length
              : reports.filter((r) => r.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                  activeTab === tab.value
                    ? "bg-white text-[#16a34a] shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.value ? "bg-[#dcfce7] text-[#15803d]" : "bg-gray-200 text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                days === d
                  ? "bg-white text-[#16a34a] shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-300">
          <FiFileText className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-semibold text-gray-400">No reports found</p>
          <p className="text-xs text-gray-300 mt-1">
            {activeTab === "SUBMITTED"
              ? "No pending reports to review"
              : `No ${activeTab.toLowerCase()} reports in the last ${days} days`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onApproved={handleApproved}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerReports;
