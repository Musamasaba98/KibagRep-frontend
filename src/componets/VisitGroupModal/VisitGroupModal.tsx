import { useState, useEffect } from "react";
import { FaXmark, FaCheck, FaPlus, FaTrash } from "react-icons/fa6";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { getCompanyDoctorListApi, getDoctorsApi, getProductsApi, addDoctorActivityApi } from "../../services/api";

type Tab = "planned" | "unplanned";
type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";
interface Doctor  { id: string; doctor_name: string; town: string; }
interface Product { id: string; product_name: string; }
interface SampleItem { product_id: string; qty: number; }

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialDoctorId?: string;
  initialDoctorLabel?: string;
  initialTab?: Tab;
}

const VisitGroupModal = ({ onClose, onSuccess, initialDoctorId = "", initialDoctorLabel = "", initialTab = "planned" }: Props) => {
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Shared data ────────────────────────────────────────────────────────────
  const [companyDoctors, setCompanyDoctors] = useState<Doctor[]>([]);
  const [allDoctors,     setAllDoctors]     = useState<Doctor[]>([]);
  const [products,       setProducts]       = useState<Product[]>([]);

  // ── GPS ────────────────────────────────────────────────────────────────────
  const [gpsLat,    setGpsLat]    = useState<number | null>(null);
  const [gpsLng,    setGpsLng]    = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");

  // ── Planned tab state ──────────────────────────────────────────────────────
  const [pDoctorId,       setPDoctorId]       = useState(initialDoctorId);
  const [pDoctorLabel,    setPDoctorLabel]    = useState(initialDoctorLabel);
  const [pDoctorSearch,   setPDoctorSearch]   = useState("");
  const [pShowList,       setPShowList]       = useState(false);
  const [pFocusedProd,    setPFocusedProd]    = useState("");
  const [pProdsDetailed,  setPProdsDetailed]  = useState<string[]>([]);
  const [pFocusedSamples, setPFocusedSamples] = useState(0);
  const [pExtraSamples,   setPExtraSamples]   = useState<SampleItem[]>([]);
  const [pShowExtra,      setPShowExtra]      = useState(false);
  const [pOutcome,        setPOutcome]        = useState("");
  const [pLoading,        setPLoading]        = useState(false);
  const [pError,          setPError]          = useState("");

  // ── Unplanned tab state ────────────────────────────────────────────────────
  const [uDoctorId,      setUDoctorId]      = useState("");
  const [uDoctorLabel,   setUDoctorLabel]   = useState("");
  const [uDoctorSearch,  setUDoctorSearch]  = useState("");
  const [uShowList,      setUShowList]      = useState(false);
  const [uFocusedProd,   setUFocusedProd]   = useState("");
  const [uProdsDetailed, setUProdsDetailed] = useState<string[]>([]);
  const [uSamples,       setUSamples]       = useState(0);
  const [uOutcome,       setUOutcome]       = useState("");
  const [uLoading,       setULoading]       = useState(false);
  const [uError,         setUError]         = useState("");

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setGpsStatus("acquired"); },
      () => setGpsStatus("denied"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getCompanyDoctorListApi().then((r) => setCompanyDoctors(r.data.data ?? r.data)).catch(() => {});
    getDoctorsApi().then((r) => setAllDoctors(r.data.data ?? r.data)).catch(() => {});
    getProductsApi().then((r) => setProducts(r.data.data ?? r.data)).catch(() => {});
  }, []);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const pFiltered = pDoctorSearch.length >= 2
    ? companyDoctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(pDoctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(pDoctorSearch.toLowerCase()))
    : [];

  const uFiltered = uDoctorSearch.length >= 2
    ? allDoctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(uDoctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(uDoctorSearch.toLowerCase()))
    : [];

  // ── GPS indicator ──────────────────────────────────────────────────────────
  const GpsIndicator = () => {
    if (gpsStatus === "acquiring") return (
      <span className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
        <FiLoader className="w-3 h-3 animate-spin" /> Acquiring GPS…
      </span>
    );
    if (gpsStatus === "acquired") return (
      <span className="flex items-center gap-1 text-[11px] text-white/90 font-medium">
        <FiMapPin className="w-3 h-3" /> GPS acquired
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[11px] text-white/50 font-medium">
        <FiAlertTriangle className="w-3 h-3" /> GPS unavailable
      </span>
    );
  };

  // ── Planned: extra sample rows ─────────────────────────────────────────────
  const pAvailableForExtra = products.filter(
    (p) => p.id !== pFocusedProd && !pExtraSamples.find((s) => s.product_id === p.id)
  );
  const addPExtraRow = () => {
    const first = pAvailableForExtra[0];
    if (!first) return;
    setPExtraSamples((prev) => [...prev, { product_id: first.id, qty: 0 }]);
    setPShowExtra(true);
  };
  const removePExtraRow = (idx: number) => setPExtraSamples((prev) => prev.filter((_, i) => i !== idx));
  const updatePExtraRow = (idx: number, field: keyof SampleItem, value: string | number) =>
    setPExtraSamples((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const pTotalSamples = pFocusedSamples + pExtraSamples.reduce((s, r) => s + r.qty, 0);
  const pFocusedProdName = products.find((p) => p.id === pFocusedProd)?.product_name ?? "";

  // ── Submit planned ─────────────────────────────────────────────────────────
  const submitPlanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pDoctorId)    { setPError("Select a doctor first");      return; }
    if (!pFocusedProd) { setPError("Select the focused product"); return; }
    setPError(""); setPLoading(true);
    try {
      const samplesBreakdown: SampleItem[] = [
        { product_id: pFocusedProd, qty: pFocusedSamples },
        ...pExtraSamples.filter((s) => s.qty > 0),
      ];
      const res = await addDoctorActivityApi({
        doctor_id: pDoctorId, focused_product_id: pFocusedProd,
        products_detailed: pProdsDetailed, samples_given: pTotalSamples,
        samples_breakdown: samplesBreakdown, outcome: pOutcome,
        gps_lat: gpsLat, gps_lng: gpsLng,
      });
      if (res.data.gps_anomaly) {
        setPError("⚠️ GPS anomaly: your location is >500m from the doctor's registered facility. Visit saved — supervisor will be notified.");
        setTimeout(() => { onSuccess(); onClose(); }, 3000);
      } else {
        onSuccess(); onClose();
      }
    } catch (err: any) {
      setPError(err.response?.data?.message || "Failed to log visit. Try again.");
    } finally {
      setPLoading(false);
    }
  };

  // ── Submit unplanned ───────────────────────────────────────────────────────
  const submitUnplanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uDoctorId)    { setUError("Select a doctor first");      return; }
    if (!uFocusedProd) { setUError("Select the focused product"); return; }
    setUError(""); setULoading(true);
    try {
      const res = await addDoctorActivityApi({
        doctor_id: uDoctorId, focused_product_id: uFocusedProd,
        products_detailed: uProdsDetailed, samples_given: uSamples,
        outcome: uOutcome, gps_lat: gpsLat, gps_lng: gpsLng,
      });
      if (res.data.gps_anomaly) {
        setUError("⚠️ GPS anomaly: your location is >500m from the doctor's registered facility. Visit saved — supervisor will be notified.");
        setTimeout(() => { onSuccess(); onClose(); }, 3000);
      } else {
        onSuccess(); onClose();
      }
    } catch (err: any) {
      setUError(err.response?.data?.message || "Failed to log visit. Try again.");
    } finally {
      setULoading(false);
    }
  };

  const formClass = "px-6 py-5 flex flex-col gap-5 max-h-[68vh] overflow-y-auto custom-scrollbar";
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-[#16a34a] px-6 py-4">
          <div>
            <h2 className="text-white font-bold text-xl leading-none">
              {tab === "planned" ? "Log Doctor Visit" : "Log Unplanned Visit"}
            </h2>
            <p className="text-green-100 text-[11px] mt-0.5">
              {tab === "planned" ? "Planned call from your cycle" : "Outside your current call cycle"}
            </p>
            <div className="mt-1"><GpsIndicator /></div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {(["planned", "unplanned"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold tracking-wide focus-visible:outline-none ${
                tab === t ? "text-[#16a34a] border-b-2 border-[#16a34a]" : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ transition: "color 0.12s" }}>
              {t === "planned" ? "Log Visit" : "Unplanned"}
            </button>
          ))}
        </div>

        {/* ── Planned Visit form ── */}
        {tab === "planned" && (
          <form onSubmit={submitPlanned} className={formClass}>
            {pError && (
              <div className={`border text-sm px-3 py-2 rounded-md ${pError.startsWith("⚠️") ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                {pError}
              </div>
            )}

            {/* Doctor */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Doctor <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="Search by name or town…"
                value={pDoctorLabel || pDoctorSearch}
                onChange={(e) => { setPDoctorLabel(""); setPDoctorId(""); setPDoctorSearch(e.target.value); setPShowList(true); }}
                onFocus={() => setPShowList(true)}
                className={inputClass}
              />
              {pShowList && pFiltered.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-lg">
                  {pFiltered.map((doc) => (
                    <li key={doc.id} className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm"
                      onMouseDown={() => { setPDoctorId(doc.id); setPDoctorLabel(`${doc.doctor_name} — ${doc.town}`); setPDoctorSearch(""); setPShowList(false); }}>
                      <span className="font-medium">{doc.doctor_name}</span>
                      {doc.town && <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {pShowList && pDoctorSearch.length >= 2 && pFiltered.length === 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 px-4 py-3 text-sm text-gray-400 shadow">No doctors found</div>
              )}
            </div>

            {/* Focused product */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Focused Product <span className="text-red-500">*</span>
              </label>
              <select value={pFocusedProd}
                onChange={(e) => { setPFocusedProd(e.target.value); setPFocusedSamples(0); }}
                className={inputClass}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
              </select>
              {pFocusedProd && (
                <div className="flex items-center gap-3 mt-2 pl-1">
                  <span className="text-xs text-gray-500 shrink-0">
                    Samples of <span className="font-semibold text-[#16a34a]">{pFocusedProdName}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPFocusedSamples((n) => Math.max(0, n - 1))}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base flex items-center justify-center focus-visible:outline-none">−</button>
                    <span className="w-8 text-center font-bold text-[#16a34a] text-sm">{pFocusedSamples}</span>
                    <button type="button" onClick={() => setPFocusedSamples((n) => n + 1)}
                      className="w-7 h-7 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-base flex items-center justify-center focus-visible:outline-none">+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Products detailed */}
            {products.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">All Products Detailed</label>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => {
                    const sel = pProdsDetailed.includes(p.id);
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setPProdsDetailed((prev) => sel ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${sel ? "bg-[#16a34a] border-[#16a34a] text-white" : "bg-white border-gray-300 text-gray-600 hover:border-[#16a34a]"}`}
                        style={{ transition: "background-color 0.15s, color 0.15s" }}>
                        {sel && <FaCheck className="w-3 h-3" />}
                        {p.product_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra product samples */}
            <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
              <button type="button"
                onClick={() => pExtraSamples.length > 0 ? setPShowExtra((v) => !v) : addPExtraRow()}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 focus-visible:outline-none"
                style={{ transition: "background-color 0.15s" }}>
                <span className="flex items-center gap-2">
                  <FaPlus className="w-3 h-3 text-[#16a34a]" />
                  Samples for other products
                  {pExtraSamples.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#f0fdf4] text-[#16a34a] font-bold border border-[#dcfce7]">
                      {pExtraSamples.reduce((s, r) => s + r.qty, 0)} units
                    </span>
                  )}
                </span>
                {pExtraSamples.length > 0 && (pShowExtra ? <MdExpandLess className="w-4 h-4" /> : <MdExpandMore className="w-4 h-4" />)}
              </button>
              {pShowExtra && pExtraSamples.length > 0 && (
                <div className="px-4 pb-3 flex flex-col gap-2 border-t border-dashed border-gray-200 pt-3">
                  {pExtraSamples.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select value={row.product_id}
                        onChange={(e) => updatePExtraRow(idx, "product_id", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-[#16a34a]">
                        <option value={row.product_id}>{products.find((p) => p.id === row.product_id)?.product_name ?? "Select…"}</option>
                        {pAvailableForExtra.filter((p) => p.id !== row.product_id).map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                      </select>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => updatePExtraRow(idx, "qty", Math.max(0, row.qty - 1))}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center">−</button>
                        <span className="w-7 text-center font-bold text-sm text-[#16a34a]">{row.qty}</span>
                        <button type="button" onClick={() => updatePExtraRow(idx, "qty", row.qty + 1)}
                          className="w-6 h-6 rounded bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm flex items-center justify-center">+</button>
                      </div>
                      <button type="button" onClick={() => removePExtraRow(idx)}
                        className="text-gray-300 hover:text-red-400 focus-visible:outline-none shrink-0"
                        style={{ transition: "color 0.15s" }}>
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {pAvailableForExtra.length > 0 && (
                    <button type="button" onClick={addPExtraRow}
                      className="flex items-center gap-1 text-xs text-[#16a34a] font-semibold hover:underline mt-1 focus-visible:outline-none">
                      <FaPlus className="w-3 h-3" /> Add another product
                    </button>
                  )}
                </div>
              )}
            </div>
            {pTotalSamples > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 -mt-2">
                <span>Total samples this visit:</span>
                <span className="font-black text-[#16a34a] text-sm">{pTotalSamples}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Outcome / Notes</label>
              <textarea value={pOutcome} onChange={(e) => setPOutcome(e.target.value)} rows={3}
                placeholder="How did the visit go? Any follow-up needed?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={pLoading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                style={{ transition: "opacity 0.15s" }}>
                {pLoading ? "Saving…" : "Log Visit"}
              </button>
              <button type="button" onClick={onClose}
                className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
                style={{ transition: "background-color 0.15s" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Unplanned Visit form ── */}
        {tab === "unplanned" && (
          <form onSubmit={submitUnplanned} className={formClass}>
            {uError && (
              <div className={`border text-sm px-3 py-2 rounded-md ${uError.startsWith("⚠️") ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                {uError}
              </div>
            )}

            {/* Doctor */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Doctor <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="Search by name or town…"
                value={uDoctorLabel || uDoctorSearch}
                onChange={(e) => { setUDoctorLabel(""); setUDoctorId(""); setUDoctorSearch(e.target.value); setUShowList(true); }}
                onFocus={() => setUShowList(true)}
                className={inputClass}
              />
              {uShowList && uFiltered.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-lg">
                  {uFiltered.map((doc) => (
                    <li key={doc.id} className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm"
                      onMouseDown={() => { setUDoctorId(doc.id); setUDoctorLabel(`${doc.doctor_name} — ${doc.town}`); setUDoctorSearch(""); setUShowList(false); }}>
                      <span className="font-medium">{doc.doctor_name}</span>
                      {doc.town && <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {uShowList && uDoctorSearch.length >= 2 && uFiltered.length === 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 px-4 py-3 text-sm text-gray-400 shadow">No doctors found</div>
              )}
            </div>

            {/* Focused product */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Focused Product <span className="text-red-500">*</span>
              </label>
              <select value={uFocusedProd} onChange={(e) => setUFocusedProd(e.target.value)} className={inputClass}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
              </select>
            </div>

            {/* Products detailed */}
            {products.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">All Products Detailed</label>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => {
                    const sel = uProdsDetailed.includes(p.id);
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setUProdsDetailed((prev) => sel ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${sel ? "bg-[#16a34a] border-[#16a34a] text-white" : "bg-white border-gray-300 text-gray-600 hover:border-[#16a34a]"}`}
                        style={{ transition: "background-color 0.15s, color 0.15s" }}>
                        {sel && <FaCheck className="w-3 h-3" />}
                        {p.product_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Samples */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Samples Given</label>
              <input type="number" min={0} value={uSamples}
                onChange={(e) => setUSamples(Number(e.target.value))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Outcome / Notes</label>
              <textarea value={uOutcome} onChange={(e) => setUOutcome(e.target.value)} rows={3}
                placeholder="Why was this visit unplanned? Any follow-up needed?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={uLoading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                style={{ transition: "opacity 0.15s" }}>
                {uLoading ? "Saving…" : "Log Unplanned Visit"}
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

export default VisitGroupModal;
