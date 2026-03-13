import { useEffect, useState } from "react";
import { LuTrendingUp, LuClipboardList, LuMapPin, LuTriangleAlert } from "react-icons/lu";
import { BsGraphUp } from "react-icons/bs";
import { getTeamPerformanceApi } from "../../../services/api";

interface RepPerformance {
  user: { id: string; firstname: string; lastname: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_adherence_pct: number | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
}

const getInitials = (firstname: string, lastname: string) =>
  `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();

const cycleColor = (pct: number | null): string => {
  if (pct == null) return "text-gray-400";
  if (pct >= 80) return "text-[#16a34a]";
  if (pct >= 50) return "text-amber-500";
  return "text-red-500";
};

const cycleBg = (pct: number | null): string => {
  if (pct == null) return "bg-gray-100 text-gray-500";
  if (pct >= 80) return "bg-[#dcfce7] text-[#16a34a]";
  if (pct >= 50) return "bg-amber-50 text-amber-600";
  return "bg-red-50 text-red-600";
};

const Analytics = () => {
  const [reps, setReps] = useState<RepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTeamPerformanceApi()
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setReps(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const totalVisitsMonth = reps.reduce((s, r) => s + (r.visits_this_month ?? 0), 0);

  const adherenceValues = reps
    .map((r) => r.cycle_adherence_pct)
    .filter((v): v is number => v != null);
  const avgAdherence =
    adherenceValues.length > 0
      ? Math.round(adherenceValues.reduce((s, v) => s + v, 0) / adherenceValues.length)
      : null;

  const totalGpsAnomalies = reps.reduce((s, r) => s + (r.gps_anomaly_count_week ?? 0), 0);
  const totalPendingReports = reps.reduce((s, r) => s + (r.pending_reports ?? 0), 0);

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  const leaderboard = [...reps].sort(
    (a, b) => (b.visits_this_month ?? 0) - (a.visits_this_month ?? 0)
  );

  // ── Attention list ───────────────────────────────────────────────────────────
  const attentionReps = reps.filter(
    (r) =>
      (r.gps_anomaly_count_week ?? 0) > 0 ||
      (r.days_since_last_visit != null && r.days_since_last_visit > 3) ||
      (r.pending_reports ?? 0) > 0
  );

  const kpiCards = [
    {
      label: "Team Visits This Month",
      value: loading ? "—" : totalVisitsMonth,
      sub: "Across all reps",
      icon: LuTrendingUp,
    },
    {
      label: "Avg Cycle Adherence",
      value: loading ? "—" : avgAdherence != null ? `${avgAdherence}%` : "N/A",
      sub: "Non-null reps averaged",
      icon: BsGraphUp,
    },
    {
      label: "GPS Anomalies This Week",
      value: loading ? "—" : totalGpsAnomalies,
      sub: "Flagged location events",
      icon: LuMapPin,
    },
    {
      label: "Pending Reports",
      value: loading ? "—" : totalPendingReports,
      sub: "Awaiting review",
      icon: LuClipboardList,
    },
  ];

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Company-wide KPI analytics</p>
        </div>
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-gray-400">Loading analytics…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Company-wide KPI analytics</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-red-400 text-sm">Failed to load analytics. Please try again.</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (reps.length === 0) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Company-wide KPI analytics</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-gray-400 text-sm">No rep data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Company-wide KPI analytics</p>
      </div>

      {/* ── Section 1: KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-l-4 border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] px-5 py-5 flex items-start justify-between gap-3"
            style={{ borderLeftColor: "#16a34a" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-black text-[#1a1a1a] leading-none">{value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-2 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#16a34a]" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2: Rep Leaderboard ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Rep Leaderboard</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ranked by visits this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 w-12">#</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Rep</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Month</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Week</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Cycle %</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">GPS Flags</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map((rep, idx) => {
                const isInactive =
                  rep.days_since_last_visit != null && rep.days_since_last_visit > 3;
                return (
                  <tr
                    key={rep.user.id}
                    className="hover:bg-gray-50/60"
                    style={{ transition: "background-color 0.15s" }}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                          <span className="text-[#16a34a] font-black text-xs">
                            {getInitials(rep.user.firstname, rep.user.lastname)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1a1a]">
                            {rep.user.firstname} {rep.user.lastname}
                          </p>
                          {isInactive && (
                            <span className="inline-block text-[10px] font-bold bg-red-50 text-red-500 rounded-full px-2 py-0.5 mt-0.5 leading-none">
                              Inactive {rep.days_since_last_visit}d
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-[#1a1a1a]">
                      {rep.visits_this_month ?? 0}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {rep.visits_this_week ?? 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${cycleBg(rep.cycle_adherence_pct)}`}>
                        {rep.cycle_adherence_pct != null ? `${rep.cycle_adherence_pct}%` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          (rep.gps_anomaly_count_week ?? 0) > 0 ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {rep.gps_anomaly_count_week ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          (rep.pending_reports ?? 0) > 0 ? "text-amber-500" : "text-gray-400"
                        }`}
                      >
                        {rep.pending_reports ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Attention Required ──────────────────────────────────── */}
      {attentionReps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <LuTriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Attention Required</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {attentionReps.length} rep{attentionReps.length !== 1 ? "s" : ""} flagged
              </p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionReps.map((rep) => {
              const alerts: { label: string; level: "red" | "amber" }[] = [];
              if ((rep.gps_anomaly_count_week ?? 0) > 0)
                alerts.push({ label: `${rep.gps_anomaly_count_week} GPS anomal${rep.gps_anomaly_count_week === 1 ? "y" : "ies"} this week`, level: "red" });
              if (rep.days_since_last_visit != null && rep.days_since_last_visit > 3)
                alerts.push({ label: `No visit in ${rep.days_since_last_visit} days`, level: "red" });
              if ((rep.pending_reports ?? 0) > 0)
                alerts.push({ label: `${rep.pending_reports} pending report${rep.pending_reports === 1 ? "" : "s"}`, level: "amber" });

              return (
                <div
                  key={rep.user.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#16a34a] font-black text-xs">
                      {getInitials(rep.user.firstname, rep.user.lastname)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm truncate">
                      {rep.user.firstname} {rep.user.lastname}
                    </p>
                    <div className="flex flex-col gap-1 mt-1.5">
                      {alerts.map((alert, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            alert.level === "red" ? "text-red-500" : "text-amber-600"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                              alert.level === "red" ? "bg-red-500" : "bg-amber-400"
                            }`}
                          />
                          {alert.label}
                        </span>
                      ))}
                    </div>
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

export default Analytics;
