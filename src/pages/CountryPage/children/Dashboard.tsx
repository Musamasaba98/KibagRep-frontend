import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Column } from "@ant-design/plots";
import { FaUserGroup } from "react-icons/fa6";
import { IoCalendarOutline, IoMegaphoneOutline } from "react-icons/io5";
import { LuReceiptText, LuFlaskConical, LuCalendarCheck, LuDownload, LuUsers, LuChevronRight, LuShieldAlert, LuMapPin } from "react-icons/lu";
import { MdOutlineWarningAmber, MdOutlineGpsOff } from "react-icons/md";
import { format } from "date-fns";
import {
  getCompanyFeedApi,
  getPendingReportsApi,
  getCompanyUsersApi,
  getCompanyTeamsApi,
  getCompanySampleSummaryApi,
  getPendingCyclesApi,
  getCampaignsApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  doctor: { doctor_name: string; town: string };
  focused_product: { product_name: string } | null;
}

interface CompanyUser {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
  email: string;
  team?: { id: string; team_name: string } | null;
}

interface Team {
  id: string;
  team_name: string;
  supervisor?: { id: string; firstname: string; lastname: string } | null;
  users?: { id: string; role: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

// Circular progress SVG (Design 2 style)
const Ring = ({ pct, color = "#16a34a" }: { pct: number; color?: string }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
      <circle
        cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {pct}%
      </text>
    </svg>
  );
};

const scoreColor = (pct: number) =>
  pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

const scoreLabel = (pct: number) =>
  pct >= 75 ? "On Track" : pct >= 50 ? "Needs Attention" : "At Risk";

const scoreLabelColor = (pct: number) =>
  pct >= 75 ? "text-[#16a34a] bg-[#f0fdf4]" : pct >= 50 ? "text-amber-700 bg-amber-50" : "text-red-600 bg-red-50";

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary]           = useState<RepSummary[]>([]);
  const [feed, setFeed]                 = useState<Activity[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [feedLoading, setFeedLoading]   = useState(true);

  const [allUsers, setAllUsers]         = useState<CompanyUser[]>([]);
  const [teams, setTeams]               = useState<Team[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [sampleTotals, setSampleTotals] = useState<{ issued: number; given: number } | null>(null);
  const [cycleStats, setCycleStats]     = useState<{ total: number; approved: number; submitted: number } | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<{ id: string; name: string; start_date?: string; end_date?: string; product?: { product_name: string } | null }[]>([]);

  useEffect(() => {
    setFeedLoading(true);
    Promise.allSettled([getCompanyFeedApi({ days: 30 }), getPendingReportsApi()])
      .then(([feedRes, reportsRes]) => {
        if (feedRes.status === "fulfilled") {
          setSummary(feedRes.value.data.summary ?? []);
          setFeed(feedRes.value.data?.data ?? []);
        }
        if (reportsRes.status === "fulfilled") {
          setPendingCount((reportsRes.value.data.data ?? []).length);
        }
      })
      .finally(() => setFeedLoading(false));
  }, []);

  useEffect(() => {
    setUsersLoading(true);
    Promise.allSettled([getCompanyUsersApi(), getCompanyTeamsApi()])
      .then(([usersRes, teamsRes]) => {
        setAllUsers(usersRes.status === "fulfilled" ? (usersRes.value.data?.data ?? []) : []);
        setTeams(teamsRes.status === "fulfilled" ? (teamsRes.value.data?.data ?? []) : []);
      })
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    Promise.allSettled([getCompanySampleSummaryApi(), getPendingCyclesApi(), getCampaignsApi("ACTIVE")])
      .then(([sampleRes, cycleRes, campaignRes]) => {
        if (sampleRes.status === "fulfilled") {
          const rows: { total_issued: number; total_given: number }[] = sampleRes.value.data?.data ?? [];
          setSampleTotals({
            issued: rows.reduce((s, r) => s + r.total_issued, 0),
            given:  rows.reduce((s, r) => s + r.total_given,  0),
          });
        }
        if (cycleRes.status === "fulfilled") {
          const cycles: { status: string }[] = cycleRes.value.data?.data ?? [];
          setCycleStats({
            total:     cycles.length,
            approved:  cycles.filter((c) => c.status === "APPROVED" || c.status === "LOCKED").length,
            submitted: cycles.filter((c) => c.status === "SUBMITTED").length,
          });
        }
        if (campaignRes.status === "fulfilled") {
          setActiveCampaigns(campaignRes.value.data?.data ?? []);
        }
      });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalVisits    = summary.reduce((s, r) => s + r.visits, 0);
  const gpsAnomalies   = feed.filter((a) => a.gps_anomaly === true);
  const repVisitMap: Record<string, number> = {};
  summary.forEach((r) => { repVisitMap[r.user.id] = r.visits; });

  const inactiveReps = allUsers.filter(
    (u) => u.role === "MedicalRep" && (repVisitMap[u.id] ?? 0) === 0
  );

  const totalReps    = allUsers.filter((u) => u.role === "MedicalRep").length;
  const activeReps   = summary.length;
  const activeRepPct = totalReps > 0 ? Math.round((activeReps / totalReps) * 100) : 0;

  const samplePct = sampleTotals && sampleTotals.issued > 0
    ? Math.round((sampleTotals.given / sampleTotals.issued) * 100)
    : 0;

  const cyclePct = cycleStats && cycleStats.total > 0
    ? Math.round((cycleStats.approved / cycleStats.total) * 100)
    : 0;

  // Supervisor stats with circular %
  const supervisorStats = teams
    .filter((t) => t.supervisor)
    .map((team) => {
      const teamReps   = (team.users ?? []).filter((u) => u.role === "MedicalRep");
      const teamVisits = teamReps.reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
      const maxPossible = teamReps.length * 20; // 20 visits/rep/month as rough benchmark
      const pct = maxPossible > 0 ? Math.min(100, Math.round((teamVisits / maxPossible) * 100)) : 0;
      return { team, sup: team.supervisor!, repCount: teamReps.length, teamVisits, pct };
    })
    .sort((a, b) => b.teamVisits - a.teamVisits);

  // Teams for coverage section
  const teamsWithStats = teams.map((team) => {
    const reps    = (team.users ?? []).filter((u) => u.role === "MedicalRep");
    const visits  = reps.reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
    const maxV    = Math.max(...teams.map((t) => (t.users ?? []).filter(u => u.role === "MedicalRep").reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0)), 1);
    const pct     = Math.round((visits / maxV) * 100);
    return { ...team, repCount: reps.length, visits, pct };
  }).sort((a, b) => b.visits - a.visits);

  // Product bar chart data
  const productMap: Record<string, number> = {};
  feed.forEach((a) => {
    const name = a.focused_product?.product_name;
    if (name) productMap[name] = (productMap[name] ?? 0) + 1;
  });
  const chartData = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, visits]) => ({ name, visits }));

  // Critical alerts array (dynamic)
  const alerts: { color: string; bg: string; icon: React.ReactNode; title: string; body: string; ago: string }[] = [];

  if (gpsAnomalies.length > 0)
    alerts.push({
      color: "text-red-600", bg: "bg-red-50 border-red-100",
      icon: <MdOutlineGpsOff className="w-4 h-4 text-red-500" />,
      title: `${gpsAnomalies.length} GPS anomal${gpsAnomalies.length === 1 ? "y" : "ies"} detected`,
      body: "Visits flagged for location mismatch",
      ago: "This month",
    });

  if (inactiveReps.length > 0)
    alerts.push({
      color: "text-orange-600", bg: "bg-orange-50 border-orange-100",
      icon: <MdOutlineWarningAmber className="w-4 h-4 text-orange-500" />,
      title: `${inactiveReps.length} rep${inactiveReps.length !== 1 ? "s" : ""} with zero visits`,
      body: inactiveReps.slice(0, 2).map(r => `${r.firstname} ${r.lastname}`).join(", ") + (inactiveReps.length > 2 ? ` +${inactiveReps.length - 2} more` : ""),
      ago: "This month",
    });

  if (pendingCount > 0)
    alerts.push({
      color: "text-amber-600", bg: "bg-amber-50 border-amber-100",
      icon: <LuReceiptText className="w-4 h-4 text-amber-500" />,
      title: `${pendingCount} report${pendingCount !== 1 ? "s" : ""} pending approval`,
      body: "Submitted daily reports awaiting review",
      ago: "Action required",
    });

  if (cycleStats && cycleStats.submitted > 0)
    alerts.push({
      color: "text-violet-600", bg: "bg-violet-50 border-violet-100",
      icon: <LuCalendarCheck className="w-4 h-4 text-violet-500" />,
      title: `${cycleStats.submitted} call cycle${cycleStats.submitted !== 1 ? "s" : ""} awaiting approval`,
      body: "Supervisor-submitted cycles not yet locked",
      ago: "Action required",
    });

  if (alerts.length === 0 && !feedLoading)
    alerts.push({
      color: "text-[#16a34a]", bg: "bg-[#f0fdf4] border-[#dcfce7]",
      icon: <LuShieldAlert className="w-4 h-4 text-[#16a34a]" />,
      title: "All clear — no critical issues",
      body: "No anomalies, inactive reps, or pending actions",
      ago: "Now",
    });

  // KPI cards
  const kpiCards = [
    {
      label: "Active Field Reps",
      value: feedLoading || usersLoading ? "—" : activeReps,
      sub: `of ${totalReps} enrolled`,
      pct: activeRepPct,
      pctLabel: `${activeRepPct}% active`,
      pctUp: activeRepPct >= 70,
      icon: <FaUserGroup className="w-5 h-5 text-[#16a34a]" />,
      iconBg: "bg-[#f0fdf4]",
    },
    {
      label: "Total HCP Visits",
      value: feedLoading ? "—" : totalVisits.toLocaleString(),
      sub: "GPS-verified, last 30 days",
      pct: null,
      pctLabel: null,
      pctUp: true,
      icon: <IoCalendarOutline className="w-5 h-5 text-sky-600" />,
      iconBg: "bg-sky-50",
    },
    {
      label: "Call Cycle Compliance",
      value: feedLoading ? "—" : `${cyclePct}%`,
      sub: cycleStats ? `${cycleStats.approved} of ${cycleStats.total} cycles approved` : "Cycles this month",
      pct: cyclePct,
      pctLabel: cyclePct >= 75 ? "On Track" : "Needs Review",
      pctUp: cyclePct >= 75,
      icon: <LuCalendarCheck className="w-5 h-5 text-violet-600" />,
      iconBg: "bg-violet-50",
    },
    {
      label: "Sample Utilisation",
      value: sampleTotals === null ? "—" : `${samplePct}%`,
      sub: sampleTotals ? `${sampleTotals.given.toLocaleString()} of ${sampleTotals.issued.toLocaleString()} given` : "Issued vs given",
      pct: samplePct,
      pctLabel: samplePct >= 60 ? "Good utilisation" : "Low utilisation",
      pctUp: samplePct >= 60,
      icon: <LuFlaskConical className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a2530] text-xl sm:text-2xl tracking-tight">
            Country Manager Dashboard
          </h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">
            Real-time performance overview · last 30 days
          </p>
        </div>
        <button
          onClick={() => navigate("/country/reports")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-bold rounded-xl focus-visible:outline-none shrink-0"
          style={{ transition: "background-color 0.15s" }}
        >
          <LuDownload className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.pctLabel && (
                <span
                  className={`text-[10px] sm:text-xs font-poppins-bold px-2 py-0.5 rounded-full ${
                    card.pctUp
                      ? "bg-[#f0fdf4] text-[#16a34a]"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {card.pctUp ? "↑" : "↓"} {card.pctLabel}
                </span>
              )}
            </div>
            <p className="font-poppins-extrabold text-[#1a2530] text-2xl sm:text-3xl leading-none">
              {card.value}
            </p>
            <p className="text-xs font-poppins-bold text-gray-500 mt-1.5 leading-tight">{card.label}</p>
            <p className="text-[11px] font-poppins text-gray-400 mt-0.5 hidden sm:block">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main 3-col grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Critical Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-poppins-bold text-[#1a2530] text-[15px]">Critical Alerts</h2>
              {alerts.some(a => a.color.includes("red") || a.color.includes("orange")) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <button
              onClick={() => navigate("/country/reports")}
              className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View all
            </button>
          </div>
          {feedLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${a.bg}`}>
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                    {a.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-poppins-bold ${a.color} leading-tight`}>{a.title}</p>
                    <p className="text-[11px] font-poppins text-gray-500 mt-0.5 leading-snug truncate">{a.body}</p>
                    <p className="text-[10px] font-poppins text-gray-400 mt-0.5">{a.ago}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teams Coverage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins-bold text-[#1a2530] text-[15px]">Field Team Coverage</h2>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">Visit volume by team · 30 days</p>
            </div>
            <button
              onClick={() => navigate("/country/analytics")}
              className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              Analytics →
            </button>
          </div>
          {usersLoading || feedLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-50 animate-pulse" />)}
            </div>
          ) : teamsWithStats.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <LuMapPin className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-poppins-semibold text-gray-400">No teams yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {teamsWithStats.slice(0, 6).map((t) => {
                const color = t.pct >= 75 ? "#16a34a" : t.pct >= 50 ? "#d97706" : "#dc2626";
                const bg    = t.pct >= 75 ? "bg-[#f0fdf4] border-[#dcfce7]" : t.pct >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
                return (
                  <div key={t.id} className={`rounded-xl border p-3 ${bg}`}>
                    <p className="font-poppins-extrabold text-xl leading-none" style={{ color }}>{t.visits}</p>
                    <p className="text-xs font-poppins-bold text-[#1a2530] mt-1 leading-tight truncate">{t.team_name}</p>
                    <p className="text-[10px] font-poppins text-gray-400 mt-0.5">{t.repCount} rep{t.repCount !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          )}
          {/* Coverage depth legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
            <span className="text-[10px] font-poppins text-gray-400">Low Activity</span>
            <div className="flex-1 mx-3 h-1.5 rounded-full bg-gradient-to-r from-red-300 via-amber-300 to-[#16a34a]" />
            <span className="text-[10px] font-poppins text-gray-400">High Activity</span>
          </div>
        </div>

        {/* Supervisor Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins-bold text-[#1a2530] text-[15px]">Supervisor Performance</h2>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">Team visit index vs benchmark</p>
            </div>
            <button
              onClick={() => navigate("/country/analytics")}
              className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View all →
            </button>
          </div>
          {usersLoading || feedLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 animate-pulse rounded mb-2 w-2/3" />
                    <div className="h-2 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : supervisorStats.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <LuUsers className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-poppins-semibold text-gray-400">No supervisors assigned yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {supervisorStats.slice(0, 4).map(({ sup, team, repCount, teamVisits, pct }) => (
                <div key={team.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-poppins-extrabold text-xs">{initials(sup.firstname, sup.lastname)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-poppins-bold text-[#1a2530] truncate">{sup.firstname} {sup.lastname}</p>
                    <p className="text-[11px] font-poppins text-gray-400 truncate">{team.team_name} · {repCount} rep{repCount !== 1 ? "s" : ""}</p>
                    <span className={`inline-block text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full mt-0.5 ${scoreLabelColor(pct)}`}>
                      {scoreLabel(pct)}
                    </span>
                  </div>
                  <Ring pct={pct} color={scoreColor(pct)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom 3-col grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Campaigns Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins-bold text-[#1a2530] text-[15px]">Campaigns Overview</h2>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">Active campaigns running now</p>
            </div>
            <button
              onClick={() => navigate("/country/campaigns")}
              className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View all →
            </button>
          </div>
          {activeCampaigns.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <IoMegaphoneOutline className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-poppins-semibold text-gray-400">No active campaigns</p>
              <button
                onClick={() => navigate("/country/campaigns")}
                className="mt-3 text-xs font-poppins-bold text-[#16a34a] border border-[#dcfce7] bg-[#f0fdf4] px-3 py-1.5 rounded-lg hover:bg-[#dcfce7]"
              >
                + New Campaign
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeCampaigns.slice(0, 3).map((c) => {
                const daysLeft = c.end_date
                  ? Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86_400_000))
                  : null;
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <IoMegaphoneOutline className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-poppins-bold text-[#1a2530] leading-tight truncate">{c.name}</p>
                      {c.product && <p className="text-[11px] font-poppins text-gray-400 mt-0.5 truncate">{c.product.product_name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-poppins-bold text-[#16a34a] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">Active</span>
                        {daysLeft !== null && (
                          <span className="text-[10px] font-poppins text-gray-400">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeCampaigns.length > 3 && (
                <button onClick={() => navigate("/country/campaigns")}
                  className="text-xs font-poppins-semibold text-[#16a34a] hover:underline text-center">
                  +{activeCampaigns.length - 3} more campaigns
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Performance — bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-poppins-bold text-[#1a2530] text-[15px]">Product Performance</h2>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">HCP visits by focused product</p>
            </div>
          </div>
          {feedLoading ? (
            <div className="flex items-end gap-2 h-40">
              {[60, 40, 80, 30, 55].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-lg bg-gray-100 animate-pulse" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <IoMegaphoneOutline className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-poppins-semibold text-gray-400">No product data yet</p>
            </div>
          ) : (
            <Column
              data={chartData}
              xField="name"
              yField="visits"
              color="#16a34a"
              radius={[4, 4, 0, 0]}
              height={160}
              padding={[10, 0, 40, 0]}
              xAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af" }, autoRotate: true } }}
              yAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af" } }, grid: { line: { style: { stroke: "#f3f4f6" } } } }}
              tooltip={{ formatter: (d: { name: string; visits: number }) => ({ name: "Visits", value: d.visits }) }}
            />
          )}
        </div>

        {/* Sample Accountability + Cycle Compliance */}
        <div className="flex flex-col gap-3">

          {/* Sample accountability */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <LuFlaskConical className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-poppins-bold text-[#1a2530] text-sm">Sample Accountability</h3>
                <p className="text-[11px] font-poppins text-gray-400">Issued vs given, all reps</p>
              </div>
            </div>
            {sampleTotals === null ? (
              <div className="h-8 flex items-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-poppins-extrabold text-violet-600">{sampleTotals.given.toLocaleString()}</span>
                  <span className="text-xs font-poppins text-gray-400">of {sampleTotals.issued.toLocaleString()} issued</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${samplePct}%`, transition: "width 0.6s ease" }} />
                </div>
                <p className="text-[11px] font-poppins text-gray-400 mt-1.5">{samplePct}% utilisation</p>
              </>
            )}
          </div>

          {/* Call cycle compliance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                <LuCalendarCheck className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h3 className="font-poppins-bold text-[#1a2530] text-sm">Cycle Compliance</h3>
                <p className="text-[11px] font-poppins text-gray-400">Approved call cycles this month</p>
              </div>
            </div>
            {cycleStats === null ? (
              <div className="h-8 flex items-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-poppins-extrabold text-sky-600">{cyclePct}%</span>
                  <span className="text-xs font-poppins text-gray-400">{cycleStats.approved} / {cycleStats.total} approved</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${cyclePct}%`, transition: "width 0.6s ease" }} />
                </div>
                {cycleStats.submitted > 0 && (
                  <p className="text-[11px] font-poppins text-amber-600 mt-1.5">{cycleStats.submitted} awaiting approval</p>
                )}
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
