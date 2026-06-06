import { useState, useEffect, useCallback } from "react";
import { FaUsers, FaUserPlus, FaMagnifyingGlass, FaXmark, FaBuilding, FaEnvelope, FaCalendarDays } from "react-icons/fa6";
import { LuAtSign, LuShieldCheck } from "react-icons/lu";
import { getAllPlatformUsersApi, adminResetPasswordApi } from "../../../services/api";
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

// ─── User detail slide-over ───────────────────────────────────────────────────

const UserDetailPanel = ({
  user, onClose, onAssign,
}: {
  user: PlatformUser;
  onClose: () => void;
  onAssign: () => void;
}) => {
  const [resetPwd,     setResetPwd]     = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting,    setResetting]    = useState(false);
  const [resetError,   setResetError]   = useState("");
  const [resetDone,    setResetDone]    = useState(false);

  const rc       = ROLE_CONFIG[user.role] ?? { label: user.role, color: "bg-gray-100 text-gray-500" };
  const initials = `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase();

  const handleReset = async () => {
    if (!resetPwd)          { setResetError("Enter a new password"); return; }
    if (resetPwd.length < 8) { setResetError("Minimum 8 characters"); return; }
    if (resetPwd !== resetConfirm) { setResetError("Passwords don't match"); return; }
    setResetting(true); setResetError("");
    try {
      await adminResetPasswordApi(user.id, resetPwd);
      setResetDone(true); setResetPwd(""); setResetConfirm("");
    } catch (e: any) {
      setResetError(e.response?.data?.error || "Reset failed — try again");
    } finally { setResetting(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-[−8px_0_40px_0_rgba(0,0,0,0.12)] flex flex-col"
        style={{ boxShadow: "-4px 0 32px 0 rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-[#1a2530]">User Profile</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none"
            style={{ transition: "color 0.12s" }}>
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Avatar + name */}
          <div className="flex flex-col items-center px-5 pt-6 pb-5 border-b border-gray-50">
            <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center mb-3 shrink-0">
              <span className="text-[#16a34a] font-black text-xl">{initials}</span>
            </div>
            <h2 className="text-base font-black text-[#1a2530] text-center">{user.firstname} {user.lastname}</h2>
            <span className={`mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${rc.color}`}>{rc.label}</span>
          </div>

          {/* Details */}
          <div className="px-5 py-4 flex flex-col gap-3 border-b border-gray-50">
            {[
              { Icon: FaEnvelope,     label: "Email",    value: user.email },
              { Icon: LuAtSign,       label: "Username", value: `@${user.username}` },
              { Icon: FaBuilding,     label: "Company",  value: user.company?.company_name ?? null, absent: "No company assigned" },
              { Icon: FaCalendarDays, label: "Joined",   value: new Date(user.date_of_joining).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
            ].map(({ Icon, label, value, absent }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                  {value
                    ? <p className="text-sm font-semibold text-[#1a2530]">{value}</p>
                    : <p className="text-xs text-orange-500 font-semibold">{absent}</p>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {!user.company && (
              <button onClick={onAssign}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]"
                style={{ transition: "background-color 0.15s" }}>
                <FaUserPlus className="w-3.5 h-3.5" /> Assign to Company
              </button>
            )}

            {/* Admin password reset */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <LuShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reset Password</p>
              </div>
              {resetDone && (
                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-xl px-3 py-2 text-xs text-[#16a34a] font-semibold">
                  ✓ Password updated successfully
                </div>
              )}
              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-semibold">
                  {resetError}
                </div>
              )}
              <input
                type="password"
                value={resetPwd}
                onChange={e => { setResetPwd(e.target.value); setResetDone(false); setResetError(""); }}
                placeholder="New password (min. 8 chars)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <input
                type="password"
                value={resetConfirm}
                onChange={e => { setResetConfirm(e.target.value); setResetDone(false); setResetError(""); }}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <button
                onClick={handleReset}
                disabled={resetting || !resetPwd}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold"
                style={{ transition: "background-color 0.15s" }}>
                {resetting ? "Resetting…" : "Set New Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AllUsers = () => {
  const [users, setUsers]         = useState<PlatformUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [addTarget, setAddTarget]       = useState<PlatformUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

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
                <div key={u.id} onClick={() => setSelectedUser(u)}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50 cursor-pointer"
                  style={{ transition: "background-color 0.12s" }}>
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

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAssign={() => { setAddTarget(selectedUser); setSelectedUser(null); }}
        />
      )}
    </div>
  );
};

export default AllUsers;
