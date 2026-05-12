import { useState, useEffect, useCallback } from "react";
import { FaUsers, FaUserPlus, FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { getAllPlatformUsersApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface PlatformUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  role: string;
  email: string;
  date_of_joining: string;
  company: { id: string; company_name: string } | null;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:  { label: "Super Admin",   color: "bg-purple-50 text-purple-700" },
  COUNTRY_MGR:  { label: "Country Mgr",   color: "bg-sky-50 text-sky-700" },
  SALES_ADMIN:  { label: "Admin",         color: "bg-orange-50 text-orange-700" },
  Manager:      { label: "Manager",       color: "bg-amber-50 text-amber-700" },
  Supervisor:   { label: "Supervisor",    color: "bg-teal-50 text-teal-700" },
  MedicalRep:   { label: "Medical Rep",   color: "bg-green-50 text-[#16a34a]" },
  USER:         { label: "Unassigned",    color: "bg-gray-100 text-gray-500" },
};

const ROLES = ["", "SUPER_ADMIN", "COUNTRY_MGR", "SALES_ADMIN", "Manager", "Supervisor", "MedicalRep", "USER"];

const AllUsers = () => {
  const [users, setUsers]         = useState<PlatformUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [addTarget, setAddTarget] = useState<PlatformUser | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (q.trim())        params.q          = q.trim();
    if (roleFilter)      params.role       = roleFilter;
    if (companyFilter)   params.company_id = companyFilter;
    getAllPlatformUsersApi(params)
      .then(r => setUsers(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, roleFilter, companyFilter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const unassignedCount = users.filter(u => !u.company).length;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">All Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${users.length} users${unassignedCount > 0 ? ` · ${unassignedCount} unassigned` : ""}`}
          </p>
        </div>
        {unassignedCount > 0 && (
          <button
            onClick={() => setCompanyFilter(companyFilter === "unassigned" ? "" : "unassigned")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 focus-visible:outline-none ${
              companyFilter === "unassigned"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
            }`}
            style={{ transition: "background-color 0.15s, color 0.15s" }}
          >
            {unassignedCount} Unassigned
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, email, username…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#16a34a] placeholder-gray-400"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none">
              <FaXmark className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-2 focus:outline-none focus:border-[#16a34a] text-gray-600"
        >
          <option value="">All roles</option>
          {ROLES.filter(r => r).map(r => (
            <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaUsers className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No users found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => {
              const rc = ROLE_CONFIG[u.role] ?? { label: u.role, color: "bg-gray-100 text-gray-500" };
              const initials = `${u.firstname?.[0] ?? ""}${u.lastname?.[0] ?? ""}`.toUpperCase();
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                  <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-black text-xs">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                    <p className="text-xs text-gray-400 truncate">
                      @{u.username}
                      {u.company
                        ? <> · <span className="text-[#16a34a]">{u.company.company_name}</span></>
                        : <> · <span className="text-orange-500">No company</span></>
                      }
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 hidden sm:inline ${rc.color}`}>
                    {rc.label}
                  </span>
                  <p className="text-[10px] text-gray-300 shrink-0 hidden md:block w-20 text-right">
                    {new Date(u.date_of_joining).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  {!u.company && (
                    <button
                      onClick={() => setAddTarget(u)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 shrink-0 focus-visible:outline-none"
                      style={{ transition: "background-color 0.15s" }}
                    >
                      <FaUserPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Assign</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addTarget && (
        <AddUserModal
          actorRole="SUPER_ADMIN"
          defaultRole="COUNTRY_MGR"
          title={`Assign ${addTarget.firstname} ${addTarget.lastname}`}
          onClose={() => setAddTarget(null)}
          onSuccess={() => { setAddTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default AllUsers;
