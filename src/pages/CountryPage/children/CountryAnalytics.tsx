import { useEffect, useState } from "react";
import { Line } from "@ant-design/plots";
import { format, subDays, parseISO } from "date-fns";
import { LuTrendingUp, LuUsers, LuMapPin } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import {
  getCompanyFeedApi,
  getCompanyUsersApi,
  getCompanyReportsApi,
} from "../../../services/api";

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
  samples: number;
}

interface Activity {
  id: string;
  date: string;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  user: { id: string; firstname: string; lastname: string };
  focused_product: { product_name: string } | null;
}

interface CompanyUser {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
  team?: { id: string; team_name: string } | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

const rankBg = (i: number) => {
  if (i === 0) return "bg-amber-400 text-white";
  if (i === 1) return "bg-gray-300 text-gray-700";
  if (i === 2) return "bg-amber-600 text-white";
  return "bg-gray-100 text-gray-500";
};

// ─── Component ────────────────────────────────────────────────────────────────

const CountryAnalytics = () => {
  const [summary, setSummary] = useState<RepSummary[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [allUsers, setAllUsers] = useState<CompanyUser[]>([]);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyFeedApi({ days: 30 }),
      getCompanyUsersApi(),
      getCompanyReportsApi("days=7"),
    ]).then(([feedRes, usersRes, reportsRes]) => {
      if (feedRes.status === "fulfilled") {
        setSummary(feedRes.value.data.summary ?? []);
        setFeed(feedRes.value.data?.data ?? []);
      }
      if (usersRes.status === "fulfilled") {
        setAllUsers(usersRes.value.data?.data ?? []);
      }
      if (reportsRes.status === "fulfilled") {
        setReportCount((reportsRes.value.data?.data ?? []).length);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived analytics ────────────────────────────────────────────────────

  const totalReps = allUsers.filter((u) => u.role === "MedicalRep").length;
  const activeReps = summary.filter((r) => r.visits > 0).length;
  const totalVisits = summary.reduce((s, r) => s + r.visits, 0);
  const gpsAnomalies = feed.filter((a) => a.gps_anomaly === true).length;
  const ncaCount = feed.filter((a) => a.nca_reason && a.nca_reason.trim() !== "").length;
  const anomalyRate = feed.length > 0 ? Math.round((gpsAnomalies / feed.length) * 100) : 0;
  const ncaRate = feed.length > 0 ? Math.round((ncaCount / feed.length) * 100) : 0;
  const coveragePct = totalReps > 0 ? Math.round((activeReps / totalReps) * 100) : 0;

  // Daily visit trend: count visits per day over last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, "yyyy-MM-dd");
  });

  const dailyMap: Record<string, number> = {};
  last30.forEach((d) => { dailyMap[d] = 0; });
  feed.forEach((a) => {
    try {
      const day = format(parseISO(a.date), "yyyy-MM-dd");
      if (dailyMap[day] !== undefined) dailyMap[day] += 1;
    } catch { /* skip malformed dates */ }
  });

  const trendData = last30.map((day) => ({
    date: format(parseISO(day), "dd MMM"),
    visits: dailyMap[day],
  }));

  // Rep leaderboard — top performers
  const leaderboard = [...summary]
    .filter((r) => r.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Bottom performers — reps with visits but lowest count
  const underperforming = [...summary]
    .filter((r) => r.visits > 0)
    .sort((a, b) => a.visits - b.visits)
    .slice(0, 5);

  // Field health stat cards
  const healthStats = [
    {
      label: "Coverage Rate",
      value: loading ? "—" : `${coveragePct}%`,
      sub: `${activeReps} of ${totalReps} reps active`,
      icon: LuUsers,
      color: coveragePct >= 70 ? "#16a34a" : coveragePct >= 50 ? "#d97706" : "#dc2626",
      bg: coveragePct >= 70 ? "bg-[#f0fdf4]" : coveragePct >= 50 ? "bg-amber-50" : "bg-red-50",
    },
    {
      label: "GPS Anomaly Rate",
      value: loading ? "—" : `${anomalyRate}%`,
      sub: `${gpsAnomalies} of ${feed.length} visits flagged`,
      icon: MdOutlineGpsOff,
      color: anomalyRate > 10 ? "#dc2626" : anomalyRate > 5 ? "#d97706" : "#16a34a",
      bg: anomalyRate > 10 ? "bg-red-50" : anomalyRate > 5 ? "bg-amber-50" : "bg-[#f0fdf4]",
    },
    {
      label: "NCA Rate",
      value: loading ? "—" : `${ncaRate}%`,
      sub: `${ncaCount} no-contact visits logged`,
      icon: LuMapPin,
      color: ncaRate > 20 ? "#dc2626" : ncaRate > 10 ? "#d97706" : "#16a34a",
      bg: ncaRate > 20 ? "bg-red-50" : ncaRate > 10 ? "bg-amber-50" : "bg-[#f0fdf4]",
    },
    {
      label: "Avg Visits / Rep",
      value: loading ? "—" : activeReps > 0 ? Math.round(totalVisits / activeReps) : "0",
      sub: "Per active rep, this month",
      icon: LuTrendingUp,
      color: "#16a34a",
      bg: "bg-[#f0fdf4]",
    },
  ];

  const chartConfig = {
    data: trendData,
    xField: "date",
    yField: "visits",
    smooth: true,
    color: "#16a34a",
    lineStyle: { lineWidth: 2 },
    point: { size: 3, shape: "circle", style: { fill: "#16a34a", stroke: "#fff", lineWidth: 1.5 } },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
        formatter: (v: string) => v.split(" ")[0],
        style: { fontSize: 10, fill: "#9ca3af" },
      },
      tickLine: null,
      line: null,
    },
    yAxis: {
      label: { style: { fontSize: 10, fill: "#9ca3af" } },
      grid: { line: { style: { stroke: "#f3f4f6", lineWidth: 1 } } },
    },
    tooltip: {
      formatter: (datum: any) => ({ name: "Visits", value: datum.visits }),
    },
    animation: { appear: { animation: "path-in", duration: 1000 } },
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">National performance — last 30 days</p>
      </div>

      {/* ── Field Health Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 sm:p-5 border border-gray-100`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="font-poppins-extrabold text-2xl text-[#1a1a1a]">{s.value}</p>
              <p className="text-xs font-poppins-semibold text-[#1a1a1a] mt-1">{s.label}</p>
              <p className="text-[11px] font-poppins text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Visit Trend ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Daily Visit Trend</h2>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">All GPS-verified doctor visits across the country, last 30 days</p>
        </div>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#16a34a] animate-spin" />
          </div>
        ) : (
          <div style={{ height: 200 }}>
            <Line {...chartConfig} />
          </div>
        )}
      </div>

      {/* ── Rep Leaderboard + Underperformers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Top performers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Top Performers</h2>
            <p className="text-xs font-poppins text-gray-400 mt-0.5">Reps with most visits this month</p>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-gray-400 text-sm font-poppins text-center py-8">No visit data yet this month</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {leaderboard.map((rep, i) => (
                <div key={rep.user.id} className="flex items-center gap-3 py-2.5">
                  <span className={`w-6 h-6 rounded-full text-[11px] font-poppins-bold flex items-center justify-center shrink-0 ${rankBg(i)}`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-poppins-extrabold text-[10px]">
                      {getInitials(rep.user.firstname, rep.user.lastname)}
                    </span>
                  </div>
                  <p className="flex-1 min-w-0 text-sm font-poppins-semibold text-[#1a1a1a] truncate">
                    {rep.user.firstname} {rep.user.lastname}
                  </p>
                  <span className="text-sm font-poppins-bold text-[#16a34a] shrink-0">{rep.visits}</span>
                  <span className="text-xs font-poppins text-gray-400 shrink-0">visits</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Needs Attention</h2>
            <p className="text-xs font-poppins text-gray-400 mt-0.5">Active reps with lowest visit counts</p>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : underperforming.length === 0 ? (
            <p className="text-gray-400 text-sm font-poppins text-center py-8">All reps are performing well</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {underperforming.map((rep) => {
                const avg = activeReps > 0 ? totalVisits / activeReps : 0;
                const pct = avg > 0 ? Math.round((rep.visits / avg) * 100) : 0;
                return (
                  <div key={rep.user.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-600 font-poppins-extrabold text-[10px]">
                        {getInitials(rep.user.firstname, rep.user.lastname)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate">
                        {rep.user.firstname} {rep.user.lastname}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-400"
                            style={{ width: `${Math.min(pct, 100)}%`, transition: "width 0.6s ease" }}
                          />
                        </div>
                        <span className="text-[11px] font-poppins text-red-500 shrink-0">{pct}% of avg</span>
                      </div>
                    </div>
                    <span className="text-sm font-poppins-bold text-red-500 shrink-0">{rep.visits}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CountryAnalytics;
