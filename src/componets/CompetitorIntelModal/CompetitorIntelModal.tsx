import { useState, useEffect } from "react";
import { FaXmark, FaCheck } from "react-icons/fa6";
import { FiBarChart2 } from "react-icons/fi";
import { getCompanyDoctorListApi, getProductsApi, logCompetitorIntelApi, searchPharmaciesApi } from "../../services/api";

interface CompetitorIntelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CompetitorIntelModal = ({ onClose, onSuccess }: CompetitorIntelModalProps) => {
  const [products, setProducts] = useState<{ id: string; product_name: string }[]>([]);
  const [doctors,  setDoctors]  = useState<{ id: string; doctor_name: string; town: string }[]>([]);
  const [pharmacies, setPharmacies] = useState<{ id: string; pharmacy_name: string; town?: string }[]>([]);
  const [pharmaSearch, setPharmaSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorList,  setShowDoctorList]  = useState(false);
  const [showPharmaList,  setShowPharmaList]  = useState(false);
  const [doctorId,    setDoctorId]    = useState("");
  const [doctorLabel, setDoctorLabel] = useState("");
  const [pharmacyId,    setPharmacyId]    = useState("");
  const [pharmacyLabel, setPharmacyLabel] = useState("");

  const [competitorCompany, setCompetitorCompany] = useState("");
  const [competitorBrand,   setCompetitorBrand]   = useState("");
  const [competitorSku,     setCompetitorSku]     = useState("");
  const [isListed,          setIsListed]          = useState(false);
  const [priceToTrade,      setPriceToTrade]      = useState("");
  const [priceToConsumer,   setPriceToConsumer]   = useState("");
  const [stockQty,          setStockQty]          = useState("");
  const [notes,             setNotes]             = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getCompanyDoctorListApi().then((r) => setDoctors(r.data.data ?? r.data)).catch(() => {});
    getProductsApi().then((r) => setProducts(r.data.data ?? r.data)).catch(() => {});
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

  const filteredDoctors = doctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(doctorSearch.toLowerCase()))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorCompany.trim()) { setError("Competitor company name is required"); return; }
    if (!competitorBrand.trim())   { setError("Competitor brand name is required");   return; }
    setError("");
    setLoading(true);
    try {
      await logCompetitorIntelApi({
        competitor_company:  competitorCompany.trim(),
        competitor_brand:    competitorBrand.trim(),
        competitor_sku:      competitorSku.trim() || undefined,
        is_listed:           isListed,
        price_to_trade:      priceToTrade    ? parseFloat(priceToTrade)    : undefined,
        price_to_consumer:   priceToConsumer ? parseFloat(priceToConsumer) : undefined,
        stock_quantity:      stockQty        ? parseInt(stockQty)          : undefined,
        notes:               notes.trim() || undefined,
        doctor_id:           doctorId   || undefined,
        pharmacy_id:         pharmacyId || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-sky-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl leading-none">Competitor Intelligence</h2>
              <p className="text-sky-100 text-[11px] mt-0.5">Log competitor activity observed in the field</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
          )}

          {/* Competitor details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Competitor Company <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="e.g. Cipla, Roche" value={competitorCompany}
                onChange={(e) => setCompetitorCompany(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand / Product <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="e.g. Omeprazole 20mg" value={competitorBrand}
                onChange={(e) => setCompetitorBrand(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Pack size</label>
            <input type="text" placeholder="e.g. Tabs 10s, 500mg/5ml" value={competitorSku}
              onChange={(e) => setCompetitorSku(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Listed toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsListed((v) => !v)}
              className={`w-10 h-6 rounded-full relative shrink-0 ${isListed ? 'bg-sky-600' : 'bg-gray-200'}`}
              style={{ transition: 'background-color 0.2s' }}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow ${isListed ? 'left-5' : 'left-1'}`}
                style={{ transition: 'left 0.2s' }} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-700">{isListed ? "Listed / In stock here" : "Not listed / not stocked here"}</p>
              <p className="text-[11px] text-gray-400">Is this product currently stocked at this location?</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Trade Price (UGX)</label>
              <input type="number" placeholder="0" value={priceToTrade}
                onChange={(e) => setPriceToTrade(e.target.value)} min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Consumer Price (UGX)</label>
              <input type="number" placeholder="0" value={priceToConsumer}
                onChange={(e) => setPriceToConsumer(e.target.value)} min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Units on Shelf</label>
              <input type="number" placeholder="0" value={stockQty}
                onChange={(e) => setStockQty(e.target.value)} min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Where observed */}
          <div className="grid grid-cols-2 gap-3">
            {/* Doctor */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1">At Doctor (optional)</label>
              <input type="text" placeholder="Search doctor…"
                value={doctorLabel || doctorSearch}
                onChange={(e) => { setDoctorLabel(""); setDoctorId(""); setDoctorSearch(e.target.value); setShowDoctorList(true); }}
                onFocus={() => setShowDoctorList(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {showDoctorList && filteredDoctors.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-36 overflow-y-auto shadow-lg text-sm">
                  {filteredDoctors.map((d) => (
                    <li key={d.id} className="px-3 py-2 hover:bg-sky-50 cursor-pointer"
                      onMouseDown={() => { setDoctorId(d.id); setDoctorLabel(d.doctor_name); setDoctorSearch(""); setShowDoctorList(false); }}>
                      {d.doctor_name} <span className="text-gray-400 text-xs">{d.town}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pharmacy */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1">At Pharmacy (optional)</label>
              <input type="text" placeholder="Search pharmacy…"
                value={pharmacyLabel || pharmaSearch}
                onChange={(e) => { setPharmacyLabel(""); setPharmacyId(""); setPharmaSearch(e.target.value); setShowPharmaList(true); }}
                onFocus={() => setShowPharmaList(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {showPharmaList && pharmacies.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-36 overflow-y-auto shadow-lg text-sm">
                  {pharmacies.map((p) => (
                    <li key={p.id} className="px-3 py-2 hover:bg-sky-50 cursor-pointer"
                      onMouseDown={() => { setPharmacyId(p.id); setPharmacyLabel(p.pharmacy_name); setPharmaSearch(""); setShowPharmaList(false); }}>
                      {p.pharmacy_name} <span className="text-gray-400 text-xs">{p.town}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Observations</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Doctor response, promotional materials seen, rep activity…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600"
              style={{ transition: 'opacity 0.15s' }}>
              {loading ? "Saving…" : "Save Intelligence"}
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

export default CompetitorIntelModal;
