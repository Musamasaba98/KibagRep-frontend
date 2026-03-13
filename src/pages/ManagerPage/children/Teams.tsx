import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { getCompanyUsersApi } from "../../../services/api";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
  team_id: string | null;
}

interface SupervisorCard {
  supervisor: User;
  reps: User[];
}

const getInitials = (firstname: string, lastname: string) =>
  `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();

const Teams = () => {
  const [cards, setCards] = useState<SupervisorCard[]>([]);
  const [orphanReps, setOrphanReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getCompanyUsersApi()
      .then((res) => {
        const users: User[] = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

        const supervisors = users.filter((u) => u.role === "Supervisor");
        const reps = users.filter((u) => u.role === "MedicalRep");

        // Map: team_id → reps
        const repsByTeam: Record<string, User[]> = {};
        const unassignedReps: User[] = [];

        reps.forEach((rep) => {
          if (rep.team_id) {
            if (!repsByTeam[rep.team_id]) repsByTeam[rep.team_id] = [];
            repsByTeam[rep.team_id].push(rep);
          } else {
            unassignedReps.push(rep);
          }
        });

        const built: SupervisorCard[] = supervisors.map((sup) => ({
          supervisor: sup,
          reps: sup.team_id ? (repsByTeam[sup.team_id] ?? []) : [],
        }));

        // Reps whose team_id doesn't match any supervisor
        const supervisorTeamIds = new Set(
          supervisors.map((s) => s.team_id).filter(Boolean)
        );
        const trueOrphans = [
          ...unassignedReps,
          ...reps.filter(
            (r) => r.team_id && !supervisorTeamIds.has(r.team_id)
          ),
        ];

        setCards(built);
        setOrphanReps(trueOrphans);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalReps = cards.reduce((acc, c) => acc + c.reps.length, 0) + orphanReps.length;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Supervisors and their rep teams</p>
        </div>
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-gray-400">Loading team data…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Supervisors and their rep teams</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-red-400 text-sm">Failed to load team data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Supervisors and their rep teams</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#16a34a]">
            <FaUserGroup className="w-3 h-3" />
            {cards.length} Supervisor{cards.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {totalReps} Rep{totalReps !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Summary stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Supervisors</p>
          <p className="text-3xl font-black text-[#1a1a1a]">{cards.length}</p>
          <p className="text-xs text-gray-400 mt-1">Reporting to you</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Medical Reps</p>
          <p className="text-3xl font-black text-[#1a1a1a]">{totalReps}</p>
          <p className="text-xs text-gray-400 mt-1">Across all teams</p>
        </div>
      </div>

      {/* Empty state */}
      {cards.length === 0 && orphanReps.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
            <FaUserGroup className="w-6 h-6 text-[#16a34a]" />
          </div>
          <p className="font-semibold text-gray-700">No team members found</p>
          <p className="text-sm text-gray-400">No supervisors or reps are linked to your company yet.</p>
        </div>
      )}

      {/* Supervisor cards */}
      <div className="flex flex-col gap-4">
        {cards.map(({ supervisor, reps }) => {
          const isOpen = expanded[supervisor.id] ?? false;
          return (
            <div
              key={supervisor.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center gap-4 px-6 py-5">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                  <span className="text-[#16a34a] font-black text-sm">
                    {getInitials(supervisor.firstname, supervisor.lastname)}
                  </span>
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1a1a1a] text-[15px] truncate">
                    {supervisor.firstname} {supervisor.lastname}
                  </p>
                  <p className="text-xs text-[#16a34a] font-semibold mt-0.5">Supervisor</p>
                </div>

                {/* Rep count badge */}
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {reps.length} rep{reps.length !== 1 ? "s" : ""}
                </span>

                {/* View Performance link */}
                <NavLink
                  to="/supervisor/analysis"
                  className="shrink-0 rounded-full border border-[#16a34a] px-3 py-1 text-xs font-semibold text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}
                >
                  View Performance
                </NavLink>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(supervisor.id)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s, color 0.15s" }}
                  aria-label={isOpen ? "Collapse rep list" : "Expand rep list"}
                >
                  {isOpen ? (
                    <LuChevronDown className="w-4 h-4" />
                  ) : (
                    <LuChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expandable rep list */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {reps.length === 0 ? (
                    <p className="text-sm text-gray-400 px-6 py-4">No reps assigned to this team.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {reps.map((rep) => (
                        <div key={rep.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/60" style={{ transition: "background-color 0.15s" }}>
                          {/* Rep initials */}
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="text-gray-600 font-bold text-xs">
                              {getInitials(rep.firstname, rep.lastname)}
                            </span>
                          </div>
                          {/* Rep info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1a1a1a] text-sm truncate">
                              {rep.firstname} {rep.lastname}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Medical Rep</p>
                          </div>
                          {/* Activity dot */}
                          <div
                            className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0"
                            title="Active"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned reps card */}
        {orphanReps.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <FaUserGroup className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a1a1a] text-[15px]">Unassigned Reps</p>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">No supervisor linked</p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {orphanReps.length} rep{orphanReps.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => toggleExpand("__orphans__")}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                style={{ transition: "background-color 0.15s, color 0.15s" }}
                aria-label="Toggle unassigned reps"
              >
                {expanded["__orphans__"] ? (
                  <LuChevronDown className="w-4 h-4" />
                ) : (
                  <LuChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
            {expanded["__orphans__"] && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {orphanReps.map((rep) => (
                  <div key={rep.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/60" style={{ transition: "background-color 0.15s" }}>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-gray-600 font-bold text-xs">
                        {getInitials(rep.firstname, rep.lastname)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1a1a] text-sm truncate">
                        {rep.firstname} {rep.lastname}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Medical Rep</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" title="No team" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
