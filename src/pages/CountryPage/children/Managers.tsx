import { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa6";
import { LuUsers, LuActivity } from "react-icons/lu";
import { getCompanyUsersApi, getCompanyTeamsApi, getCompanyFeedApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface CompanyUser {
  id: string; username: string; firstname: string; lastname: string;
  role: string; email: string; manager_type?: string | null;
  team?: { id: string; team_name: string } | null;
}

interface CompanyTeam {
  id: string; team_name: string;
  supervisor?: { id: string; firstname: string; lastname: string } | null;
  users?: { id: string; role: string }[];
}

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
}

const MANAGER_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  Field:     { label: "Field Manager",     color: "text-blue-700",   bg: "bg-blue-50 border-blue-100"   },
  Sales:     { label: "Sales Manager",     color: "text-green-700",  bg: "bg-green-50 border-green-100" },
  Marketing: { label: "Marketing Manager", color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
};

const Managers = () => {
  const [allUsers, setAllUsers] = useState<CompanyUser[]>([]);
  const [teams, setTeams]       = useState<CompanyTeam[]>([]);
  const [summary, setSummary]   = useState<RepSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyTeamsApi(),
      getCompanyFeedApi({ days: 30 }),
    ]).then(([usersRes, teamsRes, feedRes]) => {
      if (usersRes.status === "fulfilled") setAllUsers(usersRes.value.data?.data ?? []);
      if (teamsRes.status === "fulfilled") setTeams(teamsRes.value.data?.data ?? []);
      if (feedRes.status === "fulfilled") setSummary(feedRes.value.data?.summary ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const managers = allUsers.filter((u) => u.role === "Manager");

  // Company-wide stats that every cross-cutting manager can see
  const repVisitMap: Record<string, number> = {};
  summary.forEach((r) => { repVisitMap[r.user.id] = r.visits; });

  const totalReps = allUsers.filter((u) => u.role === "MedicalRep").length;
  const totalSups = allUsers.filter((u) => u.role === "Supervisor").length;
  const totalTeams = teams.length;
  const totalVisits = summary.reduce((s, r) => s + r.visits, 0);
  const activeReps = summary.filter((r) => r.visits > 0).length;

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Managers</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">
            Cross-cutting management roles · all teams · last 30 days
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] flex-shrink-0"
          style={{ transition: "background-color 0.15s" }}>
          <FaUserPlus className="w-3.5 h-3.5" /><span className="font-poppins">Add Manager</span>
        </button>
      </div>

      {/* Company-wide summary — visible to all managers since they're cross-cutting */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Teams",        value: totalTeams,  sub: "active field teams" },
          { label: "Supervisors",  value: totalSups,   sub: "team supervisors" },
          { label: "Field Reps",   value: totalReps,   sub: `${activeReps} active this month` },
          { label: "Total Visits", value: totalVisits, sub: "doctor visits, 30d" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="font-poppins-extrabold text-2xl text-[#1a1a1a]">{loading ? "—" : s.value}</p>
            <p className="text-xs font-poppins-semibold text-[#1a1a1a] mt-1">{s.label}</p>
            <p className="text-[11px] font-poppins text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Manager list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <p className="font-poppins-semibold">No managers yet</p>
            <p className="text-sm font-poppins mt-1">
              Add a Field, Sales, or Marketing Manager using the button above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {managers.map((m) => {
              const typeInfo = m.manager_type ? MANAGER_TYPE_LABELS[m.manager_type] : null;
              return (
                <div key={m.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-gray-50/50">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-700 font-poppins-extrabold text-sm">
                      {m.firstname[0]}{m.lastname[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-poppins-semibold text-[#1a2530] text-sm">{m.firstname} {m.lastname}</p>
                    <p className="text-xs font-poppins text-gray-400 truncate">{m.email}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {typeInfo ? (
                        <span className={`text-[11px] font-poppins-semibold px-2 py-0.5 rounded-full border ${typeInfo.bg} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      ) : (
                        <span className="text-[11px] font-poppins-semibold px-2 py-0.5 rounded-full border bg-gray-50 border-gray-200 text-gray-500">
                          Manager
                        </span>
                      )}
                      {/* What this manager oversees (company-wide) */}
                      <span className="flex items-center gap-1 text-[11px] font-poppins text-gray-400">
                        <LuUsers className="w-3 h-3" />
                        {totalTeams} team{totalTeams !== 1 ? "s" : ""},&nbsp;{totalReps} rep{totalReps !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Scope label */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <LuActivity className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-poppins-bold text-amber-600 text-sm">Company-wide</span>
                    </div>
                    <p className="text-[10px] font-poppins text-gray-400 mt-0.5">scope</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teams & Supervisors — the operational unit managers oversee */}
      {!loading && teams.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-50">
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Teams Under Management</h2>
            <p className="text-xs font-poppins text-gray-400 mt-0.5">
              All supervisors and their teams — visible to all managers
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {teams.map((team) => {
              const repCount = (team.users ?? []).filter((u) => u.role === "MedicalRep").length;
              const teamVisits = (team.users ?? []).reduce((s, u) => s + (repVisitMap[u.id] ?? 0), 0);
              return (
                <div key={team.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <LuUsers className="w-4 h-4 text-[#16a34a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins-semibold text-[#1a1a1a] text-sm">{team.team_name}</p>
                    <p className="text-[11px] font-poppins text-gray-400 mt-0.5">
                      {team.supervisor
                        ? `Sup: ${team.supervisor.firstname} ${team.supervisor.lastname}`
                        : "No supervisor assigned"
                      }
                      &nbsp;·&nbsp;{repCount} rep{repCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-poppins-bold text-[#16a34a] text-sm">{teamVisits}</span>
                    <p className="text-[10px] font-poppins text-gray-400">visits</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <AddUserModal actorRole="COUNTRY_MGR" defaultRole="Manager" title="Add Manager"
          onClose={() => setShowAdd(false)} onSuccess={load} />
      )}
    </div>
  );
};

export default Managers;
