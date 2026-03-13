import { useState, useEffect } from "react";
import { FaBuilding, FaUsers, FaStethoscope, FaUserSlash, FaUserPlus } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { getPlatformStatsApi, getUnassignedUsersApi, addUserToCompanyApi, getAllCompaniesApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface Stats { companies: number; totalUsers: number; totalReps: number; unassigned: number; }
interface UnassignedUser { id: string; username: string; firstname: string; lastname: string; role: string; email: string; date_of_joining: string; }

const ROLE_COLOR: Record<string, string> = {
  MedicalRep: "bg-green-50 text-[#16a34a]",
  Supervisor: "bg-teal-50 text-teal-700",
  Manager:    "bg-amber-50 text-amber-700",
  USER:       "bg-gray-100 text-gray-500",
};

const StatCard = ({ to, icon: Icon, value, label, sub, color }: { to?: string; icon: any; value: number | null; label: string; sub: string; color: string; }) => {
  const inner = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] p-4 sm:p-5 flex items-center gap-4 ${to ? "hover:border-[#16a34a]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]" : ""}`}
      style={to ? { transition: "border-color 0.15s" } : undefined}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-[#1a2530] leading-none">{value ?? <span className="text-gray-300">—</span>}</p>
        <p className="text-sm font-semibold text-[#1a2530] mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const SuperAdminDashboard = () => {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [unassigned, setUnassigned] = useState<UnassignedUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [addTarget, setAddTarget]   = useState<UnassignedUser | null>(null);
  const [companies, setCompanies]   = useState<{ id: string; company_name: string }[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      getPlatformStatsApi(),
      getUnassignedUsersApi(),
      getAllCompaniesApi(),
    ])
      .then(([s, u, c]) => {
        setStats(s.data.data);
        setUnassigned(u.data.data ?? []);
        setCompanies(c.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Platform Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live stats across all KibagRep companies</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard to="/super-admin/companies" icon={FaBuilding}     value={stats?.companies ?? null}   label="Companies"    sub="Active tenants"     color="bg-[#16a34a]/10 text-[#16a34a]" />
        <StatCard                              icon={FaUsers}        value={stats?.totalUsers ?? null}  label="Total Users"  sub="All roles"          color="bg-sky-50 text-sky-600" />
        <StatCard                              icon={FaStethoscope}  value={stats?.totalReps ?? null}   label="Medical Reps" sub="In field"           color="bg-teal-50 text-teal-600" />
        <StatCard to="/super-admin/users"      icon={FaUserSlash}    value={stats?.unassigned ?? null}  label="Unassigned"   sub="No company yet"     color={stats?.unassigned ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"} />
      </div>

      {/* Unassigned users */}
      {!loading && unassigned.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-[0_2px_12px_0_rgba(217,119,6,0.08)] overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-bold text-[#1a2530]">Unassigned Users</h2>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{unassigned.length}</span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">Signed up but not linked to a company</p>
          </div>
          <div className="divide-y divide-gray-50">
            {unassigned.slice(0, 8).map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/30">
                <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#16a34a] font-black text-xs">{u.firstname[0]}{u.lastname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                  <p className="text-xs text-gray-400 truncate">@{u.username} · {u.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                  {u.role}
                </span>
                {companies.length > 0 && (
                  <button onClick={() => setAddTarget(u)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#16a34a] hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 shrink-0 focus-visible:outline-none"
                    style={{ transition: "background-color 0.15s" }}>
                    <FaUserPlus className="w-3 h-3" /><span className="hidden sm:inline">Assign</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          {unassigned.length > 8 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <Link to="/super-admin/users" className="text-xs font-semibold text-[#16a34a] hover:underline focus-visible:outline-none">
                View all {unassigned.length} unassigned users →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick start guide */}
      <div className="bg-[#0f2318] rounded-2xl p-5">
        <p className="text-white font-bold text-sm">Quick start guide</p>
        <ol className="mt-3 flex flex-col gap-2">
          {[
            "Create a company → Companies tab",
            "Click 'Add User' on the company → assign Country Manager",
            "Country Manager logs in → adds Company Admin + Managers",
            "Company Admin handles reps + supervisors via Team Members",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#16a34a] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-white/70 text-xs leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Assign modal — pre-selected user, SUPER_ADMIN picks company */}
      {addTarget && (
        <AddUserModal
          actorRole="SUPER_ADMIN"
          defaultRole={addTarget.role === "MedicalRep" ? "MedicalRep" : "COUNTRY_MGR"}
          title={`Assign ${addTarget.firstname} to a Company`}
          onClose={() => setAddTarget(null)}
          onSuccess={() => { setAddTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
