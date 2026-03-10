import { useEffect, useState } from "react";
import { FaXmark, FaCheck } from "react-icons/fa6";
import { FiMapPin, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { getDoctorsApi, getProductsApi, addDoctorActivityApi } from "../../services/api";

interface Doctor {
  id: string;
  doctor_name: string;
  town: string;
}

interface Product {
  id: string;
  product_name: string;
}

interface AddUnplannedProps {
  onClose: () => void;
  onSuccess: () => void;
}

type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";

const AddUnplanned = ({ onClose, onSuccess }: AddUnplannedProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorList, setShowDoctorList] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [doctorLabel, setDoctorLabel] = useState("");
  const [focusedProductId, setFocusedProductId] = useState("");
  const [productsDetailed, setProductsDetailed] = useState<string[]>([]);
  const [samplesGiven, setSamplesGiven] = useState(0);
  const [outcome, setOutcome] = useState("");

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
    getDoctorsApi()
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
            d.doctor_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
            d.town?.toLowerCase().includes(doctorSearch.toLowerCase())
        )
      : [];

  const toggleProduct = (id: string) => {
    setProductsDetailed((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) { setError("Select a doctor first"); return; }
    if (!focusedProductId) { setError("Select the focused product"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await addDoctorActivityApi({
        doctor_id: doctorId,
        focused_product_id: focusedProductId,
        products_detailed: productsDetailed,
        samples_given: samplesGiven,
        outcome,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });
      if (res.data.gps_anomaly) {
        setError(
          "⚠️ GPS anomaly: your location is >500m from the doctor's registered facility. Visit saved — supervisor will be notified."
        );
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
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#16a34a] px-6 py-4">
          <div>
            <h2 className="text-white font-bold text-xl">Log Unplanned Visit</h2>
            <p className="text-white/80 text-xs mt-0.5">Outside your current call cycle</p>
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
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div
              className={`border text-sm px-3 py-2 rounded-md ${
                error.startsWith("⚠️")
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

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
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
            {showDoctorList && filteredDoctors.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                {filteredDoctors.map((doc) => (
                  <li
                    key={doc.id}
                    className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm"
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

          {/* Focused product */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Focused Product <span className="text-red-500">*</span>
            </label>
            <select
              value={focusedProductId}
              onChange={(e) => setFocusedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* Products detailed */}
          {products.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                All Products Detailed
              </label>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => {
                  const selected = productsDetailed.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        selected
                          ? "bg-[#16a34a] border-[#16a34a] text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:border-[#16a34a]"
                      }`}
                      style={{ transition: "background-color 0.15s, color 0.15s" }}
                    >
                      {selected && <FaCheck className="w-3 h-3" />}
                      {p.product_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Samples given */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Samples Given
            </label>
            <input
              type="number"
              min={0}
              value={samplesGiven}
              onChange={(e) => setSamplesGiven(Number(e.target.value))}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Outcome / Notes
            </label>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              placeholder="Why was this visit unplanned? Any follow-up needed?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "opacity 0.15s" }}
            >
              {loading ? "Saving…" : "Log Unplanned Visit"}
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

export default AddUnplanned;
