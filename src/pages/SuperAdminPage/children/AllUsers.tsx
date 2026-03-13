import { useState, useEffect } from "react";
import { FaUserSlash, FaUserPlus } from "react-icons/fa6";
import { getUnassignedUsersApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface UnassignedUser { id: string; username: string; firstname: string; lastname: string; role: string; email: string; date_of_joining: string; }

const ROLE_COLOR: Record<string, string> = {
  MedicalRep: "bg-green-50 text-[#16a34a]",
  Supervisor: "bg-teal-50 text-teal-700",
  Manager:    "bg-amber-50 text-amber-700",
  USER:       "bg-gray-100 text-gray-500",
};

const AllUsers = () => {
  const [users, setUsers]       = useState<UnassignedUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [addTarget, setAddTarget] = useState<UnassignedUser | null>(null);

  const load = () => {
    setLoading(true);
    getUnassignedUsersApi()
      .then(r => setUsers(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Unassigned Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">Users who signed up but aren't linked to any company yet</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaUserSlash className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No unassigned users</p>
            <p className="text-sm mt-1">Everyone is linked to a company</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50">
                <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#16a34a] font-black text-xs">{u.firstname[0]}{u.lastname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{u.firstname} {u.lastname}</p>
                  <p className="text-xs text-gray-400 truncate">@{u.username} · {u.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                  {u.role}
                </span>
                <p className="text-[10px] text-gray-300 shrink-0 hidden sm:block">
                  {new Date(u.date_of_joining).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <button onClick={() => setAddTarget(u)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 shrink-0 focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  <FaUserPlus className="w-3 h-3" /><span className="hidden sm:inline">Assign</span>
                </button>
              </div>
            ))}
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
