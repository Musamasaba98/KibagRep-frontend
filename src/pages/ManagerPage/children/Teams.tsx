import { useEffect, useState } from "react";
import { FaUserGroup } from "react-icons/fa6";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { MdOutlineSupervisorAccount } from "react-icons/md";
import { getCompanyUsersApi, getCompanyTeamsApi } from "../../../services/api";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
  team: { id: string; team_name: string } | null;
}

interface Team {
  id: string;
  team_name: string;
}

interface TeamGroup {
  team: Team;
  supervisors: User[];
  reps: User[];
}

const initials = (u: User) =>
  `${u.firstname?.[0] ?? ""}${u.lastname?.[0] ?? ""}`.toUpperCase();

const RoleChip = ({ role }: { role: string }) => {
  if (role === "Supervisor")
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
        Supervisor
      </span>
    );
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a]">
      Medical Rep
    </span>
  );
};

const MemberRow = ({ user }: { user: User }) => (
  <div
    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60"
    style={{ transition: "background-color 0.15s" }}
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        user.role === "Supervisor"
          ? "bg-violet-50 border border-violet-100"
          : "bg-gray-100"
      }`}
    >
      <span
        className={`font-poppins-bold text-xs ${
          user.role === "Supervisor" ? "text-violet-600" : "text-gray-600"
        }`}
      >
        {initials(user)}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-poppins-semibold text-[#1a1a1a] text-sm truncate">
        {user.firstname} {user.lastname}
      </p>
    </div>
    <RoleChip role={user.role} />
  </div>
);

// ─── Team card ────────────────────────────────────────────────────────────────

const TeamCard = ({ group }: { group: TeamGroup }) => {
  const [open, setOpen] = useState(true);
  const memberCount = group.supervisors.length + group.reps.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
      {/* Team header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 focus-visible:outline-none"
        style={{ transition: "background-color 0.12s" }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shrink-0 shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]">
          <FaUserGroup className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-poppins-bold text-[#1a1a1a] text-[15px] truncate">
            {group.team.team_name}
          </p>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">
            {group.supervisors.length} supervisor{group.supervisors.length !== 1 ? "s" : ""} ·{" "}
            {group.reps.length} rep{group.reps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="shrink-0 text-xs font-poppins-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>
        {open ? (
          <LuChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <LuChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Team members */}
      {open && (
        <div className="border-t border-gray-100">
          {memberCount === 0 ? (
            <p className="text-sm font-poppins text-gray-400 px-5 py-4">
              No members assigned to this team yet.
            </p>
          ) : (
            <>
              {/* Supervisors first */}
              {group.supervisors.length > 0 && (
                <>
                  <div className="px-5 pt-3 pb-1">
                    <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MdOutlineSupervisorAccount className="w-3.5 h-3.5" />
                      Supervisor{group.supervisors.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50 border-b border-gray-50">
                    {group.supervisors.map((s) => (
                      <MemberRow key={s.id} user={s} />
                    ))}
                  </div>
                </>
              )}

              {/* Reps */}
              {group.reps.length > 0 && (
                <>
                  <div className="px-5 pt-3 pb-1">
                    <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest">
                      Medical Reps
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {group.reps.map((r) => (
                      <MemberRow key={r.id} user={r} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Teams = () => {
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [noTeamSups, setNoTeamSups] = useState<User[]>([]);
  const [noTeamReps, setNoTeamReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [orphansOpen, setOrphansOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCompanyTeamsApi(), getCompanyUsersApi()])
      .then(([teamsRes, usersRes]) => {
        const teams: Team[] = teamsRes.data?.data ?? teamsRes.data ?? [];
        const users: User[] = usersRes.data?.data ?? usersRes.data ?? [];

        const fieldForce = users.filter((u) =>
          ["Supervisor", "MedicalRep"].includes(u.role)
        );

        // Build map: team.id → { supervisors, reps }
        const teamMap = new Map<string, { supervisors: User[]; reps: User[] }>(
          teams.map((t) => [t.id, { supervisors: [], reps: [] }])
        );

        const unassigned: User[] = [];

        fieldForce.forEach((u) => {
          if (u.team?.id && teamMap.has(u.team.id)) {
            const bucket = teamMap.get(u.team.id)!;
            if (u.role === "Supervisor") bucket.supervisors.push(u);
            else bucket.reps.push(u);
          } else {
            unassigned.push(u);
          }
        });

        const groups: TeamGroup[] = teams.map((t) => ({
          team: t,
          ...teamMap.get(t.id)!,
        }));

        setTeamGroups(groups);
        setNoTeamSups(unassigned.filter((u) => u.role === "Supervisor"));
        setNoTeamReps(unassigned.filter((u) => u.role === "MedicalRep"));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalMembers =
    teamGroups.reduce((s, g) => s + g.supervisors.length + g.reps.length, 0) +
    noTeamSups.length +
    noTeamReps.length;

  if (loading) {
    return (
      <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">Teams, supervisors and their reps</p>
        </div>
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm font-poppins text-gray-400">Loading team data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">Teams, supervisors and their reps</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-16">
          <p className="text-red-400 font-poppins text-sm">Failed to load team data. Please try again.</p>
        </div>
      </div>
    );
  }

  const noTeamCount = noTeamSups.length + noTeamReps.length;

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-poppins-bold text-[#1a1a1a] text-2xl tracking-tight">My Teams</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">Teams, supervisors and their reps</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-poppins-semibold text-[#16a34a]">
            <FaUserGroup className="w-3 h-3" />
            {teamGroups.length} Team{teamGroups.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-poppins-semibold text-gray-600">
            {totalMembers} Member{totalMembers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wide mb-1">Teams</p>
          <p className="text-3xl font-poppins-extrabold text-[#1a1a1a]">{teamGroups.length}</p>
          <p className="text-xs text-gray-400 font-poppins mt-0.5">Named teams</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wide mb-1">Supervisors</p>
          <p className="text-3xl font-poppins-extrabold text-[#1a1a1a]">
            {teamGroups.reduce((s, g) => s + g.supervisors.length, 0) + noTeamSups.length}
          </p>
          <p className="text-xs text-gray-400 font-poppins mt-0.5">Reporting to you</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wide mb-1">Medical Reps</p>
          <p className="text-3xl font-poppins-extrabold text-[#1a1a1a]">
            {teamGroups.reduce((s, g) => s + g.reps.length, 0) + noTeamReps.length}
          </p>
          <p className="text-xs text-gray-400 font-poppins mt-0.5">Across all teams</p>
        </div>
      </div>

      {/* Empty state */}
      {teamGroups.length === 0 && noTeamCount === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
            <FaUserGroup className="w-6 h-6 text-[#16a34a]" />
          </div>
          <p className="font-poppins-semibold text-gray-700">No team members found</p>
          <p className="text-sm font-poppins text-gray-400 text-center max-w-xs">
            No supervisors or reps are linked to your company yet. Ask the Sales Admin to add team members.
          </p>
        </div>
      )}

      {/* Team cards */}
      {teamGroups.map((group) => (
        <TeamCard key={group.team.id} group={group} />
      ))}

      {/* No-team members */}
      {noTeamCount > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => setOrphansOpen((o) => !o)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 focus-visible:outline-none"
            style={{ transition: "background-color 0.12s" }}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FaUserGroup className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-poppins-bold text-[#1a1a1a] text-[15px]">No Team Assigned</p>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">
                {noTeamSups.length} supervisor{noTeamSups.length !== 1 ? "s" : ""} · {noTeamReps.length} rep{noTeamReps.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs font-poppins-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
              {noTeamCount} unassigned
            </span>
            {orphansOpen ? (
              <LuChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <LuChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </button>

          {orphansOpen && (
            <div className="border-t border-gray-100">
              {noTeamSups.length > 0 && (
                <>
                  <div className="px-5 pt-3 pb-1">
                    <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MdOutlineSupervisorAccount className="w-3.5 h-3.5" />
                      Supervisors
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50 border-b border-gray-50">
                    {noTeamSups.map((u) => <MemberRow key={u.id} user={u} />)}
                  </div>
                </>
              )}
              {noTeamReps.length > 0 && (
                <>
                  <div className="px-5 pt-3 pb-1">
                    <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest">
                      Medical Reps
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {noTeamReps.map((u) => <MemberRow key={u.id} user={u} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;
