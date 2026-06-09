import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { FaXmark, FaMagnifyingGlass, FaUserPlus, FaKey, FaCopy } from "react-icons/fa6";
import { FiUserPlus, FiSearch } from "react-icons/fi";
import { searchUsersApi, getCompanyTeamsApi, addUserToCompanyApi, createCompanyUserApi } from "../../services/api";
import api from "../../services/api";

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
  Supervisor:   [{ value: "MedicalRep", label: "Medical Rep" }],
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-gray-800 text-white",
  SALES_ADMIN: "bg-purple-100 text-purple-700",
  COUNTRY_MGR: "bg-sky-100 text-sky-700",
  Manager:     "bg-amber-100 text-amber-700",
  Supervisor:  "bg-teal-100 text-teal-700",
  MedicalRep:  "bg-green-100 text-[#16a34a]",
  USER:        "bg-gray-100 text-gray-500",
};

const GENDERS = ["MALE", "FEMALE", "OTHER"];

interface UserResult {
  id: string; username: string; firstname: string; lastname: string;
  role: string; company_id: string | null; company?: { company_name: string } | null;
}
interface Team { id: string; team_name: string; }
interface Props {
  actorRole: string;
  onClose: () => void;
  onSuccess: () => void;
  defaultRole?: string;
  title?: string;
  companyId?: string;
}

// Generate a simple temp password: Xxxx + 4 digits
const genTempPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  return (
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    digits[Math.floor(Math.random() * digits.length)]
  );
};

const AddUserModal = ({ actorRole, onClose, onSuccess, defaultRole, title = "Add User to Company", companyId: companyIdProp }: Props) => {
  const authUser: any = useSelector((s: any) => s.auth?.user);
  // Resolved company ID: prop → Redux state → API fetch (handles stale persisted state)
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | undefined>(
    companyIdProp ?? authUser?.company_id ?? undefined
  );

  useEffect(() => {
    if (!resolvedCompanyId) {
      api.get("/auth/me")
        .then((r) => { const cid = r.data?.data?.company_id; if (cid) setResolvedCompanyId(cid); })
        .catch(() => {});
    }
  }, []);

  const companyId = resolvedCompanyId;
  const [tab, setTab] = useState<"existing" | "new">("existing");

  // — Existing user tab —
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [role, setRole]         = useState(defaultRole ?? "");
  const [teamId, setTeamId]     = useState("");
  const [teams, setTeams]       = useState<Team[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // — New user tab —
  const [newForm, setNewForm] = useState({
    firstname: "", lastname: "", email: "", username: "",
    role: defaultRole ?? "", gender: "MALE", contact: "",
  });
  const [tempPassword] = useState(genTempPassword);
  const [copied, setCopied] = useState(false);

  // — Shared —
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [done, setDone]               = useState<{ name: string; password: string } | null>(null);
  const [requiresTeams, setRequiresTeams]       = useState(false);
  const [repLimitWarning, setRepLimitWarning]   = useState<string | null>(null);

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

  const handleAddExisting = async () => {
    if (!selected || !role) { setError("Select a user and a role"); return; }
    setSaving(true); setError("");
    try {
      const res = await addUserToCompanyApi({ userId: selected.id, role, ...(teamId ? { team_id: teamId } : {}), ...(companyId ? { company_id: companyId } : {}) });
      onSuccess();
      if (res.data?.requires_teams) {
        setRequiresTeams(true);
      } else if (res.data?.rep_limit_warning) {
        setRepLimitWarning(res.data.rep_limit_warning);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add user");
    } finally { setSaving(false); }
  };

  const handleCreateNew = async () => {
    const { firstname, lastname, email, username, role: newRole, gender } = newForm;
    if (!firstname || !lastname || !email || !username || !newRole) {
      setError("All fields except contact are required"); return;
    }
    if (!companyId) { setError("No company selected"); return; }
    setSaving(true); setError("");
    try {
      await createCompanyUserApi({
        firstname, lastname, email, username,
        password: tempPassword,
        role: newRole,
        gender: gender as "MALE" | "FEMALE" | "OTHER",
        contact: newForm.contact || undefined,
        company_id: companyId,
        must_reset_password: true,
      });
      setDone({ name: `${firstname} ${lastname}`, password: tempPassword });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create user");
    } finally { setSaving(false); }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Warning: rep added but plan limit exceeded — accept this month, upgrade next
  if (repLimitWarning) return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-poppins-bold text-gray-900">Rep Added — Plan Limit Reached</h3>
          <p className="text-sm font-poppins text-gray-500 leading-relaxed">{repLimitWarning}</p>
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-poppins-bold hover:bg-[#15803d] transition-colors">
          OK — I'll upgrade the plan
        </button>
      </div>
    </div>
  );

  // Warning: company now has 2+ supervisors but no teams
  if (requiresTeams) return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="text-center">
          <p className="font-poppins-bold text-[#1a2530] text-base">Teams Required</p>
          <p className="text-sm font-poppins text-gray-500 mt-2 leading-relaxed">
            Your company now has <strong>2 or more supervisors</strong>. Please create teams and assign each supervisor to a team so reps know who manages them.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onClose}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-poppins-semibold py-2.5 rounded-xl text-sm"
            style={{ transition: "background-color 0.15s" }}>
            OK — I'll create teams now
          </button>
          <button onClick={onClose}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-poppins py-2.5 rounded-xl text-sm"
            style={{ transition: "background-color 0.15s" }}>
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );

  // Success state after creating new user
  if (done) return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <FaUserPlus className="w-6 h-6 text-[#16a34a]" />
        </div>
        <div>
          <p className="font-poppins-bold text-[#1a2530] text-lg">{done.name} added</p>
          <p className="text-xs font-poppins text-gray-500 mt-1">Share this temporary password with them. They will be asked to change it on first login.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <FaKey className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="flex-1 font-mono text-sm font-bold text-[#1a2530] tracking-widest">{done.password}</span>
          <button onClick={() => { navigator.clipboard.writeText(done.password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="shrink-0 text-[#16a34a] hover:text-[#15803d] focus-visible:outline-none">
            {copied ? <FiUserPlus className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={onClose}
          className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-poppins-semibold py-2.5 rounded-xl text-sm"
          style={{ transition: "background-color 0.15s" }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#16a34a]/10 rounded-lg flex items-center justify-center">
              <FaUserPlus className="w-3.5 h-3.5 text-[#16a34a]" />
            </div>
            <h2 className="font-poppins-extrabold text-[#1a2530] text-base tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([["existing", FiSearch, "Existing User"], ["new", FiUserPlus, "Create New"]] as const).map(([t, Icon, label]) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-poppins-semibold border-b-2 transition-colors ${
                tab === t ? "border-[#16a34a] text-[#16a34a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              style={{ transition: "color 0.15s, border-color 0.15s" }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

          {tab === "existing" ? (
            <>
              {/* Search */}
              {!selected ? (
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Search by username</label>
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
                      placeholder="Type a username…" autoFocus
                      className="w-full font-poppins text-sm pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                  </div>
                  {searching && <p className="text-xs font-poppins text-gray-400 mt-2">Searching…</p>}
                  {!searching && results.length === 0 && q.length >= 2 && (
                    <p className="text-xs font-poppins text-gray-400 mt-2">No users found — try "Create New" to add them.</p>
                  )}
                  {results.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {results.map((u) => (
                        <button key={u.id} onClick={() => { setSelected(u); setQ(""); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100 text-left focus-visible:outline-none">
                          <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#16a34a] font-poppins text-xs">{u.firstname[0]}{u.lastname[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-poppins-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                            <p className="text-xs font-poppins text-gray-400 truncate">@{u.username}{u.company ? ` · ${u.company.company_name}` : " · No company"}</p>
                          </div>
                          <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-500"}`}>{u.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#16a34a] flex items-center justify-center shrink-0">
                    <span className="text-white font-poppins-bold text-xs">{selected.firstname[0]}{selected.lastname[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-poppins-bold text-[#1a2530] truncate">{selected.firstname} {selected.lastname}</p>
                    <p className="text-xs font-poppins text-gray-500">@{selected.username}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500 focus-visible:outline-none">
                    <FaXmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Assign Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-poppins border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] bg-white">
                  <option value="">Select role…</option>
                  {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Team */}
              {teams.length > 0 && (
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Assign to Team <span className="font-normal text-gray-400">(optional)</span></label>
                  <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-poppins border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] bg-white">
                    <option value="">No team yet</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-poppins-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddExisting} disabled={saving || !selected || !role}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-bold disabled:opacity-50"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Adding…" : "Add to Company"}
                </button>
              </div>
            </>
          ) : (
            /* ── Create New User tab ── */
            <>
              <div className="grid grid-cols-2 gap-3">
                {(["firstname", "lastname"] as const).map((f) => (
                  <div key={f}>
                    <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">{f === "firstname" ? "First name" : "Last name"} *</label>
                    <input type="text" value={newForm[f]}
                      onChange={(e) => setNewForm(p => ({ ...p, [f]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Email *</label>
                <input type="email" value={newForm.email}
                  onChange={(e) => setNewForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Username *</label>
                  <input type="text" value={newForm.username}
                    onChange={(e) => setNewForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
                </div>
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Contact</label>
                  <input type="text" value={newForm.contact}
                    onChange={(e) => setNewForm(p => ({ ...p, contact: e.target.value }))}
                    placeholder="07xx…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Role *</label>
                  <select value={newForm.role} onChange={(e) => setNewForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white">
                    <option value="">Select…</option>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Gender *</label>
                  <select value={newForm.gender} onChange={(e) => setNewForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white">
                    {GENDERS.map((g) => <option key={g} value={g}>{g[0] + g.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* Temp password preview */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-poppins-semibold text-amber-700 mb-1.5">Temporary password (auto-generated)</p>
                <div className="flex items-center gap-2">
                  <FaKey className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="flex-1 font-mono text-sm font-bold text-amber-900 tracking-widest">{tempPassword}</span>
                  <button onClick={copyPassword}
                    className="shrink-0 text-amber-600 hover:text-amber-800 focus-visible:outline-none">
                    <FaCopy className="w-3.5 h-3.5" />
                  </button>
                  {copied && <span className="text-[11px] text-amber-600 font-poppins-semibold">Copied!</span>}
                </div>
                <p className="text-[11px] font-poppins text-amber-600 mt-1.5">Share this with the employee. They must change it on first login.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-poppins-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleCreateNew} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-bold disabled:opacity-50"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Creating…" : "Create & Add"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
