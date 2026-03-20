import { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { FiBarChart2, FiPackage } from "react-icons/fi";
import {
  getCompanyDoctorListApi, getProductsApi,
  logCompetitorIntelApi, searchPharmaciesApi, addPharmacyActivityApi,
} from "../../services/api";

type Tab = "competitor" | "stock";

interface ProductRow { product_id: string; product_name: string; qty: number; }

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: Tab;
}

const FieldIntelGroupModal = ({ onClose, onSuccess, initialTab = "competitor" }: Props) => {
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Shared data ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<{ id: string; product_name: string }[]>([]);

  // ── Competitor Intel state ─────────────────────────────────────────────────
  const [doctors,     setDoctors]     = useState<{ id: string; doctor_name: string; town: string }[]>([]);
  const [pharmacies,  setPharmacies]  = useState<{ id: string; pharmacy_name: string; town?: string }[]>([]);
  const [pharmaSearch,  setPharmaSearch]  = useState("");
  const [doctorSearch,  setDoctorSearch]  = useState("");
  const [showDoctorList,  setShowDoctorList]  = useState(false);
  const [showPharmaList,  setShowPharmaList]  = useState(false);
  const [ciDoctorId,    setCiDoctorId]    = useState("");
  const [ciDoctorLabel, setCiDoctorLabel] = useState("");
  const [ciPharmaId,    setCiPharmaId]    = useState("");
  const [ciPharmaLabel, setCiPharmaLabel] = useState("");
  const [ciCompany,     setCiCompany]     = useState("");
  const [ciBrand,       setCiBrand]       = useState("");
  const [ciSku,         setCiSku]         = useState("");
  const [ciListed,      setCiListed]      = useState(false);
  const [ciTradePrice,  setCiTradePrice]  = useState("");
  const [ciConsPrice,   setCiConsPrice]   = useState("");
  const [ciStockQty,    setCiStockQty]    = useState("");
  const [ciNotes,       setCiNotes]       = useState("");
  const [ciLoading,     setCiLoading]     = useState(false);
  const [ciError,       setCiError]       = useState("");

  // ── Stock Capture state ────────────────────────────────────────────────────
  const [scPharmacies,   setScPharmacies]   = useState<{ id: string; pharmacy_name: string; town?: string }[]>([]);
  const [scPharmaSearch, setScPharmaSearch] = useState("");
  const [scShowList,     setScShowList]     = useState(false);
  const [scPharmaId,     setScPharmaId]     = useState("");
  const [scPharmaLabel,  setScPharmaLabel]  = useState("");
  const [scRows,         setScRows]         = useState<ProductRow[]>([]);
  const [scOutcome,      setScOutcome]      = useState("");
  const [scGpsLat,       setScGpsLat]       = useState<number | null>(null);
  const [scGpsLng,       setScGpsLng]       = useState<number | null>(null);
  const [scLoading,      setScLoading]      = useState(false);
  const [scError,        setScError]        = useState("");

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getCompanyDoctorListApi().then((r) => setDoctors(r.data.data ?? r.data)).catch(() => {});
    getProductsApi().then((r) => {
      const prods = r.data.data ?? r.data;
      setProducts(prods);
      setScRows(prods.map((p: any) => ({ product_id: p.id, product_name: p.product_name, qty: 0 })));
    }).catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setScGpsLat(pos.coords.latitude); setScGpsLng(pos.coords.longitude); },
        () => {}, { timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Competitor: pharmacy search (debounced)
  useEffect(() => {
    if (pharmaSearch.length < 2) { setPharmacies([]); return; }
    const t = setTimeout(() => {
      searchPharmaciesApi(pharmaSearch).then((r) => setPharmacies(r.data.data ?? [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [pharmaSearch]);

  // Stock: pharmacy search (debounced)
  useEffect(() => {
    if (scPharmaSearch.length < 2) { setScPharmacies([]); return; }
    const t = setTimeout(() => {
      searchPharmaciesApi(scPharmaSearch).then((r) => setScPharmacies(r.data.data ?? [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [scPharmaSearch]);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const ciFilteredDoctors = doctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(doctorSearch.toLowerCase()))
    : [];

  // ── Submit competitor intel ────────────────────────────────────────────────
  const submitCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciCompany.trim()) { setCiError("Competitor company name is required"); return; }
    if (!ciBrand.trim())   { setCiError("Competitor brand name is required");   return; }
    setCiError(""); setCiLoading(true);
    try {
      await logCompetitorIntelApi({
        competitor_company: ciCompany.trim(),
        competitor_brand:   ciBrand.trim(),
        competitor_sku:     ciSku.trim()     || undefined,
        is_listed:          ciListed,
        price_to_trade:     ciTradePrice  ? parseFloat(ciTradePrice)  : undefined,
        price_to_consumer:  ciConsPrice   ? parseFloat(ciConsPrice)   : undefined,
        stock_quantity:     ciStockQty    ? parseInt(ciStockQty)      : undefined,
        notes:              ciNotes.trim() || undefined,
        doctor_id:          ciDoctorId    || undefined,
        pharmacy_id:        ciPharmaId    || undefined,
      });
      onSuccess(); onClose();
    } catch (err: any) {
      setCiError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setCiLoading(false);
    }
  };

  // ── Submit stock capture ───────────────────────────────────────────────────
  const submitStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scPharmaId) { setScError("Select a pharmacy first"); return; }
    const filled = scRows.filter((r) => r.qty > 0);
    if (filled.length === 0) { setScError("Enter at least one product quantity"); return; }
    setScError(""); setScLoading(true);
    const stock_noted: Record<string, number> = {};
    filled.forEach((r) => { stock_noted[r.product_id] = r.qty; });
    try {
      await addPharmacyActivityApi({
        pharmacy_id: scPharmaId, stock_noted,
        outcome: scOutcome.trim() || undefined,
        gps_lat: scGpsLat, gps_lng: scGpsLng,
      });
      onSuccess(); onClose();
    } catch (err: any) {
      setScError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setScLoading(false);
    }
  };

  const updateScQty = (product_id: string, qty: number) =>
    setScRows((prev) => prev.map((r) => r.product_id === product_id ? { ...r, qty: Math.max(0, qty) } : r));

  const scFilledCount = scRows.filter((r) => r.qty > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            {tab === "competitor"
              ? <FiBarChart2 className="w-5 h-5 text-sky-400" />
              : <FiPackage  className="w-5 h-5 text-violet-400" />}
            <div>
              <h2 className="text-white font-bold text-xl leading-none">
                {tab === "competitor" ? "Competitor Intelligence" : "Stock Capture"}
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {tab === "competitor"
                  ? "Log competitor activity observed in the field"
                  : "Record product stock observed at a pharmacy"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          <button type="button" onClick={() => setTab("competitor")}
            className={`flex-1 py-3 text-xs font-bold tracking-wide focus-visible:outline-none ${
              tab === "competitor" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-400 hover:text-gray-600"
            }`}
            style={{ transition: "color 0.12s" }}>
            Competitor Intel
          </button>
          <button type="button" onClick={() => setTab("stock")}
            className={`flex-1 py-3 text-xs font-bold tracking-wide focus-visible:outline-none ${
              tab === "stock" ? "text-violet-600 border-b-2 border-violet-600" : "text-gray-400 hover:text-gray-600"
            }`}
            style={{ transition: "color 0.12s" }}>
            Stock Capture
          </button>
        </div>

        {/* ── Competitor Intel form ── */}
        {tab === "competitor" && (
          <form onSubmit={submitCompetitor} className="px-6 py-5 flex flex-col gap-4 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {ciError && <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{ciError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Competitor Company <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="e.g. Cipla, Roche" value={ciCompany}
                  onChange={(e) => setCiCompany(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Brand / Product <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="e.g. Omeprazole 20mg" value={ciBrand}
                  onChange={(e) => setCiBrand(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Pack size</label>
              <input type="text" placeholder="e.g. Tabs 10s, 500mg/5ml" value={ciSku}
                onChange={(e) => setCiSku(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Listed toggle */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCiListed((v) => !v)}
                className={`w-10 h-6 rounded-full relative shrink-0 ${ciListed ? "bg-sky-600" : "bg-gray-200"}`}
                style={{ transition: "background-color 0.2s" }}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow ${ciListed ? "left-5" : "left-1"}`}
                  style={{ transition: "left 0.2s" }} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-700">{ciListed ? "Listed / In stock here" : "Not listed / not stocked here"}</p>
                <p className="text-[11px] text-gray-400">Is this product currently stocked at this location?</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Trade Price (UGX)", val: ciTradePrice, set: setCiTradePrice },
                { label: "Consumer Price (UGX)", val: ciConsPrice, set: setCiConsPrice },
                { label: "Units on Shelf", val: ciStockQty, set: setCiStockQty },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                  <input type="number" placeholder="0" value={val} onChange={(e) => set(e.target.value)} min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              ))}
            </div>

            {/* Where observed */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">At Doctor (optional)</label>
                <input type="text" placeholder="Search doctor…"
                  value={ciDoctorLabel || doctorSearch}
                  onChange={(e) => { setCiDoctorLabel(""); setCiDoctorId(""); setDoctorSearch(e.target.value); setShowDoctorList(true); }}
                  onFocus={() => setShowDoctorList(true)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                {showDoctorList && ciFilteredDoctors.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-36 overflow-y-auto shadow-lg text-sm">
                    {ciFilteredDoctors.map((d) => (
                      <li key={d.id} className="px-3 py-2 hover:bg-sky-50 cursor-pointer"
                        onMouseDown={() => { setCiDoctorId(d.id); setCiDoctorLabel(d.doctor_name); setDoctorSearch(""); setShowDoctorList(false); }}>
                        {d.doctor_name} <span className="text-gray-400 text-xs">{d.town}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">At Pharmacy (optional)</label>
                <input type="text" placeholder="Search pharmacy…"
                  value={ciPharmaLabel || pharmaSearch}
                  onChange={(e) => { setCiPharmaLabel(""); setCiPharmaId(""); setPharmaSearch(e.target.value); setShowPharmaList(true); }}
                  onFocus={() => setShowPharmaList(true)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                {showPharmaList && pharmacies.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-36 overflow-y-auto shadow-lg text-sm">
                    {pharmacies.map((p) => (
                      <li key={p.id} className="px-3 py-2 hover:bg-sky-50 cursor-pointer"
                        onMouseDown={() => { setCiPharmaId(p.id); setCiPharmaLabel(p.pharmacy_name); setPharmaSearch(""); setShowPharmaList(false); }}>
                        {p.pharmacy_name} <span className="text-gray-400 text-xs">{p.town}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Observations</label>
              <textarea value={ciNotes} onChange={(e) => setCiNotes(e.target.value)} rows={3}
                placeholder="Doctor response, promotional materials seen, rep activity…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={ciLoading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600"
                style={{ transition: "opacity 0.15s" }}>
                {ciLoading ? "Saving…" : "Save Intelligence"}
              </button>
              <button type="button" onClick={onClose}
                className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
                style={{ transition: "background-color 0.15s" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Stock Capture form ── */}
        {tab === "stock" && (
          <form onSubmit={submitStock} className="px-6 py-5 flex flex-col gap-5 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {scError && <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{scError}</div>}

            {/* Pharmacy search */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pharmacy <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="Search pharmacy by name…"
                value={scPharmaLabel || scPharmaSearch}
                onChange={(e) => { setScPharmaLabel(""); setScPharmaId(""); setScPharmaSearch(e.target.value); setScShowList(true); }}
                onFocus={() => setScShowList(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              {scShowList && scPharmacies.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-44 overflow-y-auto custom-scrollbar shadow-lg">
                  {scPharmacies.map((p) => (
                    <li key={p.id} className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer text-sm"
                      onMouseDown={() => { setScPharmaId(p.id); setScPharmaLabel(`${p.pharmacy_name}${p.town ? " — " + p.town : ""}`); setScPharmaSearch(""); setScShowList(false); }}>
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
                {scFilledCount > 0 && (
                  <span className="text-xs text-violet-600 font-medium">{scFilledCount} product{scFilledCount !== 1 ? "s" : ""} filled</span>
                )}
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {scRows.map((row) => (
                  <div key={row.product_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="flex-1 text-sm font-medium text-gray-700 truncate">{row.product_name}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => updateScQty(row.product_id, row.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-100 focus-visible:outline-none">−</button>
                      <input type="number" min={0} value={row.qty}
                        onChange={(e) => updateScQty(row.product_id, parseInt(e.target.value) || 0)}
                        className={`w-14 text-center font-bold text-sm rounded-lg border px-2 py-1 outline-none focus:border-violet-500 ${row.qty > 0 ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600"}`}
                      />
                      <button type="button" onClick={() => updateScQty(row.product_id, row.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold flex items-center justify-center hover:bg-violet-700 focus-visible:outline-none">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Outcome</label>
              <textarea value={scOutcome} onChange={(e) => setScOutcome(e.target.value)} rows={2}
                placeholder="Any observations about stock levels, ordering plans…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={scLoading}
                className="flex-1 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
                style={{ transition: "opacity 0.15s" }}>
                {scLoading ? "Saving…" : "Save Stock Capture"}
              </button>
              <button type="button" onClick={onClose}
                className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
                style={{ transition: "background-color 0.15s" }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FieldIntelGroupModal;
