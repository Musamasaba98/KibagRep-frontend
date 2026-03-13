import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { getProductsApi, addPharmacyActivityApi } from "../../services/api";

interface Product { id: string; product_name: string; }
interface StockItem { product_id: string; qty: number; }

interface LogPharmacyModalProps {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLocation?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";

const LogPharmacyModal = ({
  pharmacyId,
  pharmacyName,
  pharmacyLocation,
  onClose,
  onSuccess,
}: LogPharmacyModalProps) => {
  const [products,     setProducts]     = useState<Product[]>([]);
  const [stockItems,   setStockItems]   = useState<StockItem[]>([]);
  const [outcome,      setOutcome]      = useState("");
  const [gpsLat,       setGpsLat]       = useState<number | null>(null);
  const [gpsLng,       setGpsLng]       = useState<number | null>(null);
  const [gpsStatus,    setGpsStatus]    = useState<GpsStatus>("acquiring");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setGpsStatus("acquired"); },
      () => setGpsStatus("denied"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getProductsApi().then((r) => {
      const prods: Product[] = r.data.data ?? r.data;
      setProducts(prods);
      // Pre-populate one row per product (qty 0 — rep fills in what they see)
      setStockItems(prods.map((p) => ({ product_id: p.id, qty: 0 })));
    }).catch(() => {});
  }, []);

  const updateQty = (productId: string, qty: number) =>
    setStockItems((prev) => prev.map((s) => s.product_id === productId ? { ...s, qty } : s));

  const observedCount = stockItems.filter((s) => s.qty > 0).length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const observed = stockItems.filter((s) => s.qty > 0);
    setError("");
    setLoading(true);
    try {
      await addPharmacyActivityApi({
        pharmacy_id:       pharmacyId,
        products_observed: observed,
        outcome,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to log pharmacy visit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const gpsIndicator = () => {
    if (gpsStatus === "acquiring") return (
      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
        <FiLoader className="w-3 h-3 animate-spin" /> Acquiring GPS…
      </span>
    );
    if (gpsStatus === "acquired") return (
      <span className="flex items-center gap-1 text-[11px] text-violet-200 font-medium">
        <FiMapPin className="w-3 h-3" /> GPS acquired
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[11px] text-violet-300 font-medium">
        <FiAlertTriangle className="w-3 h-3" /> GPS unavailable
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">

        {/* Header — violet scheme for pharmacies */}
        <div className="flex items-center justify-between bg-violet-600 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <TbPill className="w-5 h-5 text-white/80" />
              <h2 className="text-white font-bold text-lg leading-tight">{pharmacyName}</h2>
            </div>
            {pharmacyLocation && (
              <p className="text-violet-200 text-xs mt-0.5">{pharmacyLocation}</p>
            )}
            <div className="mt-1">{gpsIndicator()}</div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Stock observed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Stock on shelf</label>
              {observedCount > 0 && (
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                  {observedCount} product{observedCount > 1 ? "s" : ""} found
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">Enter the quantity you see on shelf. Leave at 0 if not stocked.</p>
            <div className="flex flex-col gap-2">
              {products.map((p) => {
                const item = stockItems.find((s) => s.product_id === p.id);
                const qty = item?.qty ?? 0;
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${qty > 0 ? "border-violet-200 bg-violet-50/40" : "border-gray-100 bg-gray-50/40"}`}>
                    <span className="flex-1 text-sm font-medium text-[#222f36] truncate">{p.product_name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button"
                        onClick={() => updateQty(p.id, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-base flex items-center justify-center hover:bg-gray-100 focus-visible:outline-none">
                        −
                      </button>
                      <span className={`w-8 text-center font-bold text-sm ${qty > 0 ? "text-violet-600" : "text-gray-300"}`}>
                        {qty}
                      </span>
                      <button type="button"
                        onClick={() => updateQty(p.id, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-base flex items-center justify-center focus-visible:outline-none">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Outcome</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3}
              placeholder="Orders placed? Stock issues? Key observations from this pharmacy…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
              style={{ transition: "opacity 0.15s" }}>
              {loading ? "Saving…" : "Log Pharmacy Visit"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: "background-color 0.15s" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogPharmacyModal;
