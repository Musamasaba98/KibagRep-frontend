import { useEffect, useState } from "react";
import { FaXmark, FaCheck, FaPlus, FaTrash } from "react-icons/fa6";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { getCompanyDoctorListApi, getProductsApi, addDoctorActivityApi } from "../../services/api";

interface Doctor  { id: string; doctor_name: string; town: string; }
interface Product { id: string; product_name: string; }

interface SampleItem { product_id: string; qty: number; }

interface LogVisitModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialDoctorId?: string;
  initialDoctorLabel?: string;
}

type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";

const LogVisitModal = ({ onClose, onSuccess, initialDoctorId = "", initialDoctorLabel = "" }: LogVisitModalProps) => {
  const [doctors,  setDoctors]  = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [doctorSearch,    setDoctorSearch]    = useState("");
  const [showDoctorList,  setShowDoctorList]  = useState(false);

  const [doctorId,          setDoctorId]          = useState(initialDoctorId);
  const [doctorLabel,       setDoctorLabel]       = useState(initialDoctorLabel);
  const [focusedProductId,  setFocusedProductId]  = useState("");
  const [productsDetailed,  setProductsDetailed]  = useState<string[]>([]);

  // ── Per-product samples ───────────────────────────────────────────────────
  // sampleItems[0] is always the focused product (auto-synced)
  // Additional rows are for other products
  const [focusedSamples,   setFocusedSamples]   = useState(0);
  const [extraSamples,     setExtraSamples]     = useState<SampleItem[]>([]);
  const [showExtraSamples, setShowExtraSamples] = useState(false);

  const [outcome, setOutcome] = useState("");

  const [gpsLat,    setGpsLat]    = useState<number | null>(null);
  const [gpsLng,    setGpsLng]    = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setGpsStatus("acquired"); },
      () => setGpsStatus("denied"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getCompanyDoctorListApi().then((r) => setDoctors(r.data.data ?? r.data)).catch(() => {});
    getProductsApi().then((r) => setProducts(r.data.data ?? r.data)).catch(() => {});
  }, []);

  const filteredDoctors = doctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(doctorSearch.toLowerCase()))
    : [];

  const toggleProduct = (id: string) =>
    setProductsDetailed((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // Products not yet assigned in extra samples rows
  const availableForExtra = products.filter(
    (p) => p.id !== focusedProductId && !extraSamples.find((s) => s.product_id === p.id)
  );

  const addExtraRow = () => {
    const first = availableForExtra[0];
    if (!first) return;
    setExtraSamples((prev) => [...prev, { product_id: first.id, qty: 0 }]);
    setShowExtraSamples(true);
  };

  const removeExtraRow = (idx: number) =>
    setExtraSamples((prev) => prev.filter((_, i) => i !== idx));

  const updateExtraRow = (idx: number, field: keyof SampleItem, value: string | number) =>
    setExtraSamples((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const totalSamples = focusedSamples + extraSamples.reduce((s, r) => s + r.qty, 0);

  const focusedProductName = products.find((p) => p.id === focusedProductId)?.product_name ?? "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorId)         { setError("Select a doctor first");         return; }
    if (!focusedProductId) { setError("Select the focused product");    return; }
    setError("");
    setLoading(true);
    try {
      const samplesBreakdown: SampleItem[] = [
        { product_id: focusedProductId, qty: focusedSamples },
        ...extraSamples.filter((s) => s.qty > 0),
      ];
      const res = await addDoctorActivityApi({
        doctor_id:          doctorId,
        focused_product_id: focusedProductId,
        products_detailed:  productsDetailed,
        samples_given:      totalSamples,
        samples_breakdown:  samplesBreakdown,
        outcome,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });
      if (res.data.gps_anomaly) {
        setError("⚠️ GPS anomaly: your location is >500m from the doctor's registered facility. Visit saved — supervisor will be notified.");
        setTimeout(() => { onSuccess(); onClose(); }, 3000);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to log visit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const gpsIndicator = () => {
    if (gpsStatus === "acquiring") return (
      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
        <FiLoader className="w-3 h-3 animate-spin" /> Acquiring GPS…
      </span>
    );
    if (gpsStatus === "acquired") return (
      <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium">
        <FiMapPin className="w-3 h-3" /> GPS acquired
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
        <FiAlertTriangle className="w-3 h-3" /> GPS unavailable
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-[#16a34a] px-6 py-4">
          <div>
            <h2 className="text-white font-bold text-xl">Log Doctor Visit</h2>
            <div className="mt-0.5">{gpsIndicator()}</div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className={`border text-sm px-3 py-2 rounded-md ${error.startsWith("⚠️") ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {error}
            </div>
          )}

          {/* Doctor search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Doctor <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="Search by name or town…"
              value={doctorLabel || doctorSearch}
              onChange={(e) => { setDoctorLabel(""); setDoctorId(""); setDoctorSearch(e.target.value); setShowDoctorList(true); }}
              onFocus={() => setShowDoctorList(true)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
            {showDoctorList && filteredDoctors.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-lg">
                {filteredDoctors.map((doc) => (
                  <li key={doc.id} className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm"
                    onMouseDown={() => { setDoctorId(doc.id); setDoctorLabel(`${doc.doctor_name} — ${doc.town}`); setDoctorSearch(""); setShowDoctorList(false); }}>
                    <span className="font-medium">{doc.doctor_name}</span>
                    {doc.town && <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>}
                  </li>
                ))}
              </ul>
            )}
            {showDoctorList && doctorSearch.length >= 2 && filteredDoctors.length === 0 && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 px-4 py-3 text-sm text-gray-400 shadow">No doctors found</div>
            )}
          </div>

          {/* Focused product */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Focused Product <span className="text-red-500">*</span>
            </label>
            <select value={focusedProductId}
              onChange={(e) => { setFocusedProductId(e.target.value); setFocusedSamples(0); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]">
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>

            {/* Inline sample qty for focused product */}
            {focusedProductId && (
              <div className="flex items-center gap-3 mt-2 pl-1">
                <span className="text-xs text-gray-500 shrink-0">Samples of <span className="font-semibold text-[#16a34a]">{focusedProductName}</span></span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setFocusedSamples((n) => Math.max(0, n - 1))}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base flex items-center justify-center focus-visible:outline-none">−</button>
                  <span className="w-8 text-center font-bold text-[#16a34a] text-sm">{focusedSamples}</span>
                  <button type="button" onClick={() => setFocusedSamples((n) => n + 1)}
                    className="w-7 h-7 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-base flex items-center justify-center focus-visible:outline-none">+</button>
                </div>
              </div>
            )}
          </div>

          {/* All products detailed */}
          {products.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">All Products Detailed</label>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => {
                  const selected = productsDetailed.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${selected ? "bg-[#16a34a] border-[#16a34a] text-white" : "bg-white border-gray-300 text-gray-600 hover:border-[#16a34a]"}`}
                      style={{ transition: "background-color 0.15s, color 0.15s" }}>
                      {selected && <FaCheck className="w-3 h-3" />}
                      {p.product_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional product samples */}
          <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
            <button type="button"
              onClick={() => extraSamples.length > 0 ? setShowExtraSamples((v) => !v) : addExtraRow()}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 focus-visible:outline-none"
              style={{ transition: "background-color 0.15s" }}>
              <span className="flex items-center gap-2">
                <FaPlus className="w-3 h-3 text-[#16a34a]" />
                Samples for other products
                {extraSamples.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#f0fdf4] text-[#16a34a] font-bold border border-[#dcfce7]">
                    {extraSamples.reduce((s,r) => s + r.qty, 0)} units
                  </span>
                )}
              </span>
              {extraSamples.length > 0 && (
                showExtraSamples ? <MdExpandLess className="w-4 h-4" /> : <MdExpandMore className="w-4 h-4" />
              )}
            </button>

            {showExtraSamples && extraSamples.length > 0 && (
              <div className="px-4 pb-3 flex flex-col gap-2 border-t border-dashed border-gray-200 pt-3">
                {extraSamples.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select value={row.product_id}
                      onChange={(e) => updateExtraRow(idx, "product_id", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-[#16a34a]">
                      <option value={row.product_id}>
                        {products.find((p) => p.id === row.product_id)?.product_name ?? "Select…"}
                      </option>
                      {availableForExtra
                        .filter((p) => p.id !== row.product_id)
                        .map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                    </select>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => updateExtraRow(idx, "qty", Math.max(0, row.qty - 1))}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center">−</button>
                      <span className="w-7 text-center font-bold text-sm text-[#16a34a]">{row.qty}</span>
                      <button type="button" onClick={() => updateExtraRow(idx, "qty", row.qty + 1)}
                        className="w-6 h-6 rounded bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm flex items-center justify-center">+</button>
                    </div>
                    <button type="button" onClick={() => removeExtraRow(idx)}
                      className="text-gray-300 hover:text-red-400 focus-visible:outline-none shrink-0"
                      style={{ transition: "color 0.15s" }}>
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {availableForExtra.length > 0 && (
                  <button type="button" onClick={addExtraRow}
                    className="flex items-center gap-1 text-xs text-[#16a34a] font-semibold hover:underline mt-1 focus-visible:outline-none">
                    <FaPlus className="w-3 h-3" /> Add another product
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Samples total badge */}
          {totalSamples > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 -mt-2">
              <span>Total samples this visit:</span>
              <span className="font-black text-[#16a34a] text-sm">{totalSamples}</span>
            </div>
          )}

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Outcome / Notes</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3}
              placeholder="How did the visit go? Any follow-up needed?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "opacity 0.15s" }}>
              {loading ? "Saving…" : "Log Visit"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: "background-color 0.15s" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogVisitModal;
