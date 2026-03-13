import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaUserPlus, FaUsers, FaEllipsisVertical, FaTrash } from "react-icons/fa6";
import { getCompanyUsersApi, getCompanyTeamsApi, createCompanyTeamApi, updateCompanyUserApi, removeUserFromCompanyApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface CompanyUser {
  id: string; username: string; firstname: string; lastname: string;
  role: string; email: string; contact?: string;
  team?: { id: string; team_name: string } | null;
  date_of_joining: string;
}
interface Team { id: string; team_name: string; }

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", SALES_ADMIN: "Company Admin",
  COUNTRY_MGR: "Country Manager", Manager: "Manager",
  Supervisor: "Supervisor", MedicalRep: "Medical Rep", USER: "Free User",
};
const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "bg-gray-800 text-white", SALES_ADMIN: "bg-purple-100 text-purple-700",
  COUNTRY_MGR: "bg-sky-100 text-sky-700", Manager: "bg-amber-100 text-amber-700",
  Supervisor: "bg-teal-100 text-teal-700", MedicalRep: "bg-green-100 text-[#16a34a]",
  USER: "bg-gray-100 text-gray-500",
};

const Users = () => {
  const actorRole = useSelector((s: any) => s.auth?.user?.role ?? "SALES_ADMIN");
  const [users, setUsers]         = useState<CompanyUser[]>([]);
  const [teams, setTeams]         = useState<Team[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName]     = useState("");
  const [teamSaving, setTeamSaving]       = useState(false);
  const [menuOpen, setMenuOpen]   = useState<string | null>(null);
  const [error, setError]         = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getCompanyUsersApi(), getCompanyTeamsApi()])
      .then(([ur, tr]) => { setUsers(ur.data.data ?? []); setTeams(tr.data.data ?? []); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this user from the company?")) return;
    try { await removeUserFromCompanyApi(userId); load(); }
    catch { alert("Failed to remove user"); }
  };

  const handleTeamChange = async (userId: string, team_id: string) => {
    try { await updateCompanyUserApi(userId, { team_id: team_id || null }); load(); }
    catch { alert("Failed to update team"); }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamSaving(true);
    try { await createCompanyTeamApi(newTeamName.trim()); setNewTeamName(""); setShowTeamModal(false); load(); }
    catch { alert("Failed to create team"); }
    finally { setTeamSaving(false); }
  };

  const byRole = (role: string) => users.filter((u) => u.role === role);
  const SECTIONS = [
    { role: "COUNTRY_MGR",  label: "Country Managers" },
    { role: "Manager",      label: "Managers" },
    { role: "Supervisor",   label: "Supervisors" },
    { role: "MedicalRep",   label: "Medical Reps" },
    { role: "SALES_ADMIN",  label: "Company Admins" },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a2530] tracking-tight">Team Members</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} users in your company</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
            + New Team
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}>
            <FaUserPlus className="w-3.5 h-3.5" /><span>Add User</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Teams row */}
      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-full shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
              <FaUsers className="w-3 h-3 text-gray-400" />{t.team_name}
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{users.filter((u) => u.team?.id === t.id).length} members</span>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-gray-400">
          <FaUsers className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">No users yet</p>
          <p className="text-sm mt-1">Use "Add User" to search and add team members</p>
        </div>
      ) : (
        SECTIONS.map(({ role, label }) => {
          const list = byRole(role);
          if (list.length === 0) return null;
          return (
            <div key={role} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</h2>
                <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{list.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {list.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50">
                    <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#16a34a] font-black text-xs">{u.firstname[0]}{u.lastname[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username} · {u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                    {/* Team assign */}
                    <select value={u.team?.id ?? ""}
                      onChange={(e) => handleTeamChange(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] bg-white text-gray-600 shrink-0 hidden sm:block">
                      <option value="">No team</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                    </select>
                    {/* Menu */}
                    <div className="relative shrink-0">
                      <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
                        <FaEllipsisVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpen === u.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_0_rgba(0,0,0,0.1)] py-1 min-w-[140px]">
                            <button onClick={() => { handleRemove(u.id); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus-visible:outline-none">
                              <FaTrash className="w-3 h-3" />Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showAdd && (
        <AddUserModal actorRole={actorRole} onClose={() => setShowAdd(false)} onSuccess={load} />
      )}

      {/* Create team modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-sm p-6">
            <h2 className="font-black text-[#1a2530] text-lg mb-4">Create Team</h2>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <input type="text" required value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Central Team A"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowTeamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={teamSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {teamSaving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
