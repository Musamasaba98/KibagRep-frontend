import { useState, useEffect } from "react";
import { FaRotate, FaCircleCheck, FaCircleXmark, FaHourglass } from "react-icons/fa6";
import api from "../../../services/api";

type CycleStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface CallCycle {
  id: string;
  month: number;
  year: number;
  status: CycleStatus;
  user: { firstname: string; lastname: string; role: string };
  _count?: { items: number };
  submitted_at?: string;
}

const STATUS_CONFIG: Record<CycleStatus, { label: string; color: string; icon: any }> = {
  DRAFT:     { label: "Draft",     color: "bg-gray-100 text-gray-600",       icon: FaRotate },
  SUBMITTED: { label: "Pending",   color: "bg-amber-100 text-amber-700",     icon: FaHourglass },
  APPROVED:  { label: "Approved",  color: "bg-green-100 text-[#16a34a]",     icon: FaCircleCheck },
  REJECTED:  { label: "Rejected",  color: "bg-red-100 text-red-600",         icon: FaCircleXmark },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const Cycles = () => {
  const [cycles, setCycles]   = useState<CallCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<CycleStatus | "ALL">("ALL");
  const [acting, setActing]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get("/cycle/pending")
      .then(r => setCycles(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} this call cycle?`)) return;
    setActing(id);
    try {
      await api.put(`/cycle/${id}/${action}`);
      load();
    } catch { alert(`Failed to ${action}`); }
    finally { setActing(null); }
  };

  const filtered = filter === "ALL" ? cycles : cycles.filter(c => c.status === filter);

  const counts = { ALL: cycles.length, SUBMITTED: 0, APPROVED: 0, REJECTED: 0, DRAFT: 0 };
  for (const c of cycles) counts[c.status]++;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Call Cycles</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and approve monthly doctor visit plans submitted by reps</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "SUBMITTED", "APPROVED", "REJECTED", "DRAFT"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus-visible:outline-none ${
              filter === s
                ? "bg-[#16a34a] text-white border-[#16a34a]"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={{ transition: "background-color 0.15s" }}>
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaRotate className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No call cycles {filter !== "ALL" ? `with status "${STATUS_CONFIG[filter as CycleStatus]?.label}"` : "yet"}</p>
            <p className="text-sm mt-1">Reps submit their monthly doctor lists for approval here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => {
              const StatusIcon = STATUS_CONFIG[c.status].icon;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                  <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-black text-xs">
                      {c.user.firstname[0]}{c.user.lastname[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2530] truncate">{c.user.firstname} {c.user.lastname}</p>
                    <p className="text-xs text-gray-400">
                      {MONTHS[c.month - 1]} {c.year} · {c._count?.items ?? 0} doctors
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${STATUS_CONFIG[c.status].color}`}>
                    <StatusIcon className="w-2.5 h-2.5" />{STATUS_CONFIG[c.status].label}
                  </span>
                  {c.status === "SUBMITTED" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleAction(c.id, "approve")} disabled={acting === c.id}
                        className="text-[11px] font-bold bg-green-50 hover:bg-green-100 text-[#16a34a] border border-green-200 px-2.5 py-1.5 rounded-lg focus-visible:outline-none disabled:opacity-50"
                        style={{ transition: "background-color 0.15s" }}>
                        Approve
                      </button>
                      <button onClick={() => handleAction(c.id, "reject")} disabled={acting === c.id}
                        className="text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg focus-visible:outline-none disabled:opacity-50"
                        style={{ transition: "background-color 0.15s" }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cycles;
