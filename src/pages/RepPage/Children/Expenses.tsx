import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  getMyExpenseClaimsApi,
  createExpenseClaimApi,
  addExpenseItemApi,
  removeExpenseItemApi,
  submitExpenseClaimApi,
} from "../../../services/api";
import {
  FiPlus, FiTrash2, FiSend, FiClock, FiCheckCircle,
  FiXCircle, FiFileText, FiChevronDown, FiChevronUp,
} from "react-icons/fi";
import { LuWallet, LuReceipt } from "react-icons/lu";
import { MdOutlineDirectionsCar, MdOutlineHotel, MdOutlineFastfood, MdOutlineCardGiftcard } from "react-icons/md";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
type ExpenseCategory = "TRANSPORT" | "ACCOMMODATION" | "MEALS" | "PROMO_ITEMS" | "OTHER";

interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

interface ExpenseClaim {
  id: string;
  period: string;
  total_amount: number;
  status: ClaimStatus;
  items: ExpenseItem[];
  submitted_at: string | null;
  review_note?: string | null;
  created_at: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ClaimStatus, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  DRAFT:     { label: "Draft",     icon: FiFileText,    bg: "bg-gray-100",  text: "text-gray-600"  },
  SUBMITTED: { label: "Submitted", icon: FiClock,       bg: "bg-amber-100", text: "text-amber-700" },
  APPROVED:  { label: "Approved",  icon: FiCheckCircle, bg: "bg-green-100", text: "text-green-700" },
  REJECTED:  { label: "Rejected",  icon: FiXCircle,     bg: "bg-red-100",   text: "text-red-700"   },
};

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "TRANSPORT",     label: "Transport",     icon: MdOutlineDirectionsCar, color: "text-sky-600",    bg: "bg-sky-50"    },
  { value: "ACCOMMODATION", label: "Accommodation", icon: MdOutlineHotel,         color: "text-violet-600", bg: "bg-violet-50" },
  { value: "MEALS",         label: "Meals",         icon: MdOutlineFastfood,      color: "text-amber-600",  bg: "bg-amber-50"  },
  { value: "PROMO_ITEMS",   label: "Promo Items",   icon: MdOutlineCardGiftcard,  color: "text-pink-600",   bg: "bg-pink-50"   },
  { value: "OTHER",         label: "Other",         icon: FiFileText,             color: "text-gray-500",   bg: "bg-gray-100"  },
];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return format(d, "MMMM yyyy");
}

function nextPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  const d = new Date(year, month); // month is 0-based: month+1-1 = month
  return format(d, "MMMM yyyy");
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: ClaimStatus }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-poppins-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

const CategoryChip = ({ category }: { category: ExpenseCategory }) => {
  const cfg = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[4];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-poppins-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

// ─── Add Item Form ──────────────────────────────────────────────────────────────

const AddItemForm = ({ claimId, onAdded }: { claimId: string; onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("TRANSPORT");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setError("Fill in description and a valid amount.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addExpenseItemApi(claimId, {
        category,
        description: description.trim(),
        amount: parseFloat(amount),
        date,
      });
      setDescription("");
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setOpen(false);
      onAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-poppins-semibold text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        style={{ transition: "background-color 0.15s" }}
      >
        <FiPlus className="w-4 h-4" />
        Add Expense Item
        {open ? <FiChevronUp className="ml-auto w-4 h-4 text-gray-400" /> : <FiChevronDown className="ml-auto w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/60">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg font-poppins">{error}</p>
          )}

          {/* Category picker */}
          <div className="grid grid-cols-5 gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.value;
              return (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-poppins-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                    active ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                  style={{ transition: "border-color 0.15s, background-color 0.15s" }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block leading-none">{c.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Description — e.g. Matatu to Masaka"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 font-poppins text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
            style={{ transition: "border-color 0.15s" }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">UGX</span>
              <input
                type="number" placeholder="Amount" value={amount}
                onChange={(e) => setAmount(e.target.value)} min="1" step="any"
                className="w-full pl-11 pr-3 py-2 font-poppins text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
                style={{ transition: "border-color 0.15s" }}
              />
            </div>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 font-poppins text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
              style={{ transition: "border-color 0.15s" }}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 text-sm font-poppins-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}>
              {saving ? "Saving…" : "Add Item"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }}
              className="px-4 py-2 text-sm font-poppins-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
              style={{ transition: "border-color 0.15s" }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Items Table ───────────────────────────────────────────────────────────────

const ItemsTable = ({
  items, canEdit, removing, onRemove,
}: {
  items: ExpenseItem[];
  canEdit: boolean;
  removing: string | null;
  onRemove: (id: string) => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
        <LuWallet className="w-8 h-8 text-gray-200" />
        <p className="text-sm font-poppins">No expenses added yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-50">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 px-1 group">
          <div className="shrink-0">
            <CategoryChip category={item.category} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-poppins-semibold text-gray-800 truncate">{item.description}</p>
            <p className="text-xs font-poppins text-gray-400">{format(new Date(item.date), "dd MMM yyyy")}</p>
          </div>
          <span className="text-sm font-poppins-bold text-gray-700 shrink-0 tabular-nums">
            {item.amount.toLocaleString()}
          </span>
          {canEdit && (
            <button
              onClick={() => onRemove(item.id)}
              disabled={removing === item.id}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 opacity-0 group-hover:opacity-100"
              style={{ transition: "opacity 0.15s, color 0.15s, background-color 0.15s" }}
              aria-label="Remove"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {/* Total row */}
      <div className="flex items-center justify-between pt-3 px-1">
        <span className="text-xs font-poppins-semibold text-gray-400 uppercase tracking-wide">Total</span>
        <span className="text-base font-poppins-bold text-gray-900 tabular-nums">
          UGX {items.reduce((s, i) => s + i.amount, 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─── Active Claim (DRAFT / REJECTED) ──────────────────────────────────────────

const ActiveClaim = ({ claim, onRefresh }: { claim: ExpenseClaim; onRefresh: () => void }) => {
  const [removing, setRemoving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canEdit = claim.status === "DRAFT" || claim.status === "REJECTED";

  const handleRemove = async (itemId: string) => {
    setRemoving(itemId);
    try { await removeExpenseItemApi(claim.id, itemId); onRefresh(); }
    catch { } finally { setRemoving(null); }
  };

  const handleSubmit = async () => {
    if (claim.items.length === 0) { setError("Add at least one item before submitting."); return; }
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      await submitExpenseClaimApi(claim.id);
      setSuccess("Claim submitted. Your supervisor will review it shortly.");
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div>
          <p className="font-poppins-bold text-gray-900 text-base">{formatPeriod(claim.period)}</p>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">
            {claim.items.length} item{claim.items.length !== 1 ? "s" : ""}
            {claim.total_amount > 0 && ` · UGX ${claim.total_amount.toLocaleString()}`}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Rejection note */}
      {claim.review_note && (
        <div className="mx-5 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-xl">
          <FiXCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span><span className="font-poppins-semibold">Returned: </span><span className="font-poppins">{claim.review_note}</span></span>
        </div>
      )}

      {/* Items */}
      <div className="px-5 py-2">
        <ItemsTable items={claim.items} canEdit={canEdit} removing={removing} onRemove={handleRemove} />
      </div>

      {/* Add form + submit */}
      {canEdit && (
        <div className="px-5 pb-5 flex flex-col gap-3 border-t border-gray-50 pt-3">
          <AddItemForm claimId={claim.id} onAdded={onRefresh} />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg font-poppins">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-poppins">{success}</p>
          )}

          {claim.items.length > 0 && (
            <button
              onClick={handleSubmit} disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-poppins-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 shadow-[0_2px_8px_0_rgba(22,163,74,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}>
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : `Submit Claim — UGX ${claim.total_amount.toLocaleString()}`}
            </button>
          )}
        </div>
      )}

      {/* Submitted state footer */}
      {claim.status === "SUBMITTED" && (
        <div className="mx-5 mb-5 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <FiClock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm font-poppins-semibold text-amber-700">Awaiting supervisor review</p>
        </div>
      )}
    </div>
  );
};

// ─── Approved Receipt Card ─────────────────────────────────────────────────────

const ApprovedReceipt = ({ claim }: { claim: ExpenseClaim }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] overflow-hidden">
    {/* Green approved banner */}
    <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] px-5 py-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <FiCheckCircle className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-poppins-bold text-white text-lg leading-tight">{formatPeriod(claim.period)}</p>
        <p className="text-white/80 font-poppins text-sm mt-0.5">Claim approved</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-white/70 font-poppins text-xs">Total</p>
        <p className="font-poppins-bold text-white text-xl tabular-nums">
          {claim.total_amount.toLocaleString()}
        </p>
        <p className="text-white/60 text-[10px] font-poppins">UGX</p>
      </div>
    </div>

    {/* Items read-only */}
    <div className="px-5 py-4">
      <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-3">Items</p>
      <div className="flex flex-col divide-y divide-gray-50">
        {claim.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2.5">
            <CategoryChip category={item.category} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-poppins-semibold text-gray-700 truncate">{item.description}</p>
              <p className="text-xs font-poppins text-gray-400">{format(new Date(item.date), "dd MMM yyyy")}</p>
            </div>
            <span className="text-sm font-poppins-bold text-gray-700 tabular-nums shrink-0">
              {item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Next month nudge */}
    <div className="mx-5 mb-5 bg-[#f0fdf4] border border-[#dcfce7] rounded-xl px-4 py-3 flex items-center gap-2">
      <LuReceipt className="w-4 h-4 text-[#16a34a] shrink-0" />
      <p className="text-sm font-poppins text-[#15803d]">
        Your {nextPeriod(claim.period)} claim will open automatically.
      </p>
    </div>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────────

const Expenses = () => {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchClaims = async () => {
    try {
      const res = await getMyExpenseClaimsApi();
      setClaims(res.data?.data ?? []);
    } catch {
      setError("Failed to load expense claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const period = currentPeriod();
  const currentClaim = claims.find((c) => c.period === period) ?? null;
  const pastClaims = claims.filter((c) => c.period !== period);

  const totalApproved = claims
    .filter((c) => c.status === "APPROVED")
    .reduce((s, c) => s + c.total_amount, 0);

  const handleCreateClaim = async () => {
    setCreating(true);
    setError("");
    try {
      await createExpenseClaimApi({ period });
      await fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create claim.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-3 font-poppins">
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-5 flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-poppins-bold text-xl sm:text-2xl tracking-tight text-gray-900">Expense Claims</h1>
          <p className="text-sm font-poppins text-gray-400 mt-0.5">Submit and track your monthly field expenses</p>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm flex flex-col items-end">
            <span className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wide">Total Approved</span>
            <span className="text-base font-poppins-bold text-[#16a34a] tabular-nums">UGX {totalApproved.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm flex flex-col items-end">
            <span className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wide">Claims</span>
            <span className="text-base font-poppins-bold text-gray-700">{claims.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl font-poppins">
          {error}
        </div>
      )}

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── Left: current month ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-poppins-bold text-gray-400 uppercase tracking-widest">
            {formatPeriod(period)} — Current
          </p>

          {!currentClaim ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-12 text-center px-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center mb-4">
                <LuWallet className="w-6 h-6 text-[#16a34a]" />
              </div>
              <p className="text-gray-800 font-poppins-bold text-base">No claim for {formatPeriod(period)}</p>
              <p className="text-gray-400 text-sm font-poppins mt-1 mb-5 max-w-xs">
                Start a claim to track transport, accommodation, meals, and promo items for this month
              </p>
              <button
                onClick={handleCreateClaim} disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-poppins-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] disabled:opacity-50 shadow-[0_2px_8px_0_rgba(22,163,74,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                style={{ transition: "background-color 0.15s" }}>
                <FiPlus className="w-4 h-4" />
                {creating ? "Creating…" : "Start Claim"}
              </button>
            </div>
          ) : currentClaim.status === "APPROVED" ? (
            <ApprovedReceipt claim={currentClaim} />
          ) : (
            <ActiveClaim claim={currentClaim} onRefresh={fetchClaims} />
          )}
        </div>

        {/* ── Right: history ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-poppins-bold text-gray-400 uppercase tracking-widest">History</p>

          {pastClaims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center shadow-sm">
              <p className="text-sm font-poppins text-gray-400">No previous claims</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {pastClaims.map((claim) => (
                <div key={claim.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-poppins-semibold text-gray-700">{formatPeriod(claim.period)}</p>
                    <p className="text-xs font-poppins text-gray-400 mt-0.5">
                      {claim.items.length} items · UGX {claim.total_amount.toLocaleString()}
                    </p>
                    {claim.review_note && (
                      <p className="text-xs font-poppins text-red-500 mt-1 truncate">{claim.review_note}</p>
                    )}
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Expenses;
