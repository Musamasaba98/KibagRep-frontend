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
  FiPlus,
  FiTrash2,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
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
  DRAFT:     { label: "Draft",     icon: FiFileText,    bg: "bg-gray-100",   text: "text-gray-600"  },
  SUBMITTED: { label: "Submitted", icon: FiClock,       bg: "bg-amber-100",  text: "text-amber-700" },
  APPROVED:  { label: "Approved",  icon: FiCheckCircle, bg: "bg-green-100",  text: "text-green-700" },
  REJECTED:  { label: "Rejected",  icon: FiXCircle,     bg: "bg-red-100",    text: "text-red-700"   },
};

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: "TRANSPORT",     label: "Transport",     icon: MdOutlineDirectionsCar,  color: "text-sky-600"   },
  { value: "ACCOMMODATION", label: "Accommodation", icon: MdOutlineHotel,          color: "text-violet-600" },
  { value: "MEALS",         label: "Meals",         icon: MdOutlineFastfood,       color: "text-amber-600" },
  { value: "PROMO_ITEMS",   label: "Promo Items",   icon: MdOutlineCardGiftcard,   color: "text-pink-600"  },
  { value: "OTHER",         label: "Other",         icon: FiFileText,              color: "text-gray-600"  },
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

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: ClaimStatus }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const CategoryIcon = ({ category }: { category: ExpenseCategory }) => {
  const cfg = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[4];
  const Icon = cfg.icon;
  return <Icon className={`w-4 h-4 ${cfg.color}`} />;
};

// ─── Add Item Form ──────────────────────────────────────────────────────────────

interface AddItemFormProps {
  claimId: string;
  onAdded: () => void;
}

const AddItemForm = ({ claimId, onAdded }: AddItemFormProps) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("TRANSPORT");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setError("Fill in all fields with a valid amount.");
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
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#16a34a] hover:bg-[#f0fdf4] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
      >
        <FiPlus className="w-4 h-4" />
        Add Expense Item
        {open ? <FiChevronUp className="ml-auto w-4 h-4 text-gray-400" /> : <FiChevronDown className="ml-auto w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/50">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                    category === c.value
                      ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Description (e.g. Matatu to Kampala)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">UGX</span>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="100"
                className="w-full pl-11 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white transition-colors"
              />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              {saving ? "Saving…" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Active Claim Card ──────────────────────────────────────────────────────────

interface ActiveClaimProps {
  claim: ExpenseClaim;
  onRefresh: () => void;
}

const ActiveClaim = ({ claim, onRefresh }: ActiveClaimProps) => {
  const [removing, setRemoving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDraft = claim.status === "DRAFT";
  const isRejected = claim.status === "REJECTED";
  const canEdit = isDraft || isRejected;

  const handleRemove = async (itemId: string) => {
    setRemoving(itemId);
    try {
      await removeExpenseItemApi(claim.id, itemId);
      onRefresh();
    } catch {
      // silently ignore
    } finally {
      setRemoving(null);
    }
  };

  const handleSubmit = async () => {
    if (claim.items.length === 0) { setError("Add at least one item before submitting."); return; }
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      await submitExpenseClaimApi(claim.id);
      setSuccess("Claim submitted successfully. Your supervisor will review it.");
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-800 text-base">{formatPeriod(claim.period)}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {claim.items.length} item{claim.items.length !== 1 ? "s" : ""} · UGX {claim.total_amount.toLocaleString()}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* rejection note */}
      {isRejected && claim.review_note && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
          <span className="font-semibold">Returned: </span>{claim.review_note}
        </div>
      )}

      {/* items list */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {claim.items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No items yet — add your first expense below.</p>
        ) : (
          claim.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                <CategoryIcon category={item.category} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORIES.find((c) => c.value === item.category)?.label} · {format(new Date(item.date), "dd MMM")}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-700 shrink-0 tabular-nums">
                {item.amount.toLocaleString()}
              </span>
              {canEdit && (
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={removing === item.id}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                  aria-label="Remove item"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* add item + submit */}
      {canEdit && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          <AddItemForm claimId={claim.id} onAdded={onRefresh} />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{success}</p>
          )}

          {claim.items.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              <FiSend className="w-4 h-4" />
              {submitting ? "Submitting…" : `Submit Claim — UGX ${claim.total_amount.toLocaleString()}`}
            </button>
          )}
        </div>
      )}

      {claim.status === "SUBMITTED" && (
        <div className="px-5 pb-5">
          <p className="text-center text-sm text-amber-600 font-medium py-2">
            Awaiting supervisor review
          </p>
        </div>
      )}
      {claim.status === "APPROVED" && (
        <div className="px-5 pb-5">
          <p className="text-center text-sm text-green-600 font-medium py-2">
            Claim approved
          </p>
        </div>
      )}
    </div>
  );
};

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

  const handleCreateClaim = async () => {
    setCreating(true);
    setError("");
    try {
      await createExpenseClaimApi(period);
      await fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create claim.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-bold text-xl tracking-tight text-gray-800">Expense Claims</h1>
        <p className="text-sm text-gray-400 mt-0.5">Submit and track your field expense claims</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Current month claim */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          {formatPeriod(period)} (Current)
        </p>
        {currentClaim ? (
          <ActiveClaim claim={currentClaim} onRefresh={fetchClaims} />
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center py-10 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center mb-3">
              <FiFileText className="w-5 h-5 text-[#16a34a]" />
            </div>
            <p className="text-gray-700 font-semibold text-sm">No claim for {formatPeriod(period)}</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Start tracking your expenses for this month</p>
            <button
              onClick={handleCreateClaim}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            >
              <FiPlus className="w-4 h-4" />
              {creating ? "Creating…" : "Start New Claim"}
            </button>
          </div>
        )}
      </div>

      {/* Past claims */}
      {pastClaims.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Past Claims</p>
          <div className="flex flex-col gap-2">
            {pastClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{formatPeriod(claim.period)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {claim.items.length} items · UGX {claim.total_amount.toLocaleString()}
                  </p>
                  {claim.status === "REJECTED" && claim.review_note && (
                    <p className="text-xs text-red-600 mt-1 truncate">
                      <span className="font-semibold">Note: </span>{claim.review_note}
                    </p>
                  )}
                </div>
                <StatusBadge status={claim.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
