import { useEffect, useState } from "react";
import { IoCalendarOutline } from "react-icons/io5";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";
import { format } from "date-fns";
import { getPendingCyclesApi, approveCycleApi, rejectCycleApi } from "../../../services/api";

const RejectInput = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
      style={{ transition: "background-color 0.15s" }}>
      <FiXCircle className="w-3.5 h-3.5" /> Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus type="text" value={note} onChange={e => setNote(e.target.value)}
        placeholder="Reason…"
        className="flex-1 text-xs border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 min-w-[120px]" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
        style={{ transition: "opacity 0.15s" }}>Send</button>
      <button onClick={() => setOpen(false)} className="text-xs font-poppins text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
};

interface ApproverUser { id: string; firstname: string; lastname: string; role: string; }

interface Cycle {
  id: string;
  month: number;
  year: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";
  approved_at: string | null;
  review_note: string | null;
  approved_by_user: ApproverUser | null;
  user: { id: string; firstname: string; lastname: string };
  items: Array<{ id: string; tier: string; frequency: number; doctor: { doctor_name: string } }>;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const StatusBadge = ({ cycle }: { cycle: Cycle }) => {
  if (cycle.status === "APPROVED" || cycle.status === "LOCKED") {
    const who = cycle.approved_by_user
      ? `${cycle.approved_by_user.firstname} ${cycle.approved_by_user.lastname}`
      : "a supervisor";
    const when = cycle.approved_at
      ? format(new Date(cycle.approved_at), "d MMM yyyy")
      : null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
        <LuCircleCheck className="w-3.5 h-3.5 text-[#16a34a] flex-shrink-0" />
        <span className="text-xs font-poppins text-[#16a34a]">
          Approved by {who}{when ? ` · ${when}` : ""}
        </span>
      </div>
    );
  }
  if (cycle.status === "REJECTED") {
    const who = cycle.approved_by_user
      ? `${cycle.approved_by_user.firstname} ${cycle.approved_by_user.lastname}`
      : "supervisor";
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
          <LuCircleX className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <span className="text-xs font-poppins text-red-600">Rejected by {who}</span>
        </div>
        {cycle.review_note && (
          <p className="text-[11px] font-poppins text-gray-400 italic max-w-xs text-right">
            "{cycle.review_note}"
          </p>
        )}
      </div>
    );
  }
  return null;
};

const Cycles = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPendingCyclesApi()
      .then((res) => setCycles(res.data?.data ?? []))
      .catch(() => setError("Failed to load call cycles"))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await approveCycleApi(id);
      setCycles((p) => p.map((c) => c.id === id ? { ...c, status: "APPROVED" as const } : c));
    } catch {
      setError("Failed to approve cycle.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string, note: string) => {
    setActioning(id);
    try {
      await rejectCycleApi(id, { note });
      setCycles((p) => p.map((c) => c.id === id ? { ...c, status: "REJECTED" as const, review_note: note } : c));
    } catch {
      setError("Failed to reject cycle.");
    } finally {
      setActioning(null);
    }
  };

  const pendingCount = cycles.filter((c) => c.status === "SUBMITTED").length;

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl tracking-tight">Call Cycles</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Team call cycles — submitted cycles await your approval</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-100">
          <IoCalendarOutline className="w-5 h-5 text-violet-500" />
          <div className="flex-1">
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Call Cycles</h2>
            <p className="text-xs font-poppins text-gray-400">Approved cycles are read-only — only submitted cycles need action</p>
          </div>
          {!loading && pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-poppins-bold bg-violet-100 text-violet-600">
              {pendingCount} pending
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
            <span className="text-sm font-poppins">Loading…</span>
          </div>
        ) : cycles.length === 0 ? (
          <p className="text-center font-poppins text-gray-400 text-sm py-10">No call cycles found.</p>
        ) : (
          <div className="flex flex-col divide-y divide-violet-50">
            {cycles.map((cycle) => {
              const isActioning = actioning === cycle.id;
              const canAct = cycle.status === "SUBMITTED";
              return (
                <div key={cycle.id} className="px-6 py-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-poppins-semibold text-[#1a1a1a] text-sm">
                          {cycle.user.firstname} {cycle.user.lastname}
                        </p>
                        {cycle.status === "DRAFT" && (
                          <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Draft</span>
                        )}
                        {cycle.status === "SUBMITTED" && (
                          <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">Awaiting approval</span>
                        )}
                      </div>
                      <p className="text-xs font-poppins text-gray-400 mt-0.5">
                        {MONTHS[cycle.month - 1]} {cycle.year} · {cycle.items.length} doctors
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActioning ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
                      ) : canAct ? (
                        <>
                          <button
                            onClick={() => handleApprove(cycle.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                            style={{ transition: "background-color 0.15s" }}
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <RejectInput onConfirm={(note) => handleReject(cycle.id, note)} />
                        </>
                      ) : (
                        <StatusBadge cycle={cycle} />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cycle.items.slice(0, 6).map((item) => (
                      <span key={item.id}
                        className="text-[11px] font-poppins px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                        {item.doctor.doctor_name} · Tier {item.tier} · {item.frequency}×/mo
                      </span>
                    ))}
                    {cycle.items.length > 6 && (
                      <span className="text-[11px] font-poppins px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400">
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
