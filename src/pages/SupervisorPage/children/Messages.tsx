import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  FiAlertTriangle, FiFileText, FiDollarSign, FiMapPin,
  FiCalendar, FiRefreshCw, FiCheckCircle, FiList,
} from "react-icons/fi";
import {
  getPendingReportsApi,
  getPendingExpenseClaimsApi,
  getPendingCyclesApi,
  getPendingTourPlansApi,
  getTeamPerformanceApi,
} from "../../../services/api";

interface Alert {
  id: string;
  type: "report" | "expense" | "cycle" | "tour_plan" | "gps" | "no_visits";
  title: string;
  subtitle: string;
  time?: string;
  repName?: string;
  urgent: boolean;
  action?: { label: string; path: string };
}

const TYPE_CONFIG = {
  report:    { icon: FiFileText,       bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200",  label: "Daily Report"   },
  expense:   { icon: FiDollarSign,     bg: "bg-purple-50",  text: "text-purple-600", border: "border-purple-200", label: "Expense Claim"  },
  cycle:     { icon: FiList,           bg: "bg-sky-50",     text: "text-sky-600",    border: "border-sky-200",    label: "Call Cycle"     },
  tour_plan: { icon: FiCalendar,       bg: "bg-teal-50",    text: "text-teal-600",   border: "border-teal-200",   label: "Tour Plan"      },
  gps:       { icon: FiMapPin,         bg: "bg-red-50",     text: "text-red-600",    border: "border-red-200",    label: "GPS Anomaly"    },
  no_visits: { icon: FiAlertTriangle,  bg: "bg-orange-50",  text: "text-orange-600", border: "border-orange-200", label: "No Visits"      },
};

const FILTER_TABS = [
  { key: "all",       label: "All" },
  { key: "report",    label: "Reports" },
  { key: "expense",   label: "Expenses" },
  { key: "cycle",     label: "Cycles" },
  { key: "gps",       label: "GPS / NCA" },
] as const;
type FilterKey = (typeof FILTER_TABS)[number]["key"];

const Messages = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [error, setError]     = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      getPendingReportsApi(),
      getPendingExpenseClaimsApi(),
      getPendingCyclesApi(),
      getPendingTourPlansApi(),
      getTeamPerformanceApi(),
    ])
      .then(([rr, er, cr, tpr, perf]) => {
        const built: Alert[] = [];

        // Pending daily reports
        (rr.data?.data ?? []).forEach((r: any) => {
          built.push({
            id: `report-${r.id}`,
            type: "report",
            title: `${r.user?.firstname ?? ""} ${r.user?.lastname ?? ""} submitted a daily report`,
            subtitle: r.report_date ? `For ${new Date(r.report_date).toDateString()}` : "Awaiting your review",
            time: r.submitted_at,
            urgent: true,
            action: { label: "Review", path: "/supervisor/approvals" },
          });
        });

        // Pending expense claims
        (er.data?.data ?? []).forEach((e: any) => {
          built.push({
            id: `expense-${e.id}`,
            type: "expense",
            title: `${e.user?.firstname ?? ""} ${e.user?.lastname ?? ""} submitted an expense claim`,
            subtitle: `Period: ${e.period ?? ""}  ·  UGX ${(e.total_amount ?? 0).toLocaleString()}`,
            time: e.submitted_at,
            urgent: false,
            action: { label: "Review", path: "/supervisor/approvals" },
          });
        });

        // Pending call cycles
        (cr.data?.data ?? []).forEach((c: any) => {
          built.push({
            id: `cycle-${c.id}`,
            type: "cycle",
            title: `${c.user?.firstname ?? ""} ${c.user?.lastname ?? ""} submitted their call cycle`,
            subtitle: `${c.month ? new Date(0, c.month - 1).toLocaleString("default", { month: "long" }) : ""} ${c.year ?? ""}  ·  ${c._count?.items ?? c.items?.length ?? 0} doctors`,
            time: c.submitted_at ?? c.created_at,
            urgent: false,
            action: { label: "Review", path: "/supervisor/approvals" },
          });
        });

        // Pending tour plans
        (tpr.data?.data ?? []).forEach((t: any) => {
          built.push({
            id: `tour-${t.id}`,
            type: "tour_plan",
            title: `${t.user?.firstname ?? ""} ${t.user?.lastname ?? ""} submitted a tour plan`,
            subtitle: `${t.month ? new Date(0, t.month - 1).toLocaleString("default", { month: "long" }) : ""} ${t.year ?? ""}`,
            time: t.submitted_at ?? t.created_at,
            urgent: false,
            action: { label: "Review", path: "/supervisor/approvals" },
          });
        });

        // GPS anomalies and no-visit warnings from team performance
        (perf.data?.data ?? []).forEach((rep: any) => {
          if ((rep.gps_anomalies ?? 0) > 0) {
            built.push({
              id: `gps-${rep.user?.id}`,
              type: "gps",
              title: `${rep.user?.firstname ?? ""} ${rep.user?.lastname ?? ""} has GPS anomalies`,
              subtitle: `${rep.gps_anomalies} flagged visit${rep.gps_anomalies !== 1 ? "s" : ""} this month`,
              urgent: true,
            });
          }
          if ((rep.visits_this_week ?? 0) === 0 && (rep.visits_today ?? rep.visits_this_month ?? 0) === 0) {
            built.push({
              id: `novisit-${rep.user?.id}`,
              type: "no_visits",
              title: `${rep.user?.firstname ?? ""} ${rep.user?.lastname ?? ""} has no visits this week`,
              subtitle: "No doctor activity recorded in the last 7 days",
              urgent: true,
            });
          }
        });

        // Sort: urgent first, then by time desc
        built.sort((a, b) => {
          if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
          return (b.time ?? "") > (a.time ?? "") ? 1 : -1;
        });

        setAlerts(built);
      })
      .catch(() => setError("Failed to load activity"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visible = filter === "all"
    ? alerts
    : filter === "gps"
      ? alerts.filter((a) => a.type === "gps" || a.type === "no_visits")
      : alerts.filter((a) => a.type === filter);

  const urgentCount = alerts.filter((a) => a.urgent).length;

  return (
    <div className="p-6 flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#1a2530] tracking-tight">Activity Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {urgentCount > 0
              ? `${urgentCount} item${urgentCount !== 1 ? "s" : ""} need your attention`
              : "All caught up"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all"
            ? alerts.length
            : tab.key === "gps"
              ? alerts.filter((a) => a.type === "gps" || a.type === "no_visits").length
              : alerts.filter((a) => a.type === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] ${
                filter === tab.key
                  ? "bg-white text-[#1a2530] shadow-[0_1px_4px_0_rgba(0,0,0,0.08)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ transition: "background-color 0.15s" }}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-[#16a34a]/10 text-[#16a34a]" : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <FiCheckCircle className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-semibold">Nothing here</p>
          <p className="text-sm mt-1">No pending items in this category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((alert) => {
            const cfg = TYPE_CONFIG[alert.type];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 bg-white border rounded-xl px-4 py-3.5 ${
                  alert.urgent ? "border-l-4 border-l-red-400 border-r border-t border-b border-gray-100" : "border-gray-100"
                } shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1a2530]">{alert.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.subtitle}</p>
                  {alert.time && (
                    <p className="text-[11px] text-gray-300 mt-1">
                      {formatDistanceToNow(new Date(alert.time), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {alert.action && (
                  <button
                    onClick={() => navigate(alert.action!.path)}
                    className="shrink-0 text-xs font-bold text-[#16a34a] hover:text-[#15803d] px-2 py-1 rounded-lg hover:bg-[#f0fdf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] mt-0.5"
                    style={{ transition: "background-color 0.15s, color 0.15s" }}
                  >
                    {alert.action.label} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;
