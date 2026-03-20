import { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { getCompanyDoctorListApi, getProductsApi, addNcaApi, logMissedVisitApi } from "../../services/api";

type Tab = "nca" | "missed";
type VisitStatus = "MISSED" | "RESCHEDULED" | "SKIPPED";
type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";

const NCA_REASONS = [
  "Doctor absent",
  "Doctor in theatre",
  "Doctor unavailable — in consultation",
  "Doctor refused visit",
  "Doctor not in today",
  "Public holiday",
  "Facility closed",
  "Other",
];

const STATUS_OPTIONS: { value: VisitStatus; label: string; desc: string; color: string }[] = [
  { value: "MISSED",      label: "Missed",      desc: "Doctor was unavailable or not seen",          color: "border-red-300 bg-red-50 text-red-700"       },
  { value: "RESCHEDULED", label: "Rescheduled", desc: "Doctor asked to move the meeting",            color: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "SKIPPED",     label: "Skipped",     desc: "Rep decided not to visit for other reasons", color: "border-gray-300 bg-gray-50 text-gray-600"    },
];

const MISS_REASONS: Record<VisitStatus, string[]> = {
  MISSED:      ["Not available", "Clinic closed", "In surgery / ward round", "Patient emergency", "Other"],
  RESCHEDULED: ["Doctor request", "Moved to next week", "Facility closed today", "Other"],
  SKIPPED:     ["Traffic / logistics", "Priority change", "Low tier, will catch up", "Other"],
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: Tab;
  initialDoctorId?: string;
  initialDoctorLabel?: string;
}

const NcaMissedGroupModal = ({
  onClose, onSuccess,
  initialTab = "nca",
  initialDoctorId = "",
  initialDoctorLabel = "",
}: Props) => {
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Shared data ────────────────────────────────────────────────────────────
  const [doctors,  setDoctors]  = useState<{ id: string; doctor_name: string; town: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; product_name: string }[]>([]);

  // ── GPS (NCA tab only) ─────────────────────────────────────────────────────
  const [gpsLat,    setGpsLat]    = useState<number | null>(null);
  const [gpsLng,    setGpsLng]    = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");

  // ── NCA tab state ──────────────────────────────────────────────────────────
  const [ncaDoctorId,     setNcaDoctorId]     = useState(initialTab === "nca" ? initialDoctorId : "");
  const [ncaDoctorLabel,  setNcaDoctorLabel]  = useState(initialTab === "nca" ? initialDoctorLabel : "");
  const [ncaDoctorSearch, setNcaDoctorSearch] = useState("");
  const [ncaShowList,     setNcaShowList]     = useState(false);
  const [ncaProductId,    setNcaProductId]    = useState("");
  const [ncaReason,       setNcaReason]       = useState("");
  const [ncaLoading,      setNcaLoading]      = useState(false);
  const [ncaError,        setNcaError]        = useState("");

  // ── Missed tab state ───────────────────────────────────────────────────────
  const [misDoctorId,     setMisDoctorId]     = useState(initialTab === "missed" ? initialDoctorId : "");
  const [misDoctorLabel,  setMisDoctorLabel]  = useState(initialTab === "missed" ? initialDoctorLabel : "");
  const [misDoctorSearch, setMisDoctorSearch] = useState("");
  const [misShowList,     setMisShowList]     = useState(false);
  const [misStatus,       setMisStatus]       = useState<VisitStatus>("MISSED");
  const [misReason,       setMisReason]       = useState("");
  const [misCustom,       setMisCustom]       = useState("");
  const [misLoading,      setMisLoading]      = useState(false);
  const [misError,        setMisError]        = useState("");

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
    getCompanyDoctorListApi().then((r) => setDoctors(r.data.data ?? r.data)).catch(() => {});
    getProductsApi().then((r) => setProducts(r.data.data ?? r.data)).catch(() => {});
  }, []);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const ncaFiltered = ncaDoctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(ncaDoctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(ncaDoctorSearch.toLowerCase()))
    : [];

  const misFiltered = misDoctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(misDoctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(misDoctorSearch.toLowerCase()))
    : [];

  // ── GPS indicator ──────────────────────────────────────────────────────────
  const gpsIndicator = () => {
    if (gpsStatus === "acquiring") return (
      <span className="flex items-center gap-1 text-[11px] text-white/70 font-medium">
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

  // ── Submit NCA ─────────────────────────────────────────────────────────────
  const submitNca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncaDoctorId)  { setNcaError("Select a doctor"); return; }
    if (!ncaProductId) { setNcaError("Select the product you planned to detail"); return; }
    if (!ncaReason)    { setNcaError("Select an NCA reason"); return; }
    setNcaError(""); setNcaLoading(true);
    try {
      await addNcaApi({ doctor_id: ncaDoctorId, focused_product_id: ncaProductId, nca_reason: ncaReason, gps_lat: gpsLat, gps_lng: gpsLng });
      onSuccess(); onClose();
    } catch (err: any) {
      setNcaError(err.response?.data?.message || "Failed to log NCA. Try again.");
    } finally {
      setNcaLoading(false);
    }
  };

  // ── Submit Missed ──────────────────────────────────────────────────────────
  const submitMissed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!misDoctorId) { setMisError("Select a doctor"); return; }
    setMisError(""); setMisLoading(true);
    const finalReason = misReason === "Other" ? misCustom : misReason;
    try {
      await logMissedVisitApi({ doctor_id: misDoctorId, visit_status: misStatus, miss_reason: finalReason || undefined });
      onSuccess(); onClose();
    } catch (err: any) {
      setMisError(err.response?.data?.message || "Failed to log. Try again.");
    } finally {
      setMisLoading(false);
    }
  };

  const activeStatusOpt = STATUS_OPTIONS.find((s) => s.value === misStatus)!;

  // ── Doctor search dropdown (reusable snippet) ──────────────────────────────
  const DoctorDropdown = ({
    value, search, showList, filtered,
    onSearchChange, onSelect, onFocus, accentClass,
  }: {
    value: string; search: string; showList: boolean;
    filtered: typeof doctors;
    onSearchChange: (v: string) => void;
    onSelect: (id: string, label: string) => void;
    onFocus: () => void;
    accentClass: string;
  }) => (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Doctor <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        placeholder="Search by name or town…"
        value={value || search}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none ${accentClass}`}
      />
      {showList && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-44 overflow-y-auto custom-scrollbar shadow-lg">
          {filtered.map((doc) => (
            <li
              key={doc.id}
              className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm"
              onMouseDown={() => onSelect(doc.id, `${doc.doctor_name} — ${doc.town}`)}
            >
              <span className="font-medium">{doc.doctor_name}</span>
              {doc.town && <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>}
            </li>
          ))}
        </ul>
      )}
      {showList && search.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 px-4 py-3 text-sm text-gray-400 shadow">
          No doctors found
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-amber-500 px-6 py-4">
          <div>
            <h2 className="text-white font-bold text-xl leading-none">
              {tab === "nca" ? "Log NCA" : "Log Missed Visit"}
            </h2>
            <p className="text-amber-100 text-[11px] mt-0.5">
              {tab === "nca"
                ? "Attempted visit — doctor was unavailable"
                : "Record why a planned call didn't happen"}
            </p>
            {tab === "nca" && <div className="mt-1">{gpsIndicator()}</div>}
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {(["nca", "missed"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold tracking-wide focus-visible:outline-none ${
                tab === t ? "text-amber-600 border-b-2 border-amber-500" : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ transition: "color 0.12s" }}>
              {t === "nca" ? "Log NCA" : "Log Missed"}
            </button>
          ))}
        </div>

        {/* ── NCA form ── */}
        {tab === "nca" && (
          <form onSubmit={submitNca} className="px-6 py-5 flex flex-col gap-5 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {ncaError && (
              <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{ncaError}</div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              <strong>NCA</strong> means you attempted this visit but the doctor was unavailable.
              The system records your attempt with GPS evidence.
            </div>

            <DoctorDropdown
              value={ncaDoctorLabel} search={ncaDoctorSearch}
              showList={ncaShowList} filtered={ncaFiltered}
              accentClass="focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              onSearchChange={(v) => { setNcaDoctorLabel(""); setNcaDoctorId(""); setNcaDoctorSearch(v); setNcaShowList(true); }}
              onSelect={(id, label) => { setNcaDoctorId(id); setNcaDoctorLabel(label); setNcaDoctorSearch(""); setNcaShowList(false); }}
              onFocus={() => setNcaShowList(true)}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product planned to detail <span className="text-red-500">*</span>
              </label>
              <select value={ncaProductId} onChange={(e) => setNcaProductId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30">
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <select value={ncaReason} onChange={(e) => setNcaReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30">
                <option value="">Select reason…</option>
                {NCA_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={ncaLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                style={{ transition: "opacity 0.15s, background-color 0.15s" }}>
                {ncaLoading ? "Saving…" : "Log NCA"}
              </button>
              <button type="button" onClick={onClose}
                className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
                style={{ transition: "background-color 0.15s" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Missed form ── */}
        {tab === "missed" && (
          <form onSubmit={submitMissed} className="px-6 py-5 flex flex-col gap-5 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {misError && (
              <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{misError}</div>
            )}

            <DoctorDropdown
              value={misDoctorLabel} search={misDoctorSearch}
              showList={misShowList} filtered={misFiltered}
              accentClass="focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              onSearchChange={(v) => { setMisDoctorLabel(""); setMisDoctorId(""); setMisDoctorSearch(v); setMisShowList(true); }}
              onSelect={(id, label) => { setMisDoctorId(id); setMisDoctorLabel(label); setMisDoctorSearch(""); setMisShowList(false); }}
              onFocus={() => setMisShowList(true)}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What happened?</label>
              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { setMisStatus(opt.value); setMisReason(""); }}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left ${
                      misStatus === opt.value ? opt.color : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                    style={{ transition: "border-color 0.15s, background-color 0.15s" }}>
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                      misStatus === opt.value ? "border-current" : "border-gray-300"
                    }`}>
                      {misStatus === opt.value && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-none">{opt.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (optional)</label>
              <div className="flex flex-wrap gap-2">
                {MISS_REASONS[misStatus].map((r) => (
                  <button key={r} type="button" onClick={() => setMisReason(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      misReason === r
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-gray-300 text-gray-600 hover:border-amber-400"
                    }`}
                    style={{ transition: "background-color 0.15s, color 0.15s, border-color 0.15s" }}>
                    {r}
                  </button>
                ))}
              </div>
              {misReason === "Other" && (
                <input type="text" placeholder="Describe the reason…"
                  value={misCustom} onChange={(e) => setMisCustom(e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={misLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm"
                style={{ transition: "opacity 0.15s" }}>
                {misLoading ? "Saving…" : `Log as ${activeStatusOpt.label}`}
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

export default NcaMissedGroupModal;
