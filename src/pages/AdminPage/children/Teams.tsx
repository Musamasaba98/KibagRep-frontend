import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FaUserGroup, FaUsers } from "react-icons/fa6";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { getCompanyTeamsApi, getCompanyUsersApi } from "../../../services/api";

interface Team { id: string; team_name: string; date_of_creation: string; }
interface CompanyUser {
  id: string; firstname: string; lastname: string; role: string; email: string;
  team?: { id: string; team_name: string } | null;
}

const ROLE_LABEL: Record<string, string> = {
  MedicalRep: "Medical Rep", Supervisor: "Supervisor", Manager: "Manager",
  COUNTRY_MGR: "Country Manager", SALES_ADMIN: "Company Admin",
};
const ROLE_COLOR: Record<string, string> = {
  MedicalRep: "bg-green-100 text-[#16a34a]", Supervisor: "bg-teal-100 text-teal-700",
  Manager: "bg-amber-100 text-amber-700", COUNTRY_MGR: "bg-sky-100 text-sky-700",
  SALES_ADMIN: "bg-purple-100 text-purple-700",
};

const Teams = () => {
  const [teams, setTeams]         = useState<Team[]>([]);
  const [users, setUsers]         = useState<CompanyUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.allSettled([getCompanyTeamsApi(), getCompanyUsersApi()]).then(([tRes, uRes]) => {
      if (tRes.status === "fulfilled") setTeams(tRes.value.data?.data ?? []);
      if (uRes.status === "fulfilled") setUsers(uRes.value.data?.data ?? uRes.value.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const membersOf = (teamId: string) => users.filter((u) => u.team?.id === teamId);
  const unassigned = users.filter((u) => !u.team);

  // Summary counts
  const totalReps  = users.filter((u) => u.role === "MedicalRep").length;
  const totalSups  = users.filter((u) => u.role === "Supervisor").length;
  const totalStaff = users.length;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Teams</h1>
        <p className="text-gray-400 text-sm mt-0.5">Sales team structure and member breakdown</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Teams",          value: teams.length,  color: "text-[#16a34a]", bg: "bg-[#f0fdf4]",   border: "border-[#dcfce7]" },
          { label: "Total Staff",    value: totalStaff,    color: "text-gray-700",  bg: "bg-gray-50",      border: "border-gray-200" },
          { label: "Medical Reps",   value: totalReps,     color: "text-teal-600",  bg: "bg-teal-50",      border: "border-teal-200" },
          { label: "Supervisors",    value: totalSups,     color: "text-amber-600", bg: "bg-amber-50",     border: "border-amber-200" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-center justify-between`}>
            <span className="text-xs font-semibold text-gray-500">{s.label}</span>
            {loading ? (
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-gray-400">
          <FaUsers className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">No teams yet</p>
          <p className="text-sm mt-1">Create teams in the Sales Admin panel and assign members.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map((team) => {
            const members = membersOf(team.id);
            const isOpen  = expanded.has(team.id);
            const repCount = members.filter((m) => m.role === "MedicalRep").length;
            const supCount = members.filter((m) => m.role === "Supervisor").length;

            return (
              <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(team.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16a34a] text-left"
                  style={{ transition: "background-color 0.15s" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <FaUserGroup className="w-4 h-4 text-[#16a34a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a1a1a] text-sm">{team.team_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {format(new Date(team.date_of_creation), "dd MMM yyyy")}
                      {" · "}{members.length} member{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {/* Role badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {repCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-[#16a34a]">
                        {repCount} rep{repCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {supCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                        {supCount} sup{supCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {isOpen
                    ? <LuChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <LuChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>

                {/* Member list */}
                {isOpen && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No members assigned to this team.</p>
                    ) : (
                      members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/40">
                          <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#16a34a] font-black text-xs">
                              {m.firstname[0]}{m.lastname[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.firstname} {m.lastname}</p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[m.role] ?? "bg-gray-100 text-gray-500"}`}>
                            {ROLE_LABEL[m.role] ?? m.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleExpand("__unassigned__")}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 focus-visible:outline-none text-left"
                style={{ transition: "background-color 0.15s" }}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <FaUserGroup className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-500 text-sm">Unassigned</p>
                  <p className="text-xs text-gray-400 mt-0.5">{unassigned.length} member{unassigned.length !== 1 ? "s" : ""} without a team</p>
                </div>
                {expanded.has("__unassigned__")
                  ? <LuChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
                  : <LuChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                }
              </button>
              {expanded.has("__unassigned__") && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {unassigned.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-gray-500 font-black text-xs">{m.firstname[0]}{m.lastname[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.firstname} {m.lastname}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[m.role] ?? "bg-gray-100 text-gray-500"}`}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;
