import { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { FiPackage } from "react-icons/fi";
import { getProductsApi, searchPharmaciesApi, addPharmacyActivityApi } from "../../services/api";

interface StockCaptureModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductRow {
  product_id: string;
  product_name: string;
  qty: number;
}

const StockCaptureModal = ({ onClose, onSuccess }: StockCaptureModalProps) => {
  const [products,  setProducts]  = useState<{ id: string; product_name: string }[]>([]);
  const [pharmacies, setPharmacies] = useState<{ id: string; pharmacy_name: string; town?: string }[]>([]);
  const [pharmaSearch, setPharmaSearch] = useState("");
  const [showPharmaList, setShowPharmaList] = useState(false);
  const [pharmacyId,    setPharmacyId]    = useState("");
  const [pharmacyLabel, setPharmacyLabel] = useState("");
  const [rows, setRows]   = useState<ProductRow[]>([]);
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLat,  setGpsLat]  = useState<number | null>(null);
  const [gpsLng,  setGpsLng]  = useState<number | null>(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getProductsApi()
      .then((r) => {
        const prods = r.data.data ?? r.data;
        setProducts(prods);
        // Pre-populate all products with qty 0
        setRows(prods.map((p: any) => ({ product_id: p.id, product_name: p.product_name, qty: 0 })));
      })
      .catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); },
        () => {},
        { timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    if (pharmaSearch.length < 2) { setPharmacies([]); return; }
    const t = setTimeout(() => {
      searchPharmaciesApi(pharmaSearch)
        .then((r) => setPharmacies(r.data.data ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [pharmaSearch]);

  const updateQty = (product_id: string, qty: number) => {
    setRows((prev) => prev.map((r) => r.product_id === product_id ? { ...r, qty: Math.max(0, qty) } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) { setError("Select a pharmacy first"); return; }
    const filledRows = rows.filter((r) => r.qty > 0);
    if (filledRows.length === 0) { setError("Enter at least one product quantity"); return; }
    setError("");
    setLoading(true);

    const stock_noted: Record<string, number> = {};
    filledRows.forEach((r) => { stock_noted[r.product_id] = r.qty; });

    try {
      await addPharmacyActivityApi({
        pharmacy_id: pharmacyId,
        stock_noted,
        outcome: outcome.trim() || undefined,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const filledCount = rows.filter((r) => r.qty > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-violet-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <FiPackage className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl leading-none">Stock Capture</h2>
              <p className="text-violet-100 text-[11px] mt-0.5">Record product stock observed at this pharmacy</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
          )}

          {/* Pharmacy search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pharmacy <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="Search pharmacy by name…"
              value={pharmacyLabel || pharmaSearch}
              onChange={(e) => { setPharmacyLabel(""); setPharmacyId(""); setPharmaSearch(e.target.value); setShowPharmaList(true); }}
              onFocus={() => setShowPharmaList(true)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            {showPharmaList && pharmacies.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-44 overflow-y-auto custom-scrollbar shadow-lg">
                {pharmacies.map((p) => (
                  <li key={p.id} className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer text-sm"
                    onMouseDown={() => { setPharmacyId(p.id); setPharmacyLabel(`${p.pharmacy_name}${p.town ? ' — ' + p.town : ''}`); setPharmaSearch(""); setShowPharmaList(false); }}>
                    <span className="font-medium">{p.pharmacy_name}</span>
                    {p.town && <span className="text-gray-400 ml-2 text-xs">{p.town}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Product stock grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Units on Shelf</label>
              {filledCount > 0 && (
                <span className="text-xs text-violet-600 font-medium">{filledCount} product{filledCount !== 1 ? 's' : ''} filled</span>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {rows.map((row) => (
                <div key={row.product_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-sm font-medium text-gray-700 truncate">{row.product_name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button"
                      onClick={() => updateQty(row.product_id, row.qty - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-100 focus-visible:outline-none">
                      −
                    </button>
                    <input type="number" min={0} value={row.qty}
                      onChange={(e) => updateQty(row.product_id, parseInt(e.target.value) || 0)}
                      className={`w-14 text-center font-bold text-sm rounded-lg border px-2 py-1 outline-none focus:border-violet-500 ${row.qty > 0 ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-600'}`}
                    />
                    <button type="button"
                      onClick={() => updateQty(row.product_id, row.qty + 1)}
                      className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center hover:bg-violet-700 focus-visible:outline-none">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Outcome</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2}
              placeholder="Any observations about stock levels, ordering plans…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
              style={{ transition: 'opacity 0.15s' }}>
              {loading ? "Saving…" : "Save Stock Capture"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: 'background-color 0.15s' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockCaptureModal;
