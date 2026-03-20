import { useEffect, useState, useCallback } from "react";
import { LuPencil, LuCheck, LuX, LuChevronDown, LuChevronRight } from "react-icons/lu";
// LuCheck + LuX used in RepTargetRow inline edit; LuPencil used in rep product rows
import { TbChartBar } from "react-icons/tb";
import { IoWarningOutline } from "react-icons/io5";
import { MdOutlineGroupAdd } from "react-icons/md";
import {
  getTeamPerformanceApi,
  getProductTeamTargetsApi,
  setProductTargetApi,
  setBulkProductTargetsApi,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RepPerf {
  user: { id: string; firstname: string; lastname: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_visits_done: number;
  cycle_total_target: number;
  cycle_adherence_pct: number | null;
  last_visit_date: string | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
  pending_expenses: number;
}

interface Product {
  id: string;
  product_name: string;
  unit_price: number;
}

interface ProductTargetEntry {
  product: Product;
  target: { id: string; target_units: number } | null;
}

interface RepTargetRow {
  user: { id: string; firstname: string; lastname: string };
  product_targets: ProductTargetEntry[];
  month: number;
  year: number;
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Performance card ─────────────────────────────────────────────────────────
const PerfCard = ({ rep }: { rep: RepPerf }) => {
  const pct = rep.cycle_adherence_pct;
  const adherenceColor =
    pct === null ? "bg-gray-200" :
    pct >= 80 ? "bg-[#16a34a]" :
    pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const overdue = rep.days_since_last_visit !== null && rep.days_since_last_visit > 3;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#f0fdf4] flex items-center justify-center text-xs font-bold text-[#16a34a] shrink-0">
          {rep.user.firstname[0]}{rep.user.lastname[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#1a1a1a] truncate">{rep.user.firstname} {rep.user.lastname}</p>
          <p className="text-xs text-gray-400">Medical Rep</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {rep.gps_anomaly_count_week > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">⚠ {rep.gps_anomaly_count_week}</span>
          )}
          {rep.pending_reports > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{rep.pending_reports} rpt</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Today", value: rep.visits_today },
          { label: "Week", value: rep.visits_this_week },
          { label: "Month", value: rep.visits_this_month },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 rounded-xl py-2">
            <p className="text-lg font-black text-[#1a1a1a] leading-none">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Cycle adherence</span>
          <span className="font-semibold text-[#1a1a1a]">
            {pct !== null ? `${pct}%` : "—"} ({rep.cycle_visits_done}/{rep.cycle_total_target})
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${adherenceColor}`}
            style={{ width: `${Math.min(pct ?? 0, 100)}%`, transition: "width 0.4s" }} />
        </div>
      </div>
      <p className={`text-xs ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
        {rep.days_since_last_visit === null ? "No visits recorded"
          : rep.days_since_last_visit === 0 ? "Last visit: today"
          : `Last visit: ${rep.days_since_last_visit}d ago${overdue ? " ⚠" : ""}`}
      </p>
    </div>
  );
};

// ─── Product price row (read-only for supervisors) ────────────────────────────
const ProductPriceRow = ({ product }: { product: Product }) => (
  <div className="flex items-center gap-3 py-2.5 px-4 border-b border-gray-50 last:border-0">
    <div className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
    <span className="text-sm font-medium text-[#1a1a1a] flex-1 min-w-0 truncate">{product.product_name}</span>
    <span className="text-sm font-semibold text-[#1a1a1a] shrink-0">
      {product.unit_price > 0 ? `UGX ${product.unit_price.toLocaleString()}` : <span className="text-gray-300 font-normal text-xs">Price not set</span>}
    </span>
  </div>
);

// ─── Rep target row (expandable, per-product) ─────────────────────────────────
const RepTargetRow = ({
  row, month, year, onSave,
}: {
  row: RepTargetRow;
  month: number;
  year: number;
  onSave: (userId: string, productId: string, units: number) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [draftUnits, setDraftUnits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const totalUnits = row.product_targets.reduce((s, pt) => s + (pt.target?.target_units ?? 0), 0);
  const totalValue = row.product_targets.reduce(
    (s, pt) => s + (pt.target?.target_units ?? 0) * pt.product.unit_price, 0
  );

  const startEdit = (pt: ProductTargetEntry) => {
    setDraftUnits(prev => ({ ...prev, [pt.product.id]: pt.target?.target_units ?? 0 }));
    setEditingProduct(pt.product.id);
  };

  const save = async (pt: ProductTargetEntry) => {
    setSaving(pt.product.id);
    await onSave(row.user.id, pt.product.id, draftUnits[pt.product.id] ?? 0);
    setSaving(null);
    setEditingProduct(null);
  };

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Rep header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        style={{ transition: "background-color 0.15s" }}
      >
        <div className="w-8 h-8 rounded-full bg-[#f0fdf4] flex items-center justify-center text-xs font-bold text-[#16a34a] shrink-0">
          {row.user.firstname[0]}{row.user.lastname[0]}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{row.user.firstname} {row.user.lastname}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalUnits > 0
              ? `${totalUnits.toLocaleString()} units · UGX ${totalValue.toLocaleString()}`
              : "No targets set"}
          </p>
        </div>
        <div className="shrink-0 text-gray-400">
          {open ? <LuChevronDown className="w-4 h-4" /> : <LuChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded per-product targets */}
      {open && (
        <div className="bg-gray-50/40 border-t border-gray-100">
          {row.product_targets.length === 0 ? (
            <p className="text-xs text-gray-400 px-10 py-3">No products configured</p>
          ) : (
            row.product_targets.map((pt) => {
              const isEditing = editingProduct === pt.product.id;
              const isSaving = saving === pt.product.id;
              return (
                <div key={pt.product.id} className="flex items-center gap-3 px-10 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600 flex-1 min-w-0 truncate">{pt.product.product_name}</span>
                  <span className="text-xs text-gray-400 w-32 text-right shrink-0">
                    {pt.product.unit_price > 0 ? `@ UGX ${pt.product.unit_price.toLocaleString()}` : ""}
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number" min={0}
                        value={draftUnits[pt.product.id] ?? 0}
                        onChange={e => setDraftUnits(prev => ({ ...prev, [pt.product.id]: Number(e.target.value) }))}
                        className="w-20 text-center text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]"
                        autoFocus
                      />
                      <span className="text-xs text-gray-400">units</span>
                      <button onClick={() => save(pt)} disabled={isSaving}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
                        style={{ transition: "background-color 0.15s" }}>
                        {isSaving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <LuCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingProduct(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-[#1a1a1a] w-16 text-right">
                        {pt.target?.target_units ? pt.target.target_units.toLocaleString() : <span className="text-gray-300 font-normal">—</span>}
                      </span>
                      <button onClick={() => startEdit(pt)}
                        className="p-1.5 text-gray-400 hover:text-[#16a34a] rounded-lg hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s, color 0.15s" }}>
                        <LuPencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ─── Set All Reps panel ───────────────────────────────────────────────────────
const SetAllPanel = ({
  products, month, year, onApply, onClose,
}: {
  products: Product[];
  month: number;
  year: number;
  onApply: (items: { product_id: string; target_units: number }[]) => Promise<void>;
  onClose: () => void;
}) => {
  const [units, setUnits] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 0]))
  );
  const [saving, setSaving] = useState(false);

  const totalValue = products.reduce((s, p) => s + (units[p.id] ?? 0) * p.unit_price, 0);

  const apply = async () => {
    setSaving(true);
    const items = products.map(p => ({ product_id: p.id, target_units: units[p.id] ?? 0 }));
    await onApply(items);
    setSaving(false);
    onClose();
  };

  return (
    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#1a1a1a]">Set targets for all reps</p>
          <p className="text-xs text-gray-500 mt-0.5">Enter per-product units — this will apply to every rep. You can adjust individuals below.</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
          style={{ transition: "background-color 0.15s" }}>
          <LuX className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#dcfce7] overflow-hidden mb-3">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-[#1a1a1a] flex-1 min-w-0 truncate">{p.product_name}</span>
            {p.unit_price > 0 && (
              <span className="text-xs text-gray-400 shrink-0">@ UGX {p.unit_price.toLocaleString()}</span>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number" min={0} value={units[p.id] ?? 0}
                onChange={e => setUnits(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                className="w-20 text-center text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]"
              />
              <span className="text-xs text-gray-400 w-8">units</span>
            </div>
          </div>
        ))}
      </div>

      {totalValue > 0 && (
        <p className="text-xs text-[#16a34a] font-semibold mb-3">
          Total value per rep: UGX {totalValue.toLocaleString()}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button onClick={apply} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdOutlineGroupAdd className="w-4 h-4" />}
          Apply to all reps
        </button>
        <button onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-xl text-gray-500 hover:bg-white border border-transparent hover:border-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, border-color 0.15s" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Analysis = () => {
  const [perf, setPerf] = useState<RepPerf[]>([]);
  const [repTargets, setRepTargets] = useState<RepTargetRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [showSetAll, setShowSetAll] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loadPerf = useCallback(() => {
    setLoadingPerf(true);
    getTeamPerformanceApi()
      .then(r => setPerf(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPerf(false));
  }, []);

  const loadTargets = useCallback(() => {
    setLoadingTargets(true);
    getProductTeamTargetsApi(month, year)
      .then(r => {
        setRepTargets(r.data?.data ?? []);
        setProducts(r.data?.products ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingTargets(false));
  }, [month, year]);

  useEffect(() => { loadPerf(); loadTargets(); }, [loadPerf, loadTargets]);

  const handleSaveProductTarget = async (userId: string, productId: string, units: number) => {
    await setProductTargetApi({ user_id: userId, product_id: productId, month, year, target_units: units });
    setRepTargets(prev => prev.map(row => {
      if (row.user.id !== userId) return row;
      return {
        ...row,
        product_targets: row.product_targets.map(pt =>
          pt.product.id === productId
            ? { ...pt, target: { ...(pt.target ?? { id: "" }), target_units: units } }
            : pt
        ),
      };
    }));
  };

  const handleBulkApply = async (items: { product_id: string; target_units: number }[]) => {
    await setBulkProductTargetsApi({ items, month, year });
    await loadTargets();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <TbChartBar className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Team Analysis</h1>
          <p className="text-sm text-gray-500">Performance metrics and monthly targets for your reps</p>
        </div>
      </div>

      {/* ── Section 1: Performance ── */}
      <section>
        <h2 className="text-base font-bold text-[#1a1a1a] mb-4">Rep Performance</h2>
        {loadingPerf ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
          </div>
        ) : perf.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <TbChartBar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No rep data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perf.map(rep => <PerfCard key={rep.user.id} rep={rep} />)}
          </div>
        )}
      </section>

      {/* ── Section 2: Sales Targets ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1a1a1a]">Sales Targets — {MONTHS[month]} {year}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Per-product monthly unit targets. Value = units × product price.</p>
          </div>
          {!loadingTargets && products.length > 0 && !showSetAll && (
            <button
              onClick={() => setShowSetAll(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              <MdOutlineGroupAdd className="w-4 h-4" />
              Set all reps
            </button>
          )}
        </div>

        {loadingTargets ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <IoWarningOutline className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No products configured for your company yet</p>
          </div>
        ) : (
          <>
            {/* Set All panel */}
            {showSetAll && (
              <SetAllPanel
                products={products}
                month={month}
                year={year}
                onApply={handleBulkApply}
                onClose={() => setShowSetAll(false)}
              />
            )}

            {/* Product price table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product prices (UGX / unit)</p>
              </div>
              {products.map(p => (
                <ProductPriceRow key={p.id} product={p} />
              ))}
            </div>

            {/* Per-rep target table */}
            {repTargets.length === 0 ? (
              <div className="py-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                <p className="text-sm">No reps found in your company</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rep targets — click to expand</p>
                  <p className="text-xs text-gray-400">{repTargets.length} rep{repTargets.length !== 1 ? "s" : ""}</p>
                </div>
                {repTargets.map(row => (
                  <RepTargetRow
                    key={row.user.id}
                    row={row}
                    month={month}
                    year={year}
                    onSave={handleSaveProductTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Analysis;
