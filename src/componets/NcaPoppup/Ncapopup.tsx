import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { getCompanyDoctorListApi, getProductsApi, addNcaApi } from "../../services/api";

interface Doctor {
  id: string;
  doctor_name: string;
  town: string;
}

interface Product {
  id: string;
  product_name: string;
}

interface NcaPopupProps {
  onClose: () => void;
  onSuccess: () => void;
  initialDoctorId?: string;
  initialDoctorLabel?: string;
}

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

const Ncapopup = ({ onClose, onSuccess, initialDoctorId = "", initialDoctorLabel = "" }: NcaPopupProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorList, setShowDoctorList] = useState(false);

  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [doctorLabel, setDoctorLabel] = useState(initialDoctorLabel);
  const [focusedProductId, setFocusedProductId] = useState("");
  const [ncaReason, setNcaReason] = useState("");

  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("acquiring");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsStatus("acquired");
      },
      () => setGpsStatus("denied"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getCompanyDoctorListApi()
      .then((res) => setDoctors(res.data.data ?? res.data))
      .catch(() => {});
    getProductsApi()
      .then((res) => setProducts(res.data.data ?? res.data))
      .catch(() => {});
  }, []);

  const filteredDoctors =
    doctorSearch.length >= 2
      ? doctors.filter(
          (d) =>
            d.doctor_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
            d.town?.toLowerCase().includes(doctorSearch.toLowerCase())
        )
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) { setError("Select a doctor"); return; }
    if (!focusedProductId) { setError("Select the product you were planning to detail"); return; }
    if (!ncaReason) { setError("Select an NCA reason"); return; }
    setError("");
    setLoading(true);
    try {
      await addNcaApi({
        doctor_id: doctorId,
        focused_product_id: focusedProductId,
        nca_reason: ncaReason,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to log NCA. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const gpsIndicator = () => {
    if (gpsStatus === "acquiring")
      return (
        <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
          <FiLoader className="w-3 h-3 animate-spin" /> Acquiring GPS…
        </span>
      );
    if (gpsStatus === "acquired")
      return (
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
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-amber-500 px-6 py-4">
          <div>
            <h2 className="text-white font-bold text-xl">Log NCA</h2>
            <p className="text-white/80 text-xs mt-0.5">No Customer Activity</p>
            <div className="mt-1">{gpsIndicator()}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <strong>NCA</strong> means you attempted this visit but the doctor was unavailable.
            The system still records your attempt with GPS evidence.
          </div>

          {/* Doctor search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Doctor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search by name or town…"
              value={doctorLabel || doctorSearch}
              onChange={(e) => {
                setDoctorLabel("");
                setDoctorId("");
                setDoctorSearch(e.target.value);
                setShowDoctorList(true);
              }}
              onFocus={() => setShowDoctorList(true)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            />
            {showDoctorList && filteredDoctors.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-lg">
                {filteredDoctors.map((doc) => (
                  <li
                    key={doc.id}
                    className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm"
                    onMouseDown={() => {
                      setDoctorId(doc.id);
                      setDoctorLabel(`${doc.doctor_name} — ${doc.town}`);
                      setDoctorSearch("");
                      setShowDoctorList(false);
                    }}
                  >
                    <span className="font-medium">{doc.doctor_name}</span>
                    {doc.town && (
                      <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {showDoctorList && doctorSearch.length >= 2 && filteredDoctors.length === 0 && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 px-4 py-3 text-sm text-gray-400 shadow">
                No doctors found
              </div>
            )}
          </div>

          {/* Product (what was planned) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Product you planned to detail <span className="text-red-500">*</span>
            </label>
            <select
              value={focusedProductId}
              onChange={(e) => setFocusedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* NCA reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={ncaReason}
              onChange={(e) => setNcaReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            >
              <option value="">Select reason…</option>
              {NCA_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              style={{ transition: "opacity 0.15s, background-color 0.15s" }}
            >
              {loading ? "Saving…" : "Log NCA"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: "background-color 0.15s" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Ncapopup;
