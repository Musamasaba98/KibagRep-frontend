import { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa6";
import { LuUsers, LuTrendingUp } from "react-icons/lu";
import { getCompanyUsersApi, getCompanyFeedApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface CompanyUser {
  id: string; username: string; firstname: string; lastname: string;
  role: string; email: string;
  team?: { id: string; team_name: string } | null;
}

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
}

const Managers = () => {
  const [allUsers, setAllUsers]   = useState<CompanyUser[]>([]);
  const [summary, setSummary]     = useState<RepSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyFeedApi({ days: 30 }),
    ]).then(([usersRes, feedRes]) => {
      if (usersRes.status === "fulfilled") setAllUsers(usersRes.value.data?.data ?? []);
      if (feedRes.status === "fulfilled") setSummary(feedRes.value.data?.summary ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const managers   = allUsers.filter((u) => u.role === "Manager");
  const reps       = allUsers.filter((u) => u.role === "MedicalRep");
  const supervisors = allUsers.filter((u) => u.role === "Supervisor");

  // Build repId → visits map from feed summary
  const repVisitMap: Record<string, number> = {};
  summary.forEach((r) => { repVisitMap[r.user.id] = r.visits; });

  const managersWithStats = managers.map((mgr) => {
    const teamReps = reps.filter((r) => r.team?.id && r.team.id === mgr.team?.id);
    const teamSups = supervisors.filter((s) => s.team?.id && s.team.id === mgr.team?.id);
    const teamVisits = teamReps.reduce((s, r) => s + (repVisitMap[r.id] ?? 0), 0);
    const activeReps = teamReps.filter((r) => (repVisitMap[r.id] ?? 0) > 0).length;
    return { ...mgr, teamReps: teamReps.length, teamSups: teamSups.length, teamVisits, activeReps };
  });

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Managers</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">Regional field line managers · last 30 days</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] flex-shrink-0"
          style={{ transition: "background-color 0.15s" }}>
          <FaUserPlus className="w-3.5 h-3.5" /><span className="font-poppins">Add Manager</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : managersWithStats.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <p className="font-poppins-semibold">No managers yet</p>
            <p className="text-sm font-poppins mt-1">Use "Add Manager" to assign a manager to your company</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {managersWithStats.map((m) => (
              <div key={m.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-gray-50/50">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-700 font-poppins-extrabold text-sm">{m.firstname[0]}{m.lastname[0]}</span>
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="font-poppins-semibold text-[#1a2530] text-sm">{m.firstname} {m.lastname}</p>
                  <p className="text-xs font-poppins text-gray-400 truncate">{m.email}</p>

                  {/* Team + rep/supervisor stats */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {m.team ? (
                      <span className="text-[11px] font-poppins-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                        {m.team.team_name}
                      </span>
                    ) : (
                      <span className="text-[11px] font-poppins text-gray-300">No team assigned</span>
                    )}
                    {m.teamReps > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-poppins text-gray-500">
                        <LuUsers className="w-3 h-3" />
                        {m.teamReps} rep{m.teamReps !== 1 ? "s" : ""}
                        {m.activeReps < m.teamReps && (
                          <span className="text-amber-500">· {m.teamReps - m.activeReps} inactive</span>
                        )}
                      </span>
                    )}
                    {m.teamSups > 0 && (
                      <span className="text-[11px] font-poppins text-gray-500">{m.teamSups} supervisor{m.teamSups !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                {/* Visit count */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <LuTrendingUp className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span className="font-poppins-bold text-[#16a34a] text-sm">{m.teamVisits}</span>
                  </div>
                  <p className="text-[10px] font-poppins text-gray-400 mt-0.5">visits / 30d</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddUserModal actorRole="COUNTRY_MGR" defaultRole="Manager" title="Add Manager"
          onClose={() => setShowAdd(false)} onSuccess={load} />
      )}
    </div>
  );
};

export default Managers;
