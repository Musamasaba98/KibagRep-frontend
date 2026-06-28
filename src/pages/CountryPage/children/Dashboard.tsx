import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserGroup, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { IoCalendarOutline, IoMegaphoneOutline } from "react-icons/io5";
import { LuReceiptText, LuChartNoAxesCombined, LuUsers } from "react-icons/lu";
import { MdOutlineWarningAmber, MdOutlineGpsOff } from "react-icons/md";
import { LuChevronRight } from "react-icons/lu";
import { format } from "date-fns";
import {
  getCompanyFeedApi,
  getPendingReportsApi,
  getCompanyUsersApi,
  getCompanyTeamsApi,
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

const avatarInitials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

const pctColor = (pct: number) =>
  pct >= 75 ? "text-[#16a34a]" : pct >= 50 ? "text-amber-600" : "text-red-500";

const barBg = (pct: number) =>
  pct >= 75 ? "bg-[#16a34a]" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  // Feed + reports
  const [summary, setSummary] = useState<RepSummary[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);

  // Users + teams
  const [allUsers, setAllUsers] = useState<CompanyUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [error, setError] = useState("");

  // ── Feed data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setFeedLoading(true);
    Promise.allSettled([
      getCompanyFeedApi({ days: 30 }),
      getPendingReportsApi(),
    ]).then(([feedRes, reportsRes]) => {
      if (feedRes.status === "fulfilled") {
        setSummary(feedRes.value.data.summary ?? []);
        setFeed(feedRes.value.data?.data ?? []);
      }
      if (reportsRes.status === "fulfilled") {
        setPendingCount((reportsRes.value.data.data ?? []).length);
      }
      if (feedRes.status === "rejected" && reportsRes.status === "rejected") {
        setError("Failed to load dashboard data.");
      }
    }).finally(() => setFeedLoading(false));
  }, []);

  // ── Users + teams ──────────────────────────────────────────────────────────
  useEffect(() => {
    setUsersLoading(true);
    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyTeamsApi(),
    ]).then(([usersRes, teamsRes]) => {
      const users: CompanyUser[] = usersRes.status === "fulfilled"
        ? (usersRes.value.data?.data ?? [])
        : [];
      setAllUsers(users);

      const teamList: Team[] = teamsRes.status === "fulfilled"
        ? (teamsRes.value.data?.data ?? [])
        : [];
      setTeams(teamList);
    }).finally(() => setUsersLoading(false));
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalVisits = summary.reduce((s, r) => s + r.visits, 0);
  const gpsAnomalies = feed.filter((a) => a.gps_anomaly === true);

  // Rep visit lookup: userId → visits
  const repVisitMap: Record<string, number> = {};
  summary.forEach((r) => { repVisitMap[r.user.id] = r.visits; });

  const managers = allUsers.filter((u) => u.role === "Manager");

  // Supervisor performance — derived from teams (Team.supervisor = the supervisor assigned to each team)
  // This is correct: Supervisor → Team → Reps. Managers are cross-cutting and don't own specific teams.
  const supervisorStats = teams
    .filter((t) => t.supervisor)
    .map((team) => {
      const teamReps = (team.users ?? []).filter((u) => u.role === "MedicalRep");
      const teamVisits = teamReps.reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
      return { team, sup: team.supervisor!, repCount: teamReps.length, teamVisits };
    })
    .sort((a, b) => b.teamVisits - a.teamVisits);

  const maxSupVisits = Math.max(...supervisorStats.map((s) => s.teamVisits), 1);

  // Teams coverage cards (for the grid below)
  const teamsWithStats = teams.map((team) => {
    const teamReps = (team.users ?? []).filter((u) => u.role === "MedicalRep");
    const visits = teamReps.reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
    const maxV = Math.max(...teams.map((t) => {
      return (t.users ?? []).filter(u => u.role === "MedicalRep").reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
    }), 1);
    const pct = Math.round((visits / maxV) * 100);
    return { ...team, repCount: teamReps.length, visits, pct };
  }).sort((a, b) => b.visits - a.visits);

  // Inactive reps: in the system but 0 visits this month
  const inactiveReps = allUsers
    .filter((u) => u.role === "MedicalRep" && (repVisitMap[u.id] ?? 0) === 0)
    .slice(0, 5);

  // Product performance from feed
  const productMap: Record<string, number> = {};
  feed.forEach((a) => {
    const name = a.focused_product?.product_name;
    if (name) productMap[name] = (productMap[name] ?? 0) + 1;
  });
  const derivedProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      name, count,
      pct: feed.length > 0 ? Math.round((count / feed.length) * 100) : 0,
      color: ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444"][i],
    }));

  const kpiCards = [
    {
      label: "Field Reps",
      value: feedLoading ? "—" : summary.length,
      sub: "Active this month",
      gradient: "from-[#16a34a] to-[#15803d]",
      icon: FaUserGroup,
      shadow: "shadow-green-200",
      to: null,
    },
    {
      label: "Total Visits",
      value: feedLoading ? "—" : totalVisits.toLocaleString(),
      sub: "GPS-verified calls, 30 days",
      gradient: "from-sky-500 to-sky-600",
      icon: IoCalendarOutline,
      shadow: "shadow-sky-100",
      to: "/country/reports",
    },
    {
      label: "GPS Anomalies",
      value: feedLoading ? "—" : gpsAnomalies.length,
      sub: "Flagged visits this month",
      gradient: gpsAnomalies.length > 0 ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500",
      icon: MdOutlineGpsOff,
      shadow: gpsAnomalies.length > 0 ? "shadow-orange-100" : "shadow-gray-100",
      to: null,
    },
    {
      label: "Pending Reports",
      value: feedLoading ? "—" : pendingCount,
      sub: "Awaiting approval",
      gradient: pendingCount > 0 ? "from-violet-500 to-violet-600" : "from-gray-400 to-gray-500",
      icon: LuReceiptText,
      shadow: pendingCount > 0 ? "shadow-violet-100" : "shadow-gray-100",
      to: "/country/reports",
    },
  ];

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">

      {/* ── Header ── */}
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">National Overview</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Country-wide field performance — last 30 days</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => card.to && navigate(card.to)}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-4 sm:p-5 shadow-lg ${card.shadow} ${card.to ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
              style={{ transition: "transform 0.2s ease" }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2 sm:mb-3">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="font-poppins-extrabold text-white text-2xl sm:text-3xl leading-none">{card.value}</p>
                <p className="text-white/90 font-poppins-bold text-[12px] sm:text-[13px] mt-1.5 leading-tight">{card.label}</p>
                <p className="text-white/60 text-[11px] font-poppins mt-0.5 hidden sm:block">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Supervisor Performance + Product Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Supervisor Performance — Supervisors own teams directly; managers are cross-cutting */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Supervisor Performance</h2>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">Visit volume by team, this month</p>
            </div>
            <button
              onClick={() => navigate("/country/analytics")}
              className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              Full analytics
            </button>
          </div>

          {usersLoading || feedLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 animate-pulse rounded mb-2 w-2/3" />
                    <div className="h-2 bg-gray-100 animate-pulse rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : supervisorStats.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <LuUsers className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-poppins-semibold text-gray-400">No supervisors assigned yet</p>
              <p className="text-xs font-poppins text-gray-300 mt-1">Assign supervisors to teams in the Admin portal</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {supervisorStats.slice(0, 6).map(({ sup, team, repCount, teamVisits }) => {
                const pct = Math.round((teamVisits / maxSupVisits) * 100);
                return (
                  <div key={team.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#16a34a] font-poppins-extrabold text-xs">{avatarInitials(sup.firstname, sup.lastname)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate">
                          {sup.firstname} {sup.lastname}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {pct >= 70 && <FaArrowTrendUp className="w-3 h-3 text-[#16a34a]" />}
                          {pct < 50 && <FaArrowTrendDown className="w-3 h-3 text-red-500" />}
                          <span className={`text-xs font-poppins-semibold ${pctColor(pct)}`}>
                            {teamVisits} visits
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barBg(pct)}`}
                          style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {team.team_name} · {repCount} rep{repCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manager count callout */}
          {!usersLoading && managers.length > 0 && (
            <button
              onClick={() => navigate("/country/managers")}
              className="mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/60 focus-visible:outline-none"
              style={{ transition: "background-color 0.15s" }}
            >
              <span className="text-xs font-poppins-semibold text-amber-700">
                {managers.length} cross-cutting manager{managers.length !== 1 ? "s" : ""} (Field / Sales / Marketing)
              </span>
              <LuChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Product Performance — live */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Product Detailing Share</h2>
            <p className="text-xs font-poppins text-gray-400 mt-0.5">
              {!feedLoading && derivedProducts.length > 0
                ? "Detailing coverage from live visit feed"
                : "Share of visits per product"}
            </p>
          </div>
          {feedLoading ? (
            <div className="flex flex-col gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-100 animate-pulse rounded mb-2 w-3/4" />
                  <div className="h-2 bg-gray-100 animate-pulse rounded w-full" />
                </div>
              ))}
            </div>
          ) : derivedProducts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {derivedProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{p.name}</p>
                    </div>
                    <span className="text-xs font-poppins-bold" style={{ color: p.color }}>{p.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${p.pct}%`, backgroundColor: p.color, transition: "width 0.6s ease" }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{p.count} visit{p.count !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IoMegaphoneOutline className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm font-poppins-semibold">No product data yet</p>
              <p className="text-gray-300 font-poppins text-xs mt-1">Appears as reps log visits with a focused product</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Teams Coverage ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Teams Coverage</h2>
            <p className="text-xs font-poppins text-gray-400 mt-0.5">Visit volume by field team this month</p>
          </div>
          <button
            onClick={() => navigate("/country/analytics")}
            className="text-xs font-poppins-semibold text-[#16a34a] hover:underline focus-visible:outline-none flex items-center gap-1"
          >
            <LuChartNoAxesCombined className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>

        {usersLoading || feedLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : teamsWithStats.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-gray-400 text-sm font-poppins-semibold">No teams yet</p>
            <p className="text-gray-300 font-poppins text-xs mt-1">Create teams in the Sales Admin portal</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {teamsWithStats.map((t) => (
              <div
                key={t.id}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:-translate-y-0.5"
                style={{ transition: "transform 0.2s ease" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{
                    background: t.pct >= 75
                      ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                      : t.pct >= 50
                      ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                      : "linear-gradient(135deg, #fee2e2, #fecaca)",
                  }}
                >
                  <span
                    className="font-poppins-extrabold text-base"
                    style={{ color: t.pct >= 75 ? "#16a34a" : t.pct >= 50 ? "#d97706" : "#dc2626" }}
                  >
                    {t.visits}
                  </span>
                </div>
                <p className="font-poppins-bold text-[#1a1a1a] text-xs text-center leading-tight">{t.team_name}</p>
                <p className="text-[10px] font-poppins text-gray-400 mt-0.5">{t.repCount} rep{t.repCount !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── GPS Anomalies — National ── */}
      {!feedLoading && gpsAnomalies.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <MdOutlineGpsOff className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">GPS Anomalies — National</h2>
              <p className="text-xs font-poppins text-gray-400">Visits flagged for GPS mismatch across all regions</p>
            </div>
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-poppins-bold bg-red-100 text-red-600">
              {gpsAnomalies.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {gpsAnomalies.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-poppins-semibold text-sm text-[#1a1a1a]">
                      {a.user.firstname} {a.user.lastname}
                    </span>
                    <span className="text-gray-300 text-xs">→</span>
                    <span className="text-sm font-poppins text-gray-600">{a.doctor.doctor_name}</span>
                    <span className="text-xs font-poppins text-gray-400">{a.doctor.town}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(a.date), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-poppins-bold bg-red-100 text-red-600 border border-red-200">
                  Anomaly
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inactive Reps Flag ── */}
      {!feedLoading && !usersLoading && inactiveReps.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <MdOutlineWarningAmber className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Inactive Reps</h2>
              <p className="text-xs font-poppins text-gray-400">Enrolled reps with zero visits this month</p>
            </div>
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-poppins-bold bg-amber-100 text-amber-700">
              {allUsers.filter((u) => u.role === "MedicalRep" && (repVisitMap[u.id] ?? 0) === 0).length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-gray-50">
            {inactiveReps.map((rep) => (
              <div key={rep.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-poppins-extrabold text-[10px]">{avatarInitials(rep.firstname, rep.lastname)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate">{rep.firstname} {rep.lastname}</p>
                  {rep.team && <p className="text-[11px] font-poppins text-gray-400">{rep.team.team_name}</p>}
                </div>
                <span className="text-xs font-poppins-bold text-amber-600 shrink-0">0 visits</span>
                <LuChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
