import { useState, useEffect } from "react";
import { FaBuilding, FaPlus, FaXmark, FaUserPlus, FaChevronDown, FaChevronUp, FaTrash } from "react-icons/fa6";
import { getAllCompaniesApi, createCompanyApi, getCompanyUsersByIdApi, removeUserFromCompanyApi, toggleCompanyActiveApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

const ROLE_COLOR: Record<string, string> = {
  COUNTRY_MGR: "bg-sky-100 text-sky-700",
  SALES_ADMIN: "bg-purple-100 text-purple-700",
  Manager:     "bg-amber-100 text-amber-700",
  Supervisor:  "bg-teal-100 text-teal-700",
  MedicalRep:  "bg-green-50 text-[#16a34a]",
};
const ROLE_LABEL: Record<string, string> = {
  COUNTRY_MGR: "Country Mgr", SALES_ADMIN: "Co. Admin",
  Manager: "Manager", Supervisor: "Supervisor", MedicalRep: "Medical Rep",
};

interface User { id: string; username: string; firstname: string; lastname: string; role: string; email: string; }
interface Company { id: string; company_name: string; location: string; date_of_joining: string; is_active: boolean; _count?: { users: number; products: number }; }

// ── Per-company card with expandable user list ─────────────────────────────────
const CompanyCard = ({ c, onRefresh }: { c: Company; onRefresh: () => void }) => {
  const [expanded, setExpanded]   = useState(false);
  const [users, setUsers]         = useState<User[]>([]);
  const [loadingU, setLoadingU]   = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [toggling, setToggling]   = useState(false);

  const handleToggleActive = async () => {
    setToggling(true);
    try { await toggleCompanyActiveApi(c.id); onRefresh(); }
    catch { alert("Failed to update company status"); }
    finally { setToggling(false); }
  };

  const loadUsers = () => {
    setLoadingU(true);
    getCompanyUsersByIdApi(c.id)
      .then(r => setUsers(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingU(false));
  };

  const toggle = () => { if (!expanded) loadUsers(); setExpanded(v => !v); };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from ${c.company_name}?`)) return;
    try { await removeUserFromCompanyApi(userId); loadUsers(); onRefresh(); }
    catch { alert("Failed to remove"); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden ${c.is_active ? "border-gray-100" : "border-red-100 opacity-70"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.is_active ? "bg-[#16a34a]/10" : "bg-red-50"}`}>
          <FaBuilding className={`w-4 h-4 ${c.is_active ? "text-[#16a34a]" : "text-red-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[#1a2530] text-sm truncate">{c.company_name}</p>
            {!c.is_active && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Suspended</span>}
          </div>
          <p className="text-xs text-gray-400 truncate">
            {c.location} · {c._count?.users ?? 0} users · {c._count?.products ?? 0} products
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 focus-visible:outline-none"
            style={{ transition: "background-color 0.15s" }}>
            <FaUserPlus className="w-3 h-3" />
            <span className="hidden sm:inline">Add User</span>
          </button>
          <button onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 focus-visible:outline-none">
            {expanded ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
          </button>
          {/* Active toggle */}
          <button onClick={handleToggleActive} disabled={toggling}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border focus-visible:outline-none disabled:opacity-50 ${
              c.is_active
                ? "border-red-200 text-red-500 hover:bg-red-50"
                : "border-green-200 text-[#16a34a] hover:bg-green-50"
            }`}
            style={{ transition: "background-color 0.15s" }}>
            {toggling ? "…" : c.is_active ? "Suspend" : "Activate"}
          </button>
        </div>
      </div>

      {/* Expandable user list */}
      {expanded && (
        <div className="border-t border-gray-50">
          {loadingU ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-400">No users yet</p>
              <button onClick={() => setShowAdd(true)}
                className="mt-1 text-xs text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">
                Add the first user
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50">
                  <div className="w-7 h-7 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-black text-[10px]">{u.firstname[0]}{u.lastname[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                    <p className="text-[10px] text-gray-400 truncate">@{u.username}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <button onClick={() => handleRemove(u.id, `${u.firstname} ${u.lastname}`)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg focus-visible:outline-none shrink-0">
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddUserModal actorRole="SUPER_ADMIN" defaultRole="COUNTRY_MGR"
          title={`Add User — ${c.company_name}`} companyId={c.id}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadUsers(); onRefresh(); }} />
      )}
    </div>
  );
};

// ── Main Companies page ────────────────────────────────────────────────────────
const Companies = () => {
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ company_name: "", location: "" });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  const load = () => {
    setLoading(true);
    getAllCompaniesApi()
      .then(r => setCompanies(r.data.data ?? []))
      .catch(() => setError("Failed to load companies"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.company_name.trim() || !form.location.trim()) { setFormError("Both fields required"); return; }
    setSaving(true);
    try {
      await createCompanyApi({ company_name: form.company_name.trim(), location: form.location.trim() });
      setShowCreate(false); setForm({ company_name: "", location: "" }); load();
    } catch (err: any) { setFormError(err.response?.data?.error || "Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Companies</h1>
          <p className="text-sm text-gray-400 mt-0.5">{companies.length} on the platform</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>New Company</span>
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-gray-400">
          <FaBuilding className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">No companies yet</p>
          <p className="text-sm mt-1">Create your first company above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map(c => <CompanyCard key={c.id} c={c} onRefresh={load} />)}
        </div>
      )}

      {/* Create Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Create Company</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 flex flex-col gap-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{formError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company Name</label>
                <input type="text" required value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="e.g. Veeram Uganda Ltd"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location / HQ</label>
                <input type="text" required value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Kampala, Uganda"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Creating…" : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
