import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { FaUserGroup, FaUsers, FaPlus, FaXmark, FaBoxOpen } from "react-icons/fa6";
import {
  LuChevronDown, LuChevronUp, LuPencil, LuTrash2, LuCheck, LuX, LuPackage,
} from "react-icons/lu";
import {
  getCompanyTeamsApi, getCompanyUsersApi, getCompanyProductsApi,
  createCompanyTeamApi, renameCompanyTeamApi, deleteCompanyTeamApi,
  addTeamProductApi, removeTeamProductApi,
  updateCompanyUserApi, updateCompanyTeamApi, getTerritoriesApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TerritoryRef { id: string; name: string; territory_type: string; region?: string; }
interface Territory { id: string; name: string; territory_type: string; region?: string; }
interface Product { id: string; product_name: string; classification: string; unit_price?: number; }
interface TeamProduct { team_id: string; product_id: string; product: Product; }
interface TeamMember {
  id: string; firstname: string; lastname: string; role: string;
  territory?: TerritoryRef | null;
  secondary_territory?: TerritoryRef | null;
}
interface TeamSupervisor { id: string; firstname: string; lastname: string; }
interface Team { id: string; team_name: string; date_of_creation: string; users: TeamMember[]; team_products: TeamProduct[]; supervisor?: TeamSupervisor | null; supervisor_id?: string | null; }
interface CompanyUser { id: string; firstname: string; lastname: string; role: string; email: string; team?: { id: string; team_name: string } | null; }

const ROLE_LABEL: Record<string, string> = {
  MedicalRep: "Medical Rep", Supervisor: "Supervisor", Manager: "Manager",
  COUNTRY_MGR: "Country Manager", SALES_ADMIN: "Company Admin",
};
const ROLE_COLOR: Record<string, string> = {
  MedicalRep: "bg-green-100 text-[#16a34a]", Supervisor: "bg-teal-100 text-teal-700",
  Manager: "bg-amber-100 text-amber-700", COUNTRY_MGR: "bg-sky-100 text-sky-700",
  SALES_ADMIN: "bg-purple-100 text-purple-700",
};
const CLASS_COLOR: Record<string, string> = {
  CASH_COW: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  GROWTH:   "bg-sky-50 text-sky-700 border-sky-200",
  NEW_LAUNCH:"bg-violet-50 text-violet-700 border-violet-200",
  DECLINING: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Confirm delete dialog ────────────────────────────────────────────────────

const ConfirmDelete = ({ teamName, onConfirm, onCancel }: { teamName: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <LuTrash2 className="w-6 h-6 text-red-500" />
      </div>
      <h2 className="font-black text-[#1a1a1a] text-lg mb-1">Delete Team?</h2>
      <p className="text-gray-500 text-sm mb-5">
        <span className="font-semibold">{teamName}</span> will be deleted. All members will be unassigned. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold" style={{ transition: "background-color 0.15s" }}>Delete</button>
      </div>
    </div>
  </div>
);

// ─── Product panel ────────────────────────────────────────────────────────────

const ProductPanel = ({ team, allProducts, onAdd, onRemove }: {
  team: Team;
  allProducts: Product[];
  onAdd: (productId: string) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}) => {
  const [actioning, setActioning] = useState<string | null>(null);
  const assigned = new Set(team.team_products.map(tp => tp.product_id));
  const unassigned = allProducts.filter(p => !assigned.has(p.id));

  const handle = async (fn: () => Promise<void>, id: string) => {
    setActioning(id);
    await fn().catch(() => {});
    setActioning(null);
  };

  return (
    <div className="border-t border-gray-50 px-5 pb-4 pt-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Products this team sells</p>

      {team.team_products.length === 0 && unassigned.length === 0 && (
        <p className="text-xs text-gray-400 py-2">No products available. Add products in the Products section first.</p>
      )}

      {/* Assigned */}
      <div className="flex flex-wrap gap-2 mb-3">
        {team.team_products.map(tp => (
          <div key={tp.product_id}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${CLASS_COLOR[tp.product.classification] ?? CLASS_COLOR.DECLINING}`}>
            <span>{tp.product.product_name}</span>
            <button
              onClick={() => handle(() => onRemove(tp.product_id), tp.product_id)}
              disabled={actioning === tp.product_id}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40 focus-visible:outline-none"
              title="Remove from team">
              <LuX className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {team.team_products.length === 0 && <span className="text-xs text-gray-400 italic">No products assigned yet</span>}
      </div>

      {/* Unassigned products to add */}
      {unassigned.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Add product</p>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map(p => (
              <button
                key={p.id}
                onClick={() => handle(() => onAdd(p.id), p.id)}
                disabled={actioning === p.id}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-40"
                style={{ transition: "color 0.12s, border-color 0.12s" }}>
                <FaPlus className="w-2.5 h-2.5" /> {p.product_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Territory helpers ────────────────────────────────────────────────────────

const TERR_TYPE_CFG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  TOWN:      { label: "Town",      bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-400"    },
  UPCOUNTRY: { label: "Upcountry", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400"  },
  REGIONAL:  { label: "Regional",  bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   dot: "bg-teal-400"   },
};
const NONE_CFG = { label: "—", bg: "bg-gray-100", text: "text-gray-400", border: "border-gray-200", dot: "bg-gray-300" };

const TerritoryBadge = ({ t }: { t: TerritoryRef | null | undefined }) => {
  if (!t) return <span className="text-[10px] text-gray-300 italic">No territory</span>;
  const cfg = TERR_TYPE_CFG[t.territory_type] ?? NONE_CFG;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t.name}
    </span>
  );
};

// ─── Member assignment ────────────────────────────────────────────────────────

const MemberPanel = ({ team, allUsers, territories, onAssign, onUnassign, onTerritoryChange }: {
  team: Team;
  allUsers: CompanyUser[];
  territories: Territory[];
  onAssign: (userId: string) => Promise<void>;
  onUnassign: (userId: string) => Promise<void>;
  onTerritoryChange: (userId: string, field: "territory_id" | "secondary_territory_id", value: string | null) => Promise<void>;
}) => {
  const [actioning, setActioning] = useState<string | null>(null);
  const [editing, setEditing]     = useState<string | null>(null); // userId whose territory selects are open

  const memberIds = new Set(team.users.map(u => u.id));
  const available = allUsers.filter(u => !memberIds.has(u.id) && ["MedicalRep", "Supervisor"].includes(u.role));

  const handle = async (fn: () => Promise<void>, id: string) => {
    setActioning(id); await fn().catch(() => {}); setActioning(null);
  };

  // Group members by primary territory type
  const groups: { key: string; label: string; emoji: string; members: TeamMember[] }[] = [
    { key: "TOWN",      label: "Town Reps",      emoji: "🏙️", members: team.users.filter(m => m.territory?.territory_type === "TOWN") },
    { key: "UPCOUNTRY", label: "Upcountry Reps", emoji: "🌿", members: team.users.filter(m => m.territory?.territory_type === "UPCOUNTRY") },
    { key: "REGIONAL",  label: "Regional Reps",  emoji: "🗺️", members: team.users.filter(m => m.territory?.territory_type === "REGIONAL") },
    { key: "NONE",      label: "No Territory",   emoji: "⚠️", members: team.users.filter(m => !m.territory) },
  ].filter(g => g.members.length > 0);

  return (
    <div className="border-t border-gray-50 px-5 pb-4 pt-3 flex flex-col gap-4">

      {team.users.length === 0 && (
        <p className="text-xs text-gray-400 italic">No members yet — add someone below</p>
      )}

      {/* Grouped member rows */}
      {groups.map(g => {
        const cfg = TERR_TYPE_CFG[g.key] ?? NONE_CFG;
        return (
          <div key={g.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{g.emoji}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {g.label}
              </span>
              <span className="text-[10px] text-gray-300">{g.members.length}</span>
            </div>

            <div className="flex flex-col gap-1">
              {g.members.map(m => {
                const isEditing = editing === m.id;
                return (
                  <div key={m.id} className={`rounded-xl border px-3 py-2.5 ${isEditing ? "border-[#16a34a]/30 bg-[#f0fdf4]" : "border-gray-100 bg-white"}`}>
                    {/* Top row: avatar + name + role + remove */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#16a34a] font-black text-[10px]">{m.firstname[0]}{m.lastname[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a1a1a] truncate">{m.firstname} {m.lastname}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[m.role] ?? "bg-gray-100 text-gray-500"}`}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                      {/* Edit territory toggle */}
                      <button
                        onClick={() => setEditing(isEditing ? null : m.id)}
                        title="Edit territories"
                        className={`w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-[#16a34a] shrink-0 ${isEditing ? "text-[#16a34a]" : ""}`}
                        style={{ transition: "color 0.12s" }}>
                        <LuPencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handle(() => onUnassign(m.id), m.id)}
                        disabled={actioning === m.id}
                        className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-40 shrink-0"
                        style={{ transition: "color 0.12s" }}>
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Territory badges (collapsed view) */}
                    {!isEditing && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-9">
                        <TerritoryBadge t={m.territory} />
                        {m.secondary_territory && (
                          <>
                            <span className="text-[10px] text-gray-300">+</span>
                            <span className="text-[10px] text-gray-400 italic">
                              {m.secondary_territory.name}
                              {" "}
                              <span className="text-gray-300">
                                ({TERR_TYPE_CFG[m.secondary_territory.territory_type]?.label ?? m.secondary_territory.territory_type})
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Inline territory editor */}
                    {isEditing && (
                      <div className="mt-2 pl-9 flex flex-col gap-1.5">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Primary Territory</p>
                          <select
                            defaultValue={m.territory?.id ?? ""}
                            onChange={e => handle(() => onTerritoryChange(m.id, "territory_id", e.target.value || null), `t-${m.id}`)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
                          >
                            <option value="">No territory</option>
                            {territories.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({TERR_TYPE_CFG[t.territory_type]?.label ?? t.territory_type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                            Secondary / Floating Territory
                            <span className="ml-1 font-normal normal-case text-gray-300">e.g. monthly upcountry block</span>
                          </p>
                          <select
                            defaultValue={m.secondary_territory?.id ?? ""}
                            onChange={e => handle(() => onTerritoryChange(m.id, "secondary_territory_id", e.target.value || null), `st-${m.id}`)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
                          >
                            <option value="">None</option>
                            {territories.filter(t => t.id !== m.territory?.id).map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({TERR_TYPE_CFG[t.territory_type]?.label ?? t.territory_type})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add unassigned reps */}
      {available.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Add member</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map(u => (
              <button
                key={u.id}
                onClick={() => handle(() => onAssign(u.id), u.id)}
                disabled={actioning === u.id}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-40"
                style={{ transition: "color 0.12s, border-color 0.12s" }}>
                <FaPlus className="w-2.5 h-2.5" />
                {u.firstname} {u.lastname}
                <span className={`ml-1 text-[9px] font-bold px-1 py-0.5 rounded-full ${ROLE_COLOR[u.role] ?? ""}`}>{ROLE_LABEL[u.role]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Teams = () => {
  const [teams, setTeams]           = useState<Team[]>([]);
  const [users, setUsers]           = useState<CompanyUser[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading]       = useState(true);

  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [expandedTab, setExpandedTab] = useState<Record<string, "members" | "products" | "supervisor">>({});

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // Rename inline
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameVal, setRenameVal]       = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError]   = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([getCompanyTeamsApi(), getCompanyUsersApi(), getCompanyProductsApi(), getTerritoriesApi()]).then(([t, u, p, terr]) => {
      if (t.status === "fulfilled") setTeams(t.value.data?.data ?? []);
      if (u.status === "fulfilled") setUsers(u.value.data?.data ?? u.value.data ?? []);
      if (p.status === "fulfilled") setProducts(p.value.data?.data ?? p.value.data ?? []);
      if (terr.status === "fulfilled") setTerritories(terr.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (!expandedTab[id]) setExpandedTab(t => ({ ...t, [id]: "members" }));
      return next;
    });
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) { setCreateError("Team name is required"); return; }
    setCreating(true); setCreateError("");
    try {
      const res = await createCompanyTeamApi(newName.trim());
      setTeams(prev => [...prev, res.data.data]);
      setNewName(""); setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || "Failed to create team");
    } finally { setCreating(false); }
  };

  // ── Rename ──────────────────────────────────────────────────────────────────
  const handleRename = async (id: string) => {
    if (!renameVal.trim()) return;
    setRenameSaving(true);
    setRenameError("");
    try {
      const res = await renameCompanyTeamApi(id, renameVal.trim());
      // Spread full server response so supervisor/products stay in sync
      setTeams(prev => prev.map(t => t.id === id ? { ...t, ...res.data.data } : t));
      setRenamingId(null);
    } catch (err: any) {
      setRenameError(err.response?.data?.error || "Failed to rename — please try again");
    } finally {
      setRenameSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompanyTeamApi(deleteTarget.id);
      setTeams(prev => prev.filter(t => t.id !== deleteTarget.id));
      // Update users list — unassign members
      setUsers(prev => prev.map(u => u.team?.id === deleteTarget.id ? { ...u, team: null } : u));
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  // ── Products ────────────────────────────────────────────────────────────────
  const handleAddProduct = async (teamId: string, productId: string) => {
    const res = await addTeamProductApi(teamId, productId);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, team_products: [...t.team_products, res.data.data] } : t));
  };
  const handleRemoveProduct = async (teamId: string, productId: string) => {
    await removeTeamProductApi(teamId, productId);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, team_products: t.team_products.filter(tp => tp.product_id !== productId) } : t));
  };

  // ── Supervisor ──────────────────────────────────────────────────────────────
  const handleSetSupervisor = async (teamId: string, supervisorId: string | null) => {
    const res = await updateCompanyTeamApi(teamId, { supervisor_id: supervisorId });
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, supervisor: res.data.data.supervisor ?? null, supervisor_id: supervisorId } : t));
  };

  // ── Members ─────────────────────────────────────────────────────────────────
  const handleAssign = async (teamId: string, userId: string) => {
    await updateCompanyUserApi(userId, { team_id: teamId });
    const user = users.find(u => u.id === userId);
    if (user) {
      const team = teams.find(t => t.id === teamId);
      setTeams(prev => prev.map(t => t.id === teamId
        ? { ...t, users: [...t.users, { id: user.id, firstname: user.firstname, lastname: user.lastname, role: user.role, territory: null, secondary_territory: null }] }
        : t
      ));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, team: team ? { id: team.id, team_name: team.team_name } : null } : u));
    }
  };
  const handleUnassign = async (teamId: string, userId: string) => {
    await updateCompanyUserApi(userId, { team_id: null });
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, users: t.users.filter(u => u.id !== userId) } : t));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, team: null } : u));
  };

  const handleTerritoryChange = async (
    teamId: string,
    userId: string,
    field: "territory_id" | "secondary_territory_id",
    value: string | null,
  ) => {
    await updateCompanyUserApi(userId, { [field]: value });
    // Refresh the member's territory in local state from the territories list
    const found = territories.find(t => t.id === value) ?? null;
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      return {
        ...team,
        users: team.users.map(u => {
          if (u.id !== userId) return u;
          if (field === "territory_id") return { ...u, territory: found };
          return { ...u, secondary_territory: found };
        }),
      };
    }));
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalReps  = users.filter(u => u.role === "MedicalRep").length;
  const totalSups  = users.filter(u => u.role === "Supervisor").length;
  const unassigned = users.filter(u => !u.team && ["MedicalRep","Supervisor"].includes(u.role));

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage sales teams, members, and product assignments</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateError(""); setNewName(""); }}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /> New Team
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Teams",         value: teams.length,    color: "text-[#16a34a]",  bg: "bg-[#f0fdf4]",  border: "border-[#dcfce7]" },
          { label: "Total Staff",   value: users.length,    color: "text-gray-700",   bg: "bg-gray-50",     border: "border-gray-200" },
          { label: "Medical Reps",  value: totalReps,       color: "text-teal-600",   bg: "bg-teal-50",     border: "border-teal-200" },
          { label: "Unassigned",    value: unassigned.length, color: unassigned.length > 0 ? "text-amber-600" : "text-gray-500",
            bg: unassigned.length > 0 ? "bg-amber-50" : "bg-gray-50",
            border: unassigned.length > 0 ? "border-amber-200" : "border-gray-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-center justify-between`}>
            <span className="text-xs font-semibold text-gray-500">{s.label}</span>
            {loading ? <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" /> : (
              <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Team list */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-gray-400">
          <FaUsers className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">No teams yet</p>
          <p className="text-sm mt-1">Click "New Team" to create your first sales team</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map(team => {
            const isOpen = expanded.has(team.id);
            const tab    = expandedTab[team.id] ?? "members";
            const repCount = team.users.filter(u => u.role === "MedicalRep").length;
            const supCount = team.users.filter(u => u.role === "Supervisor").length;
            const isRenaming = renamingId === team.id;

            return (
              <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <FaUserGroup className="w-4 h-4 text-[#16a34a]" />
                  </div>

                  {/* Name / rename inline */}
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <div className="flex flex-col gap-1">
                        {renameError && renamingId === team.id && (
                          <p className="text-[10px] text-red-500 font-semibold">{renameError}</p>
                        )}
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e => { setRenameVal(e.target.value); setRenameError(""); }}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(team.id); if (e.key === "Escape") { setRenamingId(null); setRenameError(""); } }}
                          className={`flex-1 text-sm font-semibold rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-[#16a34a]/20 border ${renameError ? "border-red-400" : "border-[#16a34a]"}`}
                        />
                        <button onClick={() => handleRename(team.id)} disabled={renameSaving}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#16a34a] text-white disabled:opacity-50">
                          <LuCheck className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setRenamingId(null); setRenameError(""); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600">
                          <LuX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1a1a1a] text-sm">{team.team_name}</p>
                          <button
                            onClick={() => { setRenamingId(team.id); setRenameVal(team.team_name); }}
                            className="text-gray-300 hover:text-[#16a34a] focus-visible:outline-none"
                            style={{ transition: "color 0.12s" }}>
                            <LuPencil className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Created {format(new Date(team.date_of_creation), "dd MMM yyyy")}
                          {" · "}{team.users.length} member{team.users.length !== 1 ? "s" : ""}
                          {" · "}{team.team_products.length} product{team.team_products.length !== 1 ? "s" : ""}
                          {team.supervisor && (
                            <span className="ml-1 text-teal-600 font-semibold">
                              · Lead: {team.supervisor.firstname} {team.supervisor.lastname}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Role badges */}
                  {!isRenaming && (
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
                      {team.team_products.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          <FaBoxOpen className="inline w-2.5 h-2.5 mr-0.5" />{team.team_products.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {!isRenaming && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setDeleteTarget(team)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-300 hover:text-red-400 hover:border-red-200"
                        style={{ transition: "color 0.12s, border-color 0.12s" }}
                        title="Delete team">
                        <LuTrash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggle(team.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
                        style={{ transition: "background-color 0.12s" }}>
                        {isOpen ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <>
                    {/* Tab switcher */}
                    <div className="flex gap-1 mx-5 mb-1 bg-gray-50 p-1 rounded-xl">
                      {(["members", "products", "supervisor"] as const).map(t => (
                        <button key={t} onClick={() => setExpandedTab(prev => ({ ...prev, [team.id]: t }))}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize ${
                            tab === t ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"
                          }`}
                          style={{ transition: "background-color 0.12s" }}>
                          {t === "members" ? `Members (${team.users.length})` : t === "products" ? `Products (${team.team_products.length})` : "Lead"}
                        </button>
                      ))}
                    </div>

                    {tab === "members" && (
                      <MemberPanel
                        team={team}
                        allUsers={users}
                        territories={territories}
                        onAssign={userId => handleAssign(team.id, userId)}
                        onUnassign={userId => handleUnassign(team.id, userId)}
                        onTerritoryChange={(userId, field, value) => handleTerritoryChange(team.id, userId, field, value)}
                      />
                    )}
                    {tab === "products" && (
                      <ProductPanel
                        team={team}
                        allProducts={products}
                        onAdd={pid => handleAddProduct(team.id, pid)}
                        onRemove={pid => handleRemoveProduct(team.id, pid)}
                      />
                    )}
                    {tab === "supervisor" && (
                      <div className="border-t border-gray-50 px-5 pb-4 pt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Lead (Supervisor)</p>
                        <select
                          value={team.supervisor_id ?? ""}
                          onChange={e => handleSetSupervisor(team.id, e.target.value || null)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
                        >
                          <option value="">No supervisor assigned</option>
                          {users.filter(u => u.role === "Supervisor").map(u => (
                            <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>
                          ))}
                        </select>
                        {team.supervisor && (
                          <p className="text-xs text-teal-600 font-semibold mt-2">
                            {team.supervisor.firstname} {team.supervisor.lastname} leads this team
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Unassigned staff section */}
          {unassigned.length > 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 overflow-hidden">
              <button onClick={() => toggle("__unassigned__")}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 focus-visible:outline-none text-left"
                style={{ transition: "background-color 0.15s" }}>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <FaUserGroup className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-600 text-sm">Unassigned</p>
                  <p className="text-xs text-gray-400 mt-0.5">{unassigned.length} member{unassigned.length !== 1 ? "s" : ""} without a team</p>
                </div>
                {expanded.has("__unassigned__")
                  ? <LuChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
                  : <LuChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                }
              </button>
              {expanded.has("__unassigned__") && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {unassigned.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <span className="text-amber-600 font-black text-xs">{m.firstname[0]}{m.lastname[0]}</span>
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

      {/* Create team modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#1a1a1a] text-lg">New Team</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            {createError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl mb-3">{createError}</div>}
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Team Name</label>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
              placeholder="e.g. Kampala Central Team"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60"
                style={{ transition: "background-color 0.15s" }}>
                {creating ? "Creating…" : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDelete
          teamName={deleteTarget.team_name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Teams;
