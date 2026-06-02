import { useState, useEffect, useRef } from "react";
import { FiSave, FiChevronLeft, FiChevronRight, FiPackage, FiSearch } from "react-icons/fi";
import {
  getPlacementTargetsApi,
  bulkUpsertPlacementTargetsApi,
  getCompanyProductsApi,
} from "../../../services/api";

interface Product { id: string; product_name: string; }
interface PlacementTarget {
  id: string;
  pharmacy: { id: string; pharmacy_name: string; town?: string };
  product: Product;
  target_units: number;
  pharmacy_id: string;
  product_id: string;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// cell key: "pharmacyId::productId"
type CellMap = Record<string, number>;

const StockPlacement = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [targets, setTargets]   = useState<PlacementTarget[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");

  // draft edits: "pharmacyId::productId" → units
  const [draft, setDraft] = useState<CellMap>({});
  const dirty = Object.keys(draft).length > 0;

  const load = () => {
    setLoading(true);
    setDraft({});
    Promise.all([
      getPlacementTargetsApi(month, year),
      getCompanyProductsApi(),
    ])
      .then(([tr, pr]) => {
        setTargets(tr.data.data ?? []);
        setProducts(pr.data.data ?? []);
      })
      .catch(() => setError("Failed to load placement targets"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year]);

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const items = Object.entries(draft).map(([key, target_units]) => {
        const [pharmacy_id, product_id] = key.split("::");
        return { pharmacy_id, product_id, target_units };
      });
      await bulkUpsertPlacementTargetsApi({ items, month, year });
      setDraft({});
      load();
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Build row data: group by pharmacy
  const pharmacyMap = new Map<string, { name: string; town?: string }>();
  targets.forEach((t) => {
    if (!pharmacyMap.has(t.pharmacy_id)) {
      pharmacyMap.set(t.pharmacy_id, { name: t.pharmacy.pharmacy_name, town: t.pharmacy.town });
    }
  });

  const existingMap: Record<string, number> = {};
  targets.forEach((t) => { existingMap[`${t.pharmacy_id}::${t.product_id}`] = t.target_units; });

  const pharmacyRows = Array.from(pharmacyMap.entries())
    .filter(([, p]) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.town ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  const getVal = (pharmacyId: string, productId: string): number => {
    const key = `${pharmacyId}::${productId}`;
    return key in draft ? draft[key] : (existingMap[key] ?? 0);
  };

  const setVal = (pharmacyId: string, productId: string, val: number) => {
    const key = `${pharmacyId}::${productId}`;
    setDraft((d) => ({ ...d, [key]: val }));
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="p-6 flex flex-col gap-5 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#1a2530] tracking-tight">Stock Placement Targets</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monthly units per SKU per pharmacy</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month navigation */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-700 min-w-[80px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>

          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Saving…" : `Save ${Object.keys(draft).length} change${Object.keys(draft).length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Search */}
      <div className="relative max-w-xs">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter pharmacies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : pharmacyRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <FiPackage className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-semibold">No pharmacies with placement targets yet</p>
          <p className="text-sm mt-1">Targets will appear here once pharmacies are visited by reps</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <FiPackage className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-semibold">No products in your company</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] bg-white">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[180px] sticky left-0 bg-gray-50 z-10">
                  Pharmacy
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="text-center px-3 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider min-w-[100px]"
                  >
                    {p.product_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pharmacyRows.map(([pharmacyId, p]) => (
                <tr key={pharmacyId} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-50">
                    <p className="font-semibold text-[#1a2530] truncate max-w-[160px]">{p.name}</p>
                    {p.town && <p className="text-xs text-gray-400">{p.town}</p>}
                  </td>
                  {products.map((prod) => {
                    const val = getVal(pharmacyId, prod.id);
                    const key = `${pharmacyId}::${prod.id}`;
                    const changed = key in draft;
                    return (
                      <td key={prod.id} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => setVal(pharmacyId, prod.id, parseInt(e.target.value) || 0)}
                          className={`w-20 text-center px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] ${
                            changed
                              ? "border-[#16a34a]/40 bg-[#f0fdf4] font-semibold text-[#16a34a]"
                              : "border-gray-200 bg-white text-gray-700"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockPlacement;
