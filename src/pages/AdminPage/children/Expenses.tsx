import { useState, useEffect } from "react";
import { format } from "date-fns";
import { LuChevronDown, LuChevronUp, LuCircleCheck, LuCircleX, LuClock, LuTriangleAlert } from "react-icons/lu";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import {
  getPendingExpenseClaimsApi,
  approveExpenseClaimApi,
  rejectExpenseClaimApi,
} from "../../../services/api";

interface ExpenseItem {
  id: string; category: string; description: string; amount: number;
}
interface ExpenseClaim {
  id: string; period: string; total_amount: number; status: string; created_at: string;
  user?: { id: string; firstname: string; lastname: string };
  items?: ExpenseItem[];
}

type FilterStatus = "PENDING" | "ALL";

const CATEGORY_COLORS: Record<string, string> = {
  transport:     "bg-sky-50 text-sky-700",
  accommodation: "bg-violet-50 text-violet-700",
  meals:         "bg-amber-50 text-amber-700",
  promo:         "bg-pink-50 text-pink-700",
};

const Avatar = ({ first, last }: { first?: string; last?: string }) => (
  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
    <span className="text-[#16a34a] font-black text-xs">
      {first ? `${first[0]}${last?.[0] ?? ""}`.toUpperCase() : "?"}
    </span>
  </div>
);

// ── Reject reason inline modal ─────────────────────────────────────────────

const RejectModal = ({
  claimId, repName, onConfirm, onCancel, loading,
}: {
  claimId: string; repName: string;
  onConfirm: (id: string, reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <LuTriangleAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-[#1a1a1a] text-base leading-tight">Reject Expense Claim</p>
            <p className="text-xs text-gray-400 mt-0.5">{repName}</p>
          </div>
        </div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Missing receipts for accommodation items"
          rows={3}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-none"
          autoFocus
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none"
            style={{ transition: "background-color 0.15s" }}
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(claimId, reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            style={{ transition: "background-color 0.15s" }}
          >
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const Expenses = () => {
  const [claims, setClaims]         = useState<ExpenseClaim[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actioning, setActioning]   = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<ExpenseClaim | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("PENDING");

  const load = () => {
    setLoading(true);
    getPendingExpenseClaimsApi()
      .then((res) => setClaims(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try { await approveExpenseClaimApi(id); load(); } catch { } finally { setActioning(null); }
  };

  const handleReject = async (id: string, reason: string) => {
    setActioning(id);
    try { await rejectExpenseClaimApi(id, { note: reason }); setRejectTarget(null); load(); }
    catch { } finally { setActioning(null); }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pendingCount = claims.filter((c) => c.status === "PENDING" || c.status === "SUBMITTED").length;
  const totalUgx     = claims.reduce((s, c) => s + (c.total_amount ?? 0), 0);
  const displayed    = filterStatus === "PENDING"
    ? claims.filter((c) => c.status === "PENDING" || c.status === "SUBMITTED")
    : claims;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-xl sm:text-2xl text-[#1a1a1a] tracking-tight">Expense Claims</h1>
          <p className="text-gray-400 text-sm mt-0.5">Review and action submitted expense claims</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] ${
              filterStatus === "PENDING"
                ? "bg-[#16a34a] text-white border-[#16a34a]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            style={{ transition: "background-color 0.15s" }}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] ${
              filterStatus === "ALL"
                ? "bg-[#16a34a] text-white border-[#16a34a]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            style={{ transition: "background-color 0.15s" }}
          >
            All
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-400 font-semibold">Pending Claims</p>
          {loading ? <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mt-1" /> : (
            <p className={`text-2xl font-black mt-1 ${pendingCount > 0 ? "text-orange-500" : "text-[#16a34a]"}`}>{pendingCount}</p>
          )}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          <p className="text-xs text-gray-400 font-semibold">Total (UGX)</p>
          {loading ? <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mt-1" /> : (
            <p className="text-2xl font-black mt-1 text-violet-600">{totalUgx.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 font-semibold">Claims This Batch</p>
          {loading ? <div className="h-7 w-8 bg-gray-100 rounded animate-pulse mt-1" /> : (
            <p className="text-2xl font-black mt-1 text-gray-700">{claims.length}</p>
          )}
        </div>
      </div>

      {/* Claims list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-16 text-center">
            <LuCircleCheck className="w-10 h-10 text-[#16a34a] mb-3" />
            <p className="font-semibold text-gray-600">No pending claims</p>
            <p className="text-sm text-gray-400 mt-1">All expense claims have been reviewed.</p>
          </div>
        ) : (
          displayed.map((claim) => {
            const isOpen       = expanded.has(claim.id);
            const isPending    = claim.status === "PENDING" || claim.status === "SUBMITTED";
            const isApproved   = claim.status === "APPROVED";
            const repName      = claim.user ? `${claim.user.firstname} ${claim.user.lastname}` : "Unknown Rep";

            const statusBadge = isApproved
              ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-[#16a34a]"><LuCircleCheck className="w-3 h-3" />Approved</span>
              : claim.status === "REJECTED"
              ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><LuCircleX className="w-3 h-3" />Rejected</span>
              : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><LuClock className="w-3 h-3" />Pending</span>;

            return (
              <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4">
                  <Avatar first={claim.user?.firstname} last={claim.user?.lastname} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm truncate">{repName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-semibold text-gray-600">{claim.period}</span>
                      {claim.created_at && ` · ${format(new Date(claim.created_at), "dd MMM yyyy")}`}
                    </p>
                    {/* Status badge visible on mobile only */}
                    <div className="mt-1 sm:hidden">{statusBadge}</div>
                  </div>

                  {/* Amount + status — desktop only */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-lg font-black text-[#1a1a1a]">UGX {claim.total_amount.toLocaleString()}</p>
                    {statusBadge}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(claim.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
                    style={{ transition: "background-color 0.15s" }}
                  >
                    {isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Actions row (always visible for pending) */}
                {isPending && (
                  <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 pb-3 sm:pb-4">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={actioning === claim.id}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                      style={{ transition: "background-color 0.15s" }}
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      {actioning === claim.id ? "Processing…" : "Approve"}
                    </button>
                    <button
                      onClick={() => setRejectTarget(claim)}
                      disabled={actioning === claim.id}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                      style={{ transition: "background-color 0.15s" }}
                    >
                      <FiXCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <span className="ml-auto text-xs text-gray-400 sm:hidden font-semibold tabular-nums">
                      UGX {claim.total_amount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Expanded items */}
                {isOpen && claim.items && claim.items.length > 0 && (
                  <div className="border-t border-gray-50 px-4 sm:px-5 py-3 flex flex-col gap-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Claim Items</p>
                    {claim.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[item.category?.toLowerCase()] ?? "bg-gray-100 text-gray-500"}`}>
                          {item.category}
                        </span>
                        <p className="flex-1 text-sm text-gray-600 truncate">{item.description}</p>
                        <p className="text-sm font-semibold text-gray-700 shrink-0">
                          UGX {item.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-end border-t border-gray-100 pt-2 mt-1">
                      <p className="text-sm font-black text-[#1a1a1a]">
                        Total: UGX {claim.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          claimId={rejectTarget.id}
          repName={rejectTarget.user ? `${rejectTarget.user.firstname} ${rejectTarget.user.lastname}` : "Unknown"}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={actioning === rejectTarget.id}
        />
      )}
    </div>
  );
};

export default Expenses;
