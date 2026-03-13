import { useState, useEffect, useRef } from "react";
import { FaXmark, FaMagnifyingGlass, FaUserPlus } from "react-icons/fa6";
import { searchUsersApi, getCompanyTeamsApi, addUserToCompanyApi } from "../../services/api";

// COUNTRY_MGR is head of company; SALES_ADMIN (Company Admin) is their ops support
const ASSIGNABLE_ROLES: Record<string, { value: string; label: string }[]> = {
  SUPER_ADMIN:  [
    { value: "COUNTRY_MGR", label: "Country Manager" },
    { value: "SALES_ADMIN", label: "Company Admin" },
    { value: "Manager",     label: "Manager" },
    { value: "Supervisor",  label: "Supervisor" },
    { value: "MedicalRep",  label: "Medical Rep" },
  ],
  COUNTRY_MGR:  [
    { value: "SALES_ADMIN", label: "Company Admin" },
    { value: "Manager",     label: "Manager" },
    { value: "Supervisor",  label: "Supervisor" },
    { value: "MedicalRep",  label: "Medical Rep" },
  ],
  SALES_ADMIN:  [
    { value: "Manager",    label: "Manager" },
    { value: "Supervisor", label: "Supervisor" },
    { value: "MedicalRep", label: "Medical Rep" },
  ],
  Manager:      [
    { value: "Supervisor", label: "Supervisor" },
    { value: "MedicalRep", label: "Medical Rep" },
  ],
  Supervisor:   [
    { value: "MedicalRep", label: "Medical Rep" },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:  "bg-gray-800 text-white",
  SALES_ADMIN:  "bg-purple-100 text-purple-700",
  COUNTRY_MGR:  "bg-sky-100 text-sky-700",
  Manager:      "bg-amber-100 text-amber-700",
  Supervisor:   "bg-teal-100 text-teal-700",
  MedicalRep:   "bg-green-100 text-[#16a34a]",
  USER:         "bg-gray-100 text-gray-500",
};

interface UserResult {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  role: string;
  company_id: string | null;
  company?: { company_name: string } | null;
}

interface Team { id: string; team_name: string; }

interface Props {
  actorRole: string;       // the logged-in user's role
  onClose: () => void;
  onSuccess: () => void;
  defaultRole?: string;    // pre-select a role
  title?: string;
  companyId?: string;      // for SUPER_ADMIN — which company to add to
}

const AddUserModal = ({ actorRole, onClose, onSuccess, defaultRole, title = "Add User to Company", companyId }: Props) => {
  const [q, setQ]                 = useState("");
  const [results, setResults]     = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<UserResult | null>(null);
  const [teams, setTeams]         = useState<Team[]>([]);
  const [role, setRole]           = useState(defaultRole ?? "");
  const [teamId, setTeamId]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roles = ASSIGNABLE_ROLES[actorRole] ?? [];

  useEffect(() => {
    getCompanyTeamsApi().then((r) => setTeams(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setSearching(true);
      searchUsersApi(q)
        .then((r) => setResults(r.data.data ?? []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
  }, [q]);

  const handleAdd = async () => {
    if (!selected || !role) { setError("Select a user and a role"); return; }
    setSaving(true); setError("");
    try {
      await addUserToCompanyApi({ userId: selected.id, role, ...(teamId ? { team_id: teamId } : {}), ...(companyId ? { company_id: companyId } : {}) });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#16a34a]/10 rounded-lg flex items-center justify-center">
              <FaUserPlus className="w-3.5 h-3.5 text-[#16a34a]" />
            </div>
            <h2 className="font-black text-[#1a2530] text-base tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

          {/* Search */}
          {!selected ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search by username</label>
              <div className="relative">
                <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Type a username…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                  autoFocus
                />
              </div>
              {searching && <p className="text-xs text-gray-400 mt-2">Searching…</p>}
              {!searching && results.length === 0 && q.length >= 2 && (
                <p className="text-xs text-gray-400 mt-2">No users found for "{q}"</p>
              )}
              {results.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {results.map((u) => (
                    <button key={u.id} onClick={() => { setSelected(u); setQ(""); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
                      <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#16a34a] font-black text-xs">{u.firstname[0]}{u.lastname[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                        <p className="text-xs text-gray-400 truncate">@{u.username}{u.company ? ` · ${u.company.company_name}` : " · No company"}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-500"}`}>{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected user card */
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-[#16a34a] flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xs">{selected.firstname[0]}{selected.lastname[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a2530] truncate">{selected.firstname} {selected.lastname}</p>
                <p className="text-xs text-gray-500">@{selected.username}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500 focus-visible:outline-none">
                <FaXmark className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
              <option value="">Select role…</option>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Team (optional) */}
          {teams.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign to Team <span className="font-normal text-gray-400">(optional)</span></label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                <option value="">No team yet</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving || !selected || !role}
              className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}>
              {saving ? "Adding…" : "Add to Company"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
