import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getPendingReportsApi, approveReportApi, rejectReportApi } from "../../../services/api";
import { LuClipboardCheck, LuClock, LuCircleCheck, LuCircleX } from "react-icons/lu";

interface Report {
  id: string;
  report_date: string;
  summary?: string;
  visits_count: number;
  samples_count: number;
  status: string;
  user?: { id: string; firstname: string; lastname: string; role: string };
  rejection_note?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  SUBMITTED: { label: "Pending",  icon: LuClock,         bg: "bg-amber-50",   text: "text-amber-700" },
  APPROVED:  { label: "Approved", icon: LuCircleCheck,   bg: "bg-[#dcfce7]",  text: "text-[#16a34a]" },
  REJECTED:  { label: "Rejected", icon: LuCircleX,       bg: "bg-red-50",     text: "text-red-600"   },
  DRAFT:     { label: "Draft",    icon: LuClipboardCheck, bg: "bg-gray-100",  text: "text-gray-500"  },
};

const RecentReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getPendingReportsApi()
      .then((res) => setReports(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try { await approveReportApi(id); load(); } catch { } finally { setActioning(null); }
  };

  const handleReject = async (id: string) => {
    setActioning(id);
    try { await rejectReportApi(id); load(); } catch { } finally { setActioning(null); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Pending Reports</h2>
          <p className="text-xs text-gray-400 mt-0.5">Rep daily reports awaiting your approval</p>
        </div>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          {reports.length} pending
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            <span className="text-sm">Loading reports…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LuCircleCheck className="w-10 h-10 text-[#16a34a] mb-3" />
            <p className="text-gray-600 font-semibold">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No pending reports to approve.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Visits</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((r) => {
                const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.DRAFT;
                const SIcon = s.icon;
                const repName = r.user
                  ? `${r.user.firstname} ${r.user.lastname}`
                  : "Unknown Rep";
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                          <span className="text-[#16a34a] font-black text-xs">
                            {r.user
                              ? `${r.user.firstname[0]}${r.user.lastname[0]}`.toUpperCase()
                              : "?"}
                          </span>
                        </div>
                        <span className="font-semibold text-[#1a1a1a]">{repName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {format(new Date(r.report_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-700">{r.visits_count}</span>
                      {r.samples_count > 0 && (
                        <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          {r.samples_count} samples
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                        <SIcon className="w-3 h-3" />
                        {s.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "SUBMITTED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actioning === r.id}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
                          >
                            {actioning === r.id ? "…" : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={actioning === r.id}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentReports;
