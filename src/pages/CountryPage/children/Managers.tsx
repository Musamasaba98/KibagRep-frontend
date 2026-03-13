import { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa6";
import { getCompanyUsersApi } from "../../../services/api";
import AddUserModal from "../../../componets/AddUserModal/AddUserModal";

interface CompanyUser {
  id: string; username: string; firstname: string; lastname: string;
  role: string; email: string;
  team?: { id: string; team_name: string } | null;
}

const Managers = () => {
  const [managers, setManagers] = useState<CompanyUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

  const load = () => {
    setLoading(true);
    getCompanyUsersApi()
      .then((r) => setManagers((r.data.data ?? []).filter((u: CompanyUser) => u.role === "Manager")))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="w-full p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Managers</h1>
          <p className="text-gray-400 text-sm mt-0.5">Regional field line managers</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaUserPlus className="w-3.5 h-3.5" /><span>Add Manager</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <p className="font-semibold">No managers yet</p>
            <p className="text-sm mt-1">Use "Add Manager" to assign a manager to your company</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {managers.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-black text-sm">{m.firstname[0]}{m.lastname[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a2530] text-sm">{m.firstname} {m.lastname}</p>
                  <p className="text-xs text-gray-400">@{m.username} · {m.email}</p>
                </div>
                {m.team && (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 shrink-0">
                    {m.team.team_name}
                  </span>
                )}
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Manager</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddUserModal actorRole="COUNTRY_MGR" defaultRole="Manager" title="Add Manager"
          onClose={() => setShowAdd(false)} onSuccess={load} />
      )}
    </div>
  );
};

export default Managers;
