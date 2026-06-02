import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentCycleApi, submitCycleApi } from "../../../services/api";
import { format } from "date-fns";
import { FiCheck, FiLock, FiAlertCircle, FiSend } from "react-icons/fi";
import { BsClipboardCheck } from "react-icons/bs";

interface Doctor {
  id: string;
  doctor_name: string;
  town: string;
  location: string;
  speciality: string[];
}

interface CycleItem {
  id: string;
  tier: "A" | "B" | "C";
  list_type?: DoctorListType;
  frequency: number;
  visits_done: number;
  doctor: Doctor;
}

type DoctorListType = "KBL" | "BL" | "FOCUS";

const LIST_TYPE_CONFIG: Record<DoctorListType, { label: string; cls: string }> = {
  KBL:   { label: "KBL",   cls: "bg-amber-50 text-amber-700 border-amber-300" },
  BL:    { label: "BL",    cls: "bg-gray-100 text-gray-500 border-gray-200"   },
  FOCUS: { label: "FOCUS", cls: "bg-violet-50 text-violet-700 border-violet-300" },
};

interface Cycle {
  id: string;
  month: number;
  year: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "LOCKED";
  approved_at: string | null;
  review_note: string | null;
  items: CycleItem[];
}

const TIER_CONFIG = {
  A: { label: "Tier A", bg: "bg-[#dcfce7]", text: "text-[#15803d]", border: "border-[#86efac]", freq: "4×/month" },
  B: { label: "Tier B", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", freq: "2×/month" },
  C: { label: "Tier C", bg: "bg-gray-100",  text: "text-gray-600",   border: "border-gray-200",  freq: "1×/month" },
};

const STATUS_CONFIG = {
  DRAFT:     { label: "Draft",     bg: "bg-gray-100",  text: "text-gray-600",   icon: FiAlertCircle },
  SUBMITTED: { label: "Pending",   bg: "bg-amber-50",  text: "text-amber-700",  icon: FiSend },
  APPROVED:  { label: "Approved",  bg: "bg-[#dcfce7]", text: "text-[#15803d]",  icon: FiCheck },
  LOCKED:    { label: "Locked",    bg: "bg-[#dcfce7]", text: "text-[#15803d]",  icon: FiLock },
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CallCycle = () => {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getCurrentCycleApi()
      .then((res) => setCycle(res.data.data))
      .catch(() => setError("Failed to load call cycle"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!cycle || cycle.status !== "DRAFT") return;
    setSubmitting(true);
    try {
      const res = await submitCycleApi(cycle.id);
      setCycle((prev) => prev ? { ...prev, status: res.data.data.status } : prev);
    } catch {
      setError("Failed to submit cycle");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-400 py-10">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#16a34a] animate-spin" />
        <span className="text-sm font-poppins">Loading call cycle…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 py-8">
        <FiAlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!cycle) return null;

  const statusCfg = STATUS_CONFIG[cycle.status];
  const StatusIcon = statusCfg.icon;
  const canSubmit = cycle.status === "DRAFT" && cycle.items.length > 0;
  const isLocked = cycle.status === "LOCKED" || cycle.status === "APPROVED";

  // Group items by tier
  const byTier: Record<string, CycleItem[]> = { A: [], B: [], C: [] };
  cycle.items.forEach((item) => { byTier[item.tier]?.push(item); });

  // Summary stats
  const totalDoctors = cycle.items.length;
  const totalTargetVisits = cycle.items.reduce((s, i) => s + i.frequency, 0);
  const totalDone = cycle.items.reduce((s, i) => s + i.visits_done, 0);
  const overallPct = totalTargetVisits > 0 ? Math.round((totalDone / totalTargetVisits) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-poppins-bold text-xl tracking-tight text-gray-800">
            Call Cycle — {MONTH_NAMES[cycle.month - 1]} {cycle.year}
          </h1>
          <p className="text-sm font-poppins text-gray-400 mt-0.5">
            {totalDoctors} doctors · {totalTargetVisits} target visits
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`flex items-center gap-1.5 text-[12px] font-poppims-semibold px-3 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </span>

          {/* Submit button */}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 disabled:opacity-60"
              style={{ transition: "opacity 0.15s" }}
            >
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit for Approval"}
            </button>
          )}

          {isLocked && cycle.approved_at && (
            <span className="text-xs font-poppins text-gray-400">
              Approved {format(new Date(cycle.approved_at), "dd MMM")}
            </span>
          )}
        </div>
      </div>

      {/* ── Rejection notice (shown when supervisor sent the cycle back) ── */}
      {cycle.status === "DRAFT" && cycle.review_note && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-poppins-semibold text-red-700">Cycle returned by supervisor</p>
            <p className="text-xs font-poppins text-red-600 mt-0.5">{cycle.review_note}</p>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="bg-white rounded-xl p-4 border-solid border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-poppins-semibold text-gray-700">Monthly progress</span>
          <span className="text-sm font-poppins-bold text-[#16a34a]">{totalDone} / {totalTargetVisits} visits</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${overallPct}%`,
              backgroundColor: overallPct >= 80 ? "#16a34a" : overallPct >= 50 ? "#f59e0b" : "#ef4444",
              transition: "width 0.4s",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] font-poppins text-gray-400">{overallPct}% complete</span>
          <span className="text-[11px] font-poppins text-gray-400">{totalTargetVisits - totalDone} remaining</span>
        </div>
      </div>

      {/* ── Tier groups ── */}
      {cycle.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <BsClipboardCheck className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-gray-500 font-poppins-semibold text-sm">No doctors in this cycle yet</p>
          <p className="text-gray-400 font-poppins text-xs mt-1 mb-4">Add doctors from your company list to build your monthly call cycle</p>
          <button
            onClick={() => navigate("/rep-page/doctors")}
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2"
            style={{ transition: "background-color 0.15s" }}
          >
            Go to Doctors →
          </button>
        </div>
      ) : (
        (["A", "B", "C"] as const).map((tier) => {
          const items = byTier[tier];
          if (items.length === 0) return null;
          const cfg = TIER_CONFIG[tier];
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-poppins-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
                <span className="text-[11px] font-poppins text-gray-400">{cfg.freq} · {items.length} doctors</span>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const pct = item.frequency > 0 ? Math.min(100, Math.round((item.visits_done / item.frequency) * 100)) : 0;
                  const done = item.visits_done >= item.frequency;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border-solid border border-gray-200"
                    >
                      {/* Done indicator */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#16a34a]" : "bg-gray-100"}`}>
                        {done
                          ? <FiCheck className="w-4 h-4 text-white" />
                          : <span className="text-[11px] font-poppins-bold text-gray-400">{item.visits_done}</span>
                        }
                      </div>

                      {/* Doctor info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-poppins-semibold text-gray-800 truncate text-sm">{item.doctor.doctor_name}</p>
                          {item.list_type && (() => {
                            const ltCfg = LIST_TYPE_CONFIG[item.list_type];
                            return (
                              <span className={`shrink-0 text-[10px] font-poppins-bold px-1.5 py-0.5 rounded border ${ltCfg.cls}`}>
                                {ltCfg.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs font-poppins text-gray-400 truncate">{item.doctor.town}</p>
                      </div>

                      {/* Mini progress bar + count */}
                      <div className="shrink-0 flex flex-col items-end gap-1 w-24">
                        <span className={`text-[11px] font-poppins-semibold ${done ? "text-[#16a34a]" : "text-gray-500"}`}>
                          {item.visits_done}/{item.frequency}
                        </span>
                        <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: done ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#e5e7eb",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CallCycle;
