import { useEffect, useState } from "react";
import { LuSearch, LuBadgeCheck, LuClock, LuLock, LuLockOpen, LuPencil, LuChevronDown, LuChevronUp, LuRefreshCw, LuCheck, LuSettings } from "react-icons/lu";
import {
  getAllCompaniesWithPlanApi,
  updateCompanyPlanApi,
  getAllPlanConfigsApi,
  updatePlanConfigApi,
} from "../../../services/api";

type SaasPlan = "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE" | "SUSPENDED";

interface CompanyRow {
  id: string;
  company_name: string;
  saas_plan: SaasPlan;
  is_active: boolean;
  trial_ends_at: string | null;
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  is_locked: boolean;
  lock_reason: string | null;
  date_of_joining: string;
  trial_days_left: number | null;
  _count: { users: number };
}

interface PlanConfig {
  plan: SaasPlan;
  display_name: string;
  price_ugx: number | null;
  show_price: boolean;
  rep_limit: number | null;
  setup_fee_ugx: number | null;
  annual_discount_pct: number;
  features: string[];
  is_active: boolean;
}

const PLAN_COLORS: Record<SaasPlan, string> = {
  TRIAL:      "bg-blue-100 text-blue-700",
  STARTER:    "bg-green-100 text-green-700",
  GROWTH:     "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
  SUSPENDED:  "bg-red-100 text-red-700",
};

const ALL_PLANS: SaasPlan[] = ["TRIAL", "STARTER", "GROWTH", "ENTERPRISE", "SUSPENDED"];

function fmt(n: number) { return n.toLocaleString("en-UG"); }
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Company plan edit modal ──────────────────────────────────────────────────
const EditPlanModal = ({ company, onClose, onSaved }: {
  company: CompanyRow;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [plan, setPlan]         = useState<SaasPlan>(company.saas_plan);
  const [trialDays, setTrialDays] = useState(30);
  const [expireDays, setExpireDays] = useState(365);
  const [lockReason, setLockReason] = useState(company.lock_reason ?? "");
  const [isLocked, setIsLocked] = useState(company.is_locked);
  const [activate, setActivate] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      const now = new Date();
      const trialEndsAt   = new Date(now); trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      const planExpiresAt = new Date(now); planExpiresAt.setDate(planExpiresAt.getDate() + expireDays);

      await updateCompanyPlanApi(company.id, {
        saas_plan: plan,
        is_locked: isLocked,
        lock_reason: isLocked ? lockReason : null,
        activate,
        ...(plan === "TRIAL" ? { trial_ends_at: trialEndsAt.toISOString() } : {}),
        ...(plan !== "TRIAL" && plan !== "SUSPENDED" ? { plan_expires_at: planExpiresAt.toISOString() } : {}),
      });
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-poppins-bold text-lg text-gray-900 mb-1">{company.company_name}</h2>
        <p className="text-xs text-gray-400 font-poppins mb-5">Update subscription plan</p>

        {/* Plan selector */}
        <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Plan</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ALL_PLANS.filter(p => p !== "SUSPENDED").map(p => (
            <button key={p} onClick={() => setPlan(p)}
              className={`py-2 rounded-xl text-xs font-poppins-bold border transition-colors ${
                plan === p
                  ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPlan("SUSPENDED")}
            className={`py-2 rounded-xl text-xs font-poppins-bold border transition-colors col-span-1 ${
              plan === "SUSPENDED"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            SUSPEND
          </button>
        </div>

        {/* Trial extension */}
        {plan === "TRIAL" && (
          <div className="mb-4">
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Trial duration (days from today)</label>
            <input type="number" min={1} max={365} value={trialDays}
              onChange={e => setTrialDays(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
          </div>
        )}

        {/* Paid plan expiry */}
        {plan !== "TRIAL" && plan !== "SUSPENDED" && (
          <div className="mb-4">
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1">Plan valid for (days from today)</label>
            <input type="number" min={1} max={730} value={expireDays}
              onChange={e => setExpireDays(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={activate} onChange={e => setActivate(e.target.checked)}
                className="accent-[#16a34a]" />
              <span className="text-xs font-poppins text-gray-500">Mark as payment confirmed (sets activated date)</span>
            </label>
          </div>
        )}

        {/* Lock toggle */}
        <div className="mb-5">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" checked={isLocked} onChange={e => setIsLocked(e.target.checked)}
              className="accent-red-500" />
            <span className="text-xs font-poppins-semibold text-gray-600">Manually lock account</span>
          </label>
          {isLocked && (
            <input type="text" placeholder="Reason shown to admin (e.g. 'Payment overdue 45 days')"
              value={lockReason} onChange={e => setLockReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-poppins focus:outline-none focus:border-red-400" />
          )}
        </div>

        {error && <p className="text-xs text-red-500 font-poppins mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-poppins-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-poppins-bold hover:bg-[#15803d] transition-colors disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Plan config editor ───────────────────────────────────────────────────────
const PlanConfigEditor = () => {
  const [configs, setConfigs]   = useState<PlanConfig[]>([]);
  const [open, setOpen]         = useState<SaasPlan | null>(null);
  const [editing, setEditing]   = useState<Partial<PlanConfig>>({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState<SaasPlan | null>(null);

  useEffect(() => {
    getAllPlanConfigsApi().then(r => setConfigs(r.data?.data ?? [])).catch(() => {});
  }, []);

  const startEdit = (cfg: PlanConfig) => {
    setOpen(cfg.plan);
    setEditing({ ...cfg, features: [...cfg.features] });
  };

  const saveConfig = async () => {
    if (!open) return;
    setSaving(true);
    try {
      await updatePlanConfigApi(open, editing);
      setConfigs(prev => prev.map(c => c.plan === open ? { ...c, ...editing } as PlanConfig : c));
      setSaved(open);
      setTimeout(() => setSaved(null), 2000);
      setOpen(null);
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (idx: number, val: string) => {
    setEditing(e => ({ ...e, features: (e.features ?? []).map((f, i) => i === idx ? val : f) }));
  };
  const addFeature    = () => setEditing(e => ({ ...e, features: [...(e.features ?? []), ""] }));
  const removeFeature = (idx: number) => setEditing(e => ({ ...e, features: (e.features ?? []).filter((_, i) => i !== idx) }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
      <div className="flex items-center gap-2 mb-5">
        <LuSettings size={16} className="text-[#16a34a]" />
        <h2 className="font-poppins-bold text-gray-900">Plan Configuration</h2>
        <span className="text-xs font-poppins text-gray-400 ml-1">— pricing page & rep limits (admin-only)</span>
      </div>
      <p className="text-xs font-poppins text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-5">
        <strong>Note:</strong> Editing features here updates what prospects see on the pricing page — not what the app enforces. Actual feature access is code-based per plan name.
      </p>

      <div className="space-y-3">
        {configs.filter(c => c.plan !== "SUSPENDED").map(cfg => (
          <div key={cfg.plan} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => open === cfg.plan ? setOpen(null) : startEdit(cfg)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-poppins-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[cfg.plan]}`}>
                  {cfg.plan}
                </span>
                <span className="text-sm font-poppins text-gray-600">
                  {cfg.show_price && cfg.price_ugx ? `UGX ${fmt(cfg.price_ugx)}/rep/mo` : "Custom pricing"}
                  {cfg.rep_limit ? ` · ${cfg.rep_limit} rep limit` : " · Unlimited"}
                  {cfg.setup_fee_ugx ? ` · UGX ${fmt(cfg.setup_fee_ugx)} setup` : ""}
                </span>
                {saved === cfg.plan && (
                  <span className="text-xs text-green-600 font-poppins-semibold flex items-center gap-1">
                    <LuCheck size={12} /> Saved
                  </span>
                )}
              </div>
              {open === cfg.plan ? <LuChevronUp size={15} className="text-gray-400" /> : <LuChevronDown size={15} className="text-gray-400" />}
            </button>

            {open === cfg.plan && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wider mb-1 block">Price (UGX/rep/mo)</label>
                    <input type="number" value={editing.price_ugx ?? ""} onChange={e => setEditing(v => ({ ...v, price_ugx: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="null = negotiated"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wider mb-1 block">Rep limit</label>
                    <input type="number" value={editing.rep_limit ?? ""} onChange={e => setEditing(v => ({ ...v, rep_limit: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="null = unlimited"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wider mb-1 block">Setup fee (UGX)</label>
                    <input type="number" value={editing.setup_fee_ugx ?? ""} onChange={e => setEditing(v => ({ ...v, setup_fee_ugx: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="null = custom"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wider mb-1 block">Annual discount %</label>
                    <input type="number" min={0} max={100} value={editing.annual_discount_pct ?? 0} onChange={e => setEditing(v => ({ ...v, annual_discount_pct: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-poppins focus:outline-none focus:border-[#16a34a]" />
                  </div>
                </div>

                <div className="flex gap-4 mb-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer font-poppins text-gray-600">
                    <input type="checkbox" checked={editing.show_price ?? false} onChange={e => setEditing(v => ({ ...v, show_price: e.target.checked }))} className="accent-[#16a34a]" />
                    Show price on pricing page
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-poppins text-gray-600">
                    <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing(v => ({ ...v, is_active: e.target.checked }))} className="accent-[#16a34a]" />
                    Plan active
                  </label>
                </div>

                {/* Features list */}
                <label className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Features (pricing page display only)
                </label>
                <div className="space-y-1.5 mb-3">
                  {(editing.features ?? []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={f} onChange={e => updateFeature(i, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-poppins focus:outline-none focus:border-[#16a34a]" />
                      <button onClick={() => removeFeature(i)} className="text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addFeature} className="text-xs font-poppins-semibold text-[#16a34a] hover:underline mb-4 block">
                  + Add feature
                </button>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setOpen(null)} className="px-4 py-2 text-xs font-poppins-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveConfig} disabled={saving}
                    className="px-4 py-2 text-xs font-poppins-bold bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-60">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const Subscriptions = () => {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterPlan, setFilterPlan] = useState<SaasPlan | "ALL">("ALL");
  const [editing, setEditing]     = useState<CompanyRow | null>(null);

  const load = () => {
    setLoading(true);
    getAllCompaniesWithPlanApi()
      .then(r => setCompanies(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = companies.filter(c => {
    const matchSearch = c.company_name.toLowerCase().includes(search.toLowerCase());
    const matchPlan   = filterPlan === "ALL" || c.saas_plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const counts = companies.reduce((acc, c) => {
    acc[c.saas_plan] = (acc[c.saas_plan] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins-extrabold text-xl text-gray-900">Subscriptions & Billing</h1>
          <p className="text-xs text-gray-400 font-poppins mt-0.5">{companies.length} companies · manage plans, trials, and locks</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-poppins-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <LuRefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["ALL", ...ALL_PLANS] as const).map(p => (
          <button key={p} onClick={() => setFilterPlan(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-poppins-bold transition-colors ${
              filterPlan === p
                ? "bg-[#16a34a] text-white"
                : `border border-gray-200 text-gray-500 hover:border-gray-300 ${p !== "ALL" ? PLAN_COLORS[p] : ""}`
            }`}>
            {p} {p !== "ALL" && counts[p] ? `(${counts[p]})` : p === "ALL" ? `(${companies.length})` : "(0)"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search company…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins focus:outline-none focus:border-[#16a34a]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400 font-poppins">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400 font-poppins">No companies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Company", "Plan", "Status", "Reps", "Trial / Expiry", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-poppins-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const isExpired = c.saas_plan === "TRIAL"
                    ? (c.trial_days_left !== null && c.trial_days_left < 0)
                    : (c.plan_expires_at ? new Date(c.plan_expires_at) < new Date() : false);

                  return (
                    <tr key={c.id} className={`hover:bg-gray-50/50 ${c.is_locked ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3 font-poppins-semibold text-gray-800 whitespace-nowrap">
                        {c.company_name}
                        {c.is_locked && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-poppins-bold">LOCKED</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-poppins-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[c.saas_plan]}`}>
                          {c.saas_plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.is_locked ? (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-poppins-semibold"><LuLock size={11} /> Locked</span>
                        ) : isExpired ? (
                          <span className="flex items-center gap-1 text-xs text-orange-600 font-poppins-semibold"><LuClock size={11} /> Expired</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-poppins-semibold"><LuBadgeCheck size={11} /> Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-poppins">{c._count.users}</td>
                      <td className="px-4 py-3 text-xs font-poppins whitespace-nowrap">
                        {c.saas_plan === "TRIAL" ? (
                          c.trial_days_left !== null ? (
                            <span className={c.trial_days_left < 0 ? "text-red-500" : c.trial_days_left <= 7 ? "text-orange-500" : "text-gray-500"}>
                              {c.trial_days_left < 0 ? `Expired ${Math.abs(c.trial_days_left)}d ago` : `${c.trial_days_left}d left`}
                              <span className="block text-gray-300">{fmtDate(c.trial_ends_at)}</span>
                            </span>
                          ) : "—"
                        ) : (
                          <span className="text-gray-500">{fmtDate(c.plan_expires_at)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-poppins whitespace-nowrap">{fmtDate(c.date_of_joining)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditing(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#16a34a] hover:bg-green-50 transition-colors" title="Edit plan">
                            <LuPencil size={13} />
                          </button>
                          <button onClick={async () => {
                            await updateCompanyPlanApi(c.id, { is_locked: !c.is_locked, lock_reason: !c.is_locked ? "Manually locked by admin" : null });
                            load();
                          }} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title={c.is_locked ? "Unlock" : "Lock"}>
                            {c.is_locked ? <LuLockOpen size={13} /> : <LuLock size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan config editor */}
      <PlanConfigEditor />

      {/* Edit modal */}
      {editing && (
        <EditPlanModal company={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
};

export default Subscriptions;
