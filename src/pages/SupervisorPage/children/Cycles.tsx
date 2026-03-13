import { useEffect, useState } from "react";
import { IoCalendarOutline } from "react-icons/io5";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { format } from "date-fns";
import { getPendingCyclesApi, approveCycleApi, rejectCycleApi } from "../../../services/api";

interface PendingCycle {
  id: string;
  month: number;
  year: number;
  status: string;
  user: { id: string; firstname: string; lastname: string };
  items: Array<{ id: string; tier: string; frequency: number; doctor: { doctor_name: string } }>;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const Cycles = () => {
  const [cycles, setCycles] = useState<PendingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPendingCyclesApi()
      .then((res) => setCycles(res.data?.data ?? []))
      .catch(() => setError("Failed to load pending cycles"))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveCycleApi(id);
      setCycles((p) => p.filter((c) => c.id !== id));
    } catch {
      setError("Failed to approve cycle.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejection:");
    if (!note) return;
    setActioning(id);
    try {
      await rejectCycleApi(id, note);
      setCycles((p) => p.filter((c) => c.id !== id));
    } catch {
      setError("Failed to reject cycle.");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Call Cycles</h1>
        <p className="text-gray-400 text-sm mt-0.5">Rep call cycles pending your approval</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-100">
          <IoCalendarOutline className="w-5 h-5 text-violet-500" />
          <div className="flex-1">
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Pending Call Cycles</h2>
            <p className="text-xs text-gray-400">Review and approve rep monthly doctor plans</p>
          </div>
          {!loading && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-600">
              {cycles.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : cycles.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No pending call cycles.</p>
        ) : (
          <div className="flex flex-col divide-y divide-violet-50">
            {cycles.map((cycle) => {
              const isActioning = actioning === cycle.id;
              return (
                <div key={cycle.id} className="px-6 py-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#1a1a1a] text-sm">
                        {cycle.user.firstname} {cycle.user.lastname}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {MONTHS[cycle.month - 1]} {cycle.year} · {cycle.items.length} doctors
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActioning ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(cycle.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(cycle.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                          >
                            <FiXCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cycle.items.slice(0, 6).map((item) => (
                      <span
                        key={item.id}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600"
                      >
                        {item.doctor.doctor_name} · Tier {item.tier} · {item.frequency}×/mo
                      </span>
                    ))}
                    {cycle.items.length > 6 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400">
                        +{cycle.items.length - 6} more
                      </span>
                    )}
                  </div>
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
