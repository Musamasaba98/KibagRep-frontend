import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentCycleApi, submitCycleApi, carryForwardCycleApi,
  createLateRequestApi, getMyLateRequestsApi, getActivityHistoryApi,
} from "../../../services/api";
import { format, differenceInDays } from "date-fns";
import {
  FiCheck, FiLock, FiAlertCircle, FiSend, FiClock, FiCopy, FiAlertTriangle,
} from "react-icons/fi";
import { BsClipboardCheck } from "react-icons/bs";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface Doctor { id: string; doctor_name: string; town: string; location: string; speciality: string[]; }
interface CycleItem {
  id: string; tier: "A" | "B" | "C"; list_type?: DoctorListType;
  territory_type?: "TOWN" | "UPCOUNTRY" | "REGIONAL" | null;
  frequency: number; visits_done: number; doctor: Doctor;
}
type DoctorListType = "KBL" | "BL" | "FOCUS";
interface Cycle {
  id: string; month: number; year: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "LOCKED";
  approved_at: string | null; review_note: string | null; items: CycleItem[];
}
interface LateRequest {
  id: string; type: string; month: number; year: number;
  status: "PENDING" | "APPROVED" | "REJECTED"; note: string; review_note: string | null;
}

const LIST_TYPE_CONFIG: Record<DoctorListType, { label: string; cls: string }> = {
  KBL:   { label: "KBL",   cls: "bg-amber-50 text-amber-700 border-amber-300"     },
  BL:    { label: "BL",    cls: "bg-gray-100 text-gray-500 border-gray-200"        },
  FOCUS: { label: "FOCUS", cls: "bg-violet-50 text-violet-700 border-violet-300"  },
};
const TIER_CONFIG = {
  A: { label: "Tier A", bg: "bg-[#dcfce7]", text: "text-[#15803d]", border: "border-[#86efac]", freq: "4×/month" },
  B: { label: "Tier B", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", freq: "2×/month" },
  C: { label: "Tier C", bg: "bg-gray-100",  text: "text-gray-600",   border: "border-gray-200",  freq: "1×/month" },
};
const STATUS_CONFIG = {
  DRAFT:     { label: "Draft",    bg: "bg-gray-100",  text: "text-gray-600",  icon: FiAlertCircle },
  SUBMITTED: { label: "Pending",  bg: "bg-amber-50",  text: "text-amber-700", icon: FiSend        },
  APPROVED:  { label: "Approved", bg: "bg-[#dcfce7]", text: "text-[#15803d]", icon: FiCheck       },
  LOCKED:    { label: "Locked",   bg: "bg-[#dcfce7]", text: "text-[#15803d]", icon: FiLock        },
};
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Which month/year is "next month" relative to now
const getNextMonthYear = () => {
  const now = new Date();
  const m = now.getMonth() + 2; // 0-indexed +1=current, +2=next
  const y = m > 12 ? now.getFullYear() + 1 : now.getFullYear();
  return { month: m > 12 ? 1 : m, year: y };
};

// Deadline for submitting a cycle: 25th of the month BEFORE the cycle's month
const getCycleDeadline = (month: number, year: number) => {
  const dm = month === 1 ? 12 : month - 1;
  const dy = month === 1 ? year - 1 : year;
  return new Date(dy, dm - 1, 25, 23, 59, 59);
};

// Returns a coloured deadline badge string + colour
const deadlineBadge = (deadline: Date) => {
  const days = differenceInDays(deadline, new Date());
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, cls: "bg-red-50 text-red-600 border-red-200" };
  if (days === 0) return { label: "Due today", cls: "bg-red-50 text-red-600 border-red-200" };
  if (days <= 5) return { label: `${days}d left`, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: `Due ${format(deadline, "d MMM")}`, cls: "bg-gray-100 text-gray-500 border-gray-200" };
};

// ─── Late Request Modal ───────────────────────────────────────────────────────
const LateRequestModal = ({
  month, year, existing, onClose, onSent,
}: { month: number; year: number; existing: LateRequest | null; onClose: () => void; onSent: (r: LateRequest) => void; }) => {
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSend = async () => {
    if (!note.trim()) { setErr("Please write a note explaining the delay."); return; }
    setSaving(true);
    try {
      const res = await createLateRequestApi({ type: "CYCLE", month, year, note });
      onSent(res.data.data);
    } catch { setErr("Failed to send request. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-amber-500 px-5 py-4">
          <h2 className="text-white font-poppins-bold text-lg">Request Late Submission</h2>
          <p className="text-amber-100 text-xs font-poppins mt-0.5">
            Cycle deadline was the 25th. Explain why you need more time.
          </p>
        </div>
        <div className="p-5 space-y-3">
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
          <div>
            <label className="block text-sm font-poppins-semibold text-gray-700 mb-1">
              Reason for late submission <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)} rows={4}
              placeholder="Explain what caused the delay and when you will submit…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-poppins outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>
          {existing?.status === "REJECTED" && existing.review_note && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
              <span className="font-semibold">Previous rejection:</span> {existing.review_note}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSend} disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-poppins-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: "opacity 0.15s" }}>
              {saving ? "Sending…" : "Send Request"}
            </button>
            <button onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-poppins-semibold py-2.5 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CallCycle = () => {
  const navigate = useNavigate();
  const now = new Date();

  // Tab: "current" = this month, "next" = next month
  const [tab, setTab] = useState<"current" | "next">("current");
  const currentMY = { month: now.getMonth() + 1, year: now.getFullYear() };
  const nextMY = getNextMonthYear();
  const activeMY = tab === "current" ? currentMY : nextMY;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [lateReq, setLateReq] = useState<LateRequest | null>(null);
  const [ncaMap, setNcaMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [carrying, setCarrying] = useState(false);
  const [error, setError] = useState("");
  const [showLateModal, setShowLateModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getCurrentCycleApi(activeMY.month, activeMY.year),
      getMyLateRequestsApi(),
      // Only fetch NCA data for the current month tab
      tab === "current" ? getActivityHistoryApi({ days: 31, limit: 500 }) : Promise.resolve(null),
    ])
      .then(([cycleRes, lateRes, actRes]) => {
        setCycle(cycleRes.data.data);
        const reqs: LateRequest[] = lateRes.data.data ?? [];
        const match = reqs.find((r) => r.type === "CYCLE" && r.month === activeMY.month && r.year === activeMY.year);
        setLateReq(match ?? null);

        if (actRes) {
          const activities: any[] = actRes.data?.data ?? [];
          const map: Record<string, number> = {};
          activities.forEach((a) => {
            if (!a.nca_reason) return;
            // Only count NCAs that fall within this cycle's month/year
            const d = new Date(a.date);
            if (d.getMonth() + 1 !== activeMY.month || d.getFullYear() !== activeMY.year) return;
            map[a.doctor.id] = (map[a.doctor.id] ?? 0) + 1;
          });
          setNcaMap(map);
        }
      })
      .catch(() => setError("Failed to load call cycle"))
      .finally(() => setLoading(false));
  }, [activeMY.month, activeMY.year, tab]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!cycle || cycle.status !== "DRAFT") return;
    setSubmitting(true);
    setError("");
    try {
      const res = await submitCycleApi(cycle.id);
      setCycle((p) => p ? { ...p, status: res.data.data.status } : p);
    } catch (err: any) {
      const code = err.response?.data?.error;
      if (code === "LATE_SUBMISSION_REQUIRED") setShowLateModal(true);
      else setError(err.response?.data?.message || "Failed to submit cycle");
    } finally { setSubmitting(false); }
  };

  const handleCarryForward = async () => {
    if (carrying) return;
    setCarrying(true);
    setError("");
    try {
      const res = await carryForwardCycleApi();
      // Switch to next tab and show result
      setTab("next");
      setCycle(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to carry forward");
    } finally { setCarrying(false); }
  };

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-10">
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#16a34a] animate-spin" />
      <span className="text-sm font-poppins">Loading…</span>
    </div>
  );

  if (error && !cycle) return (
    <div className="flex items-center gap-2 text-red-500 py-8">
      <FiAlertCircle className="w-5 h-5" /><span>{error}</span>
    </div>
  );

  if (!cycle) return null;

  const statusCfg = STATUS_CONFIG[cycle.status];
  const StatusIcon = statusCfg.icon;
  const isLocked = cycle.status === "LOCKED" || cycle.status === "APPROVED";
  const canSubmit = cycle.status === "DRAFT" && cycle.items.length > 0;
  const deadline = getCycleDeadline(activeMY.month, activeMY.year);
  const isPastDeadline = new Date() > deadline;
  const badge = deadlineBadge(deadline);
  const lateApproved = lateReq?.status === "APPROVED";
  const latePending  = lateReq?.status === "PENDING";

  const byTier: Record<string, CycleItem[]> = { A: [], B: [], C: [] };
  cycle.items.forEach((item) => { byTier[item.tier]?.push(item); });
  const totalTargetVisits = cycle.items.reduce((s, i) => s + i.frequency, 0);
  const totalDone = cycle.items.reduce((s, i) => s + i.visits_done, 0);
  const overallPct = totalTargetVisits > 0 ? Math.round((totalDone / totalTargetVisits) * 100) : 0;

  return (
    <div className="w-full space-y-5">
      {showLateModal && (
        <LateRequestModal
          month={activeMY.month} year={activeMY.year}
          existing={lateReq}
          onClose={() => setShowLateModal(false)}
          onSent={(r) => { setLateReq(r); setShowLateModal(false); }}
        />
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["current", "next"] as const).map((t) => {
          const my = t === "current" ? currentMY : nextMY;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-poppins-semibold transition-colors ${
                tab === t ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ transition: "background-color 0.15s" }}>
              {MONTH_NAMES[my.month - 1]} {my.year}
              {t === "next" && <span className="ml-1.5 text-[10px] text-[#16a34a] font-poppins-bold">NEXT</span>}
            </button>
          );
        })}
      </div>

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-poppins-bold text-xl tracking-tight text-gray-800">
            Call Cycle — {MONTH_NAMES[cycle.month - 1]} {cycle.year}
          </h1>
          <p className="text-sm font-poppins text-gray-400 mt-0.5">
            {cycle.items.length} doctors · {totalTargetVisits} target visits
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Deadline badge — only relevant for DRAFT cycles */}
          {cycle.status === "DRAFT" && (
            <span className={`flex items-center gap-1.5 text-[11px] font-poppins-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
              <FiClock className="w-3 h-3" />{badge.label}
            </span>
          )}

          {/* Status badge */}
          <span className={`flex items-center gap-1.5 text-[12px] font-poppins-semibold px-3 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            <StatusIcon className="w-3.5 h-3.5" />{statusCfg.label}
          </span>

          {/* Carry-forward button — only on next-month DRAFT with 0 items */}
          {tab === "next" && cycle.status === "DRAFT" && (
            <button onClick={handleCarryForward} disabled={carrying}
              className="flex items-center gap-1.5 text-sm font-poppins-semibold px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              style={{ transition: "background-color 0.15s" }}>
              <FiCopy className="w-3.5 h-3.5" />
              {carrying ? "Copying…" : "Copy from last month"}
            </button>
          )}

          {/* Submit button */}
          {canSubmit && !isPastDeadline && (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg hover:bg-[#15803d] disabled:opacity-60 focus-visible:outline-none"
              style={{ transition: "opacity 0.15s" }}>
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit for Approval"}
            </button>
          )}

          {/* Past deadline — request permission or submit if approved */}
          {canSubmit && isPastDeadline && (
            lateApproved ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg hover:bg-[#15803d] disabled:opacity-60"
                style={{ transition: "opacity 0.15s" }}>
                <FiSend className="w-4 h-4" />
                {submitting ? "Submitting…" : "Submit (Late — Approved)"}
              </button>
            ) : latePending ? (
              <span className="flex items-center gap-1.5 text-[12px] font-poppins-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <FiClock className="w-3.5 h-3.5" /> Request pending…
              </span>
            ) : (
              <button onClick={() => setShowLateModal(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg focus-visible:outline-none"
                style={{ transition: "background-color 0.15s" }}>
                <FiAlertTriangle className="w-4 h-4" /> Request Late Submission
              </button>
            )
          )}

          {isLocked && cycle.approved_at && (
            <span className="text-xs font-poppins text-gray-400">
              Approved {format(new Date(cycle.approved_at), "dd MMM")}
            </span>
          )}
        </div>
      </div>

      {/* Set Tour Plan prompt — shown once cycle is approved */}
      {cycle.status === "APPROVED" && (
        <div className="flex items-center justify-between gap-3 bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-[#16a34a] shrink-0" />
            <p className="text-sm font-poppins-semibold text-[#15803d]">Cycle approved — ready to plan your routes</p>
          </div>
          <button
            onClick={() => navigate('/rep-page/tour-plan')}
            className="shrink-0 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-3 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: 'background-color 0.15s' }}
          >
            Set Tour Plan
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <FiAlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Rejection notice */}
      {cycle.status === "DRAFT" && cycle.review_note && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-poppins-semibold text-red-700">Cycle returned by supervisor</p>
            <p className="text-xs font-poppins text-red-600 mt-0.5">{cycle.review_note}</p>
          </div>
        </div>
      )}

      {/* Late request rejected notice */}
      {lateReq?.status === "REJECTED" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-poppins-semibold text-red-700">Late request rejected</p>
            {lateReq.review_note && <p className="text-xs font-poppins text-red-600 mt-0.5">{lateReq.review_note}</p>}
            <button onClick={() => setShowLateModal(true)}
              className="text-xs font-poppins-semibold text-red-600 underline mt-1">
              Submit a new request →
            </button>
          </div>
        </div>
      )}

      {/* Progress bar — only for current month */}
      {tab === "current" && cycle.items.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-poppins-semibold text-gray-700">Monthly progress</span>
            <span className="text-sm font-poppins-bold text-[#16a34a]">{totalDone} / {totalTargetVisits} visits</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${overallPct}%`,
              backgroundColor: overallPct >= 80 ? "#16a34a" : overallPct >= 50 ? "#f59e0b" : "#ef4444",
              transition: "width 0.4s",
            }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] font-poppins text-gray-400">{overallPct}% complete</span>
            <span className="text-[11px] font-poppins text-gray-400">{totalTargetVisits - totalDone} remaining</span>
          </div>
        </div>
      )}

      {/* Doctor list */}
      {cycle.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <BsClipboardCheck className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-gray-500 font-poppins-semibold text-sm">No doctors in this cycle yet</p>
          <p className="text-gray-400 font-poppins text-xs mt-1 mb-4">
            {tab === "next"
              ? "Use 'Copy from last month' to pre-fill, or go to HCP Directory to add doctors."
              : "Add doctors from your HCP Directory to build your monthly call cycle."}
          </p>
          <div className="flex gap-2">
            {tab === "next" && (
              <button onClick={handleCarryForward} disabled={carrying}
                className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-semibold px-4 py-2 rounded-lg disabled:opacity-60"
                style={{ transition: "background-color 0.15s" }}>
                <FiCopy className="w-3.5 h-3.5" />
                {carrying ? "Copying…" : "Copy from last month"}
              </button>
            )}
            <button onClick={() => navigate("/rep-page/doctors")}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-poppins-semibold px-4 py-2 rounded-lg hover:bg-gray-50">
              <MdChevronLeft className="w-4 h-4 rotate-180" /> Go to HCP Directory
            </button>
          </div>
        </div>
      ) : (
        (["A", "B", "C"] as const).map((tier) => {
          const items = byTier[tier];
          if (!items.length) return null;
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
                    <div key={item.id} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border border-gray-200">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#16a34a]" : "bg-gray-100"}`}>
                        {done
                          ? <FiCheck className="w-4 h-4 text-white" />
                          : <span className="text-[11px] font-poppins-bold text-gray-400">{item.visits_done}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-poppins-semibold text-gray-800 truncate text-sm">{item.doctor.doctor_name}</p>
                          {item.list_type && item.territory_type !== "REGIONAL" && item.territory_type != null && (() => {
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
                      <div className="shrink-0 flex flex-col items-end gap-1 w-24">
                        <span className={`text-[11px] font-poppins-semibold ${done ? "text-[#16a34a]" : "text-gray-500"}`}>
                          {item.visits_done}/{item.frequency}
                        </span>
                        <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${pct}%`,
                            backgroundColor: done ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#e5e7eb",
                          }} />
                        </div>
                        {tab === "current" && !done && (ncaMap[item.doctor.id] ?? 0) > 0 && (
                          <span className="text-[9px] font-poppins-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                            {ncaMap[item.doctor.id]}× NCA
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Next month planning hint */}
      {tab === "current" && (isLocked) && (
        <div
          className="flex items-center justify-between bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#dcfce7]"
          onClick={() => setTab("next")}
          style={{ transition: "background-color 0.15s" }}
        >
          <div>
            <p className="text-sm font-poppins-semibold text-[#15803d]">Plan next month's cycle</p>
            <p className="text-xs font-poppins text-[#16a34a] mt-0.5">
              {MONTH_NAMES[nextMY.month - 1]} {nextMY.year} — deadline {format(getCycleDeadline(nextMY.month, nextMY.year), "d MMM")}
            </p>
          </div>
          <MdChevronRight className="w-5 h-5 text-[#16a34a]" />
        </div>
      )}
    </div>
  );
};

export default CallCycle;
