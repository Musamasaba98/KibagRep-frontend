import { useState, useEffect, useCallback, useRef } from "react";
import { FaBuildingColumns, FaPlus, FaXmark, FaMagnifyingGlass, FaLocationDot } from "react-icons/fa6";
import { LuMapPin, LuPencil, LuCheck } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../services/api";

// ─── Fix Leaflet default icon broken by Vite ─────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GREEN_ICON = new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="#16a34a"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`)}`,
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38],
});

const UGANDA_CENTER: [number, number] = [0.3476, 32.5825];

interface Facility {
  id: string;
  name: string;
  facility_type?: string;
  town?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ─── Map helpers ──────────────────────────────────────────────────────────────
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center?.[0], center?.[1]]);
  return null;
}

// ─── Coordinate Picker Modal ──────────────────────────────────────────────────
interface PickerProps {
  facilityName: string;
  initial: { lat: number | null; lng: number | null };
  onSave: (lat: number, lng: number) => void;
  onClose: () => void;
  saving: boolean;
}

const CoordinatePickerModal = ({ facilityName, initial, onSave, onClose, saving }: PickerProps) => {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [latInput, setLatInput] = useState(initial.lat != null ? String(initial.lat) : "");
  const [lngInput, setLngInput] = useState(initial.lng != null ? String(initial.lng) : "");
  const [inputError, setInputError] = useState("");

  const mapCenter: [number, number] = pos ? [pos.lat, pos.lng] : UGANDA_CENTER;

  const handleMapPick = (lat: number, lng: number) => {
    const rLat = Math.round(lat * 1_000_000) / 1_000_000;
    const rLng = Math.round(lng * 1_000_000) / 1_000_000;
    setPos({ lat: rLat, lng: rLng });
    setLatInput(String(rLat));
    setLngInput(String(rLng));
    setInputError("");
  };

  const handleManualInput = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || lat < -90  || lat > 90)  { setInputError("Latitude must be between -90 and 90");   return; }
    if (isNaN(lng) || lng < -180 || lng > 180)  { setInputError("Longitude must be between -180 and 180"); return; }
    setInputError("");
    setPos({ lat, lng });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.22)] w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-[#1a2530] text-base tracking-tight">Set Map Coordinates</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{facilityName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Instruction */}
        <div className="px-5 py-2.5 bg-sky-50 border-b border-sky-100 shrink-0">
          <p className="text-xs text-sky-700">
            <span className="font-semibold">Click anywhere on the map</span> to drop a pin, or type coordinates manually below.
            The pin position is used for GPS anomaly detection when reps log visits.
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[280px] relative" style={{ cursor: "crosshair" }}>
          <MapContainer center={mapCenter} zoom={pos ? 15 : 7} style={{ width: "100%", height: "100%", minHeight: 280 }} zoomControl>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onPick={handleMapPick} />
            {pos && (
              <>
                <RecenterMap center={[pos.lat, pos.lng]} />
                <Marker
                  position={[pos.lat, pos.lng]}
                  icon={GREEN_ICON}
                  draggable
                  eventHandlers={{ dragend(e) { const { lat, lng } = (e.target as L.Marker).getLatLng(); handleMapPick(lat, lng); } }}
                />
              </>
            )}
          </MapContainer>
          {!pos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow text-sm text-gray-500 font-semibold">
                Click to set facility location
              </div>
            </div>
          )}
        </div>

        {/* Manual input + actions */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Latitude</label>
              <input type="number" step="any" value={latInput} onChange={e => setLatInput(e.target.value)} onBlur={handleManualInput}
                placeholder="e.g. 0.3476"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 font-mono" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Longitude</label>
              <input type="number" step="any" value={lngInput} onChange={e => setLngInput(e.target.value)} onBlur={handleManualInput}
                placeholder="e.g. 32.5825"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 font-mono" />
            </div>
            <button type="button" onClick={handleManualInput}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 shrink-0"
              style={{ transition: "background-color 0.15s" }}>Apply</button>
          </div>

          {inputError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inputError}</p>}
          {pos && (
            <p className="text-xs text-[#16a34a] font-mono bg-[#f0fdf4] border border-[#dcfce7] rounded-lg px-3 py-2">
              📍 {pos.lat}, {pos.lng}
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              style={{ transition: "background-color 0.15s" }}>Cancel</button>
            <button onClick={() => pos && onSave(pos.lat, pos.lng)} disabled={!pos || saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-50"
              style={{ transition: "background-color 0.15s" }}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><LuCheck className="w-4 h-4" /> Save Coordinates</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Nominatim result type ────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    hospital?: string; clinic?: string; amenity?: string;
    road?: string; suburb?: string; city?: string; town?: string; village?: string;
    county?: string; country?: string;
  };
}

// ─── Map-search modal ─────────────────────────────────────────────────────────
const MapSearchModal = ({
  onSelect, onClose,
}: {
  onSelect: (r: NominatimResult) => void;
  onClose: () => void;
}) => {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pinned, setPinned] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = async (query: string) => {
    if (query.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=ug`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const handleChange = (val: string) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 600);
  };

  const handlePick = (r: NominatimResult) => {
    setPinned({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), name: r.display_name.split(",")[0] });
    setResults([]);
  };

  const MapFlyTo = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => { map.flyTo(center, 16, { duration: 1 }); }, [center[0], center[1]]);
    return null;
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/55">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-[#1a2530] text-base">Search Facility on Map</h2>
            <p className="text-xs text-gray-400 mt-0.5">Type a name or address — results from OpenStreetMap</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaXmark className="w-4 h-4" /></button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 space-y-2">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              autoFocus
              type="text" value={q} onChange={e => handleChange(e.target.value)}
              placeholder="e.g. Mulago Hospital, Kampala…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            )}
          </div>

          {/* Results dropdown */}
          {results.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {results.map(r => (
                <button key={r.place_id} onClick={() => handlePick(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0"
                  style={{ transition: "background-color 0.12s" }}>
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.display_name.split(",")[0]}</p>
                  <p className="text-xs text-gray-400 truncate">{r.display_name.split(",").slice(1, 4).join(", ")}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[300px] relative">
          <MapContainer
            center={pinned ? [pinned.lat, pinned.lng] : UGANDA_CENTER}
            zoom={pinned ? 15 : 7}
            style={{ width: "100%", height: "100%", minHeight: 300 }}
            zoomControl>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {pinned && (
              <>
                <MapFlyTo center={[pinned.lat, pinned.lng]} />
                <Marker position={[pinned.lat, pinned.lng]} icon={GREEN_ICON} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
          {pinned ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{pinned.name}</p>
                <p className="text-xs text-gray-400">{pinned.lat.toFixed(6)}, {pinned.lng.toFixed(6)}</p>
              </div>
              <button
                onClick={() => {
                  const match = results.find(r => r.display_name.split(",")[0] === pinned.name);
                  const synth: NominatimResult = match ?? {
                    place_id: 0,
                    display_name: pinned.name,
                    lat: String(pinned.lat),
                    lon: String(pinned.lng),
                  };
                  onSelect(synth);
                }}
                className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm px-4 py-2 rounded-xl shrink-0"
                style={{ transition: "background-color 0.15s" }}>
                <LuCheck className="w-4 h-4" /> Add this facility
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400">Search and click a result to pin it, then confirm.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");

  const [showMapSearch, setShowMapSearch]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm]   = useState({ name: "", facility_type: "", town: "", location: "" });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [showCreateMap, setShowCreateMap]   = useState(false);
  const [createCoords, setCreateCoords]     = useState<{ lat: number; lng: number } | null>(null);

  const [pickerTarget, setPickerTarget]   = useState<Facility | null>(null);
  const [savingCoords, setSavingCoords]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/facility")
      .then(r => setFacilities(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = q.length >= 2
    ? facilities.filter(f =>
        f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.town?.toLowerCase().includes(q.toLowerCase()) ||
        f.location?.toLowerCase().includes(q.toLowerCase())
      )
    : facilities;

  const withCoords    = facilities.filter(f => f.latitude != null && f.longitude != null).length;
  const withoutCoords = facilities.length - withCoords;

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormError("");
    if (!form.name.trim() || !form.location.trim()) { setFormError("Name and location are required"); return; }
    setSaving(true);
    try {
      await api.post("/facility", {
        name: form.name.trim(),
        location: form.location.trim(),
        facility_type: form.facility_type || undefined,
        town: form.town || undefined,
        latitude:  createCoords?.lat ?? undefined,
        longitude: createCoords?.lng ?? undefined,
      });
      setShowCreateModal(false);
      setForm({ name: "", facility_type: "", town: "", location: "" });
      setCreateCoords(null);
      setShowCreateMap(false);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.message || "Failed to create");
    } finally { setSaving(false); }
  };

  const handleSaveCoords = async (lat: number, lng: number) => {
    if (!pickerTarget) return;
    setSavingCoords(true);
    try {
      await api.put(`/facility/${pickerTarget.id}`, { latitude: lat, longitude: lng });
      setFacilities(prev => prev.map(f => f.id === pickerTarget.id ? { ...f, latitude: lat, longitude: lng } : f));
      setPickerTarget(null);
    } catch {
      // user can retry
    } finally { setSavingCoords(false); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Facilities</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-gray-400">{facilities.length} health facilities</p>
            {facilities.length > 0 && (
              <>
                <span className="flex items-center gap-1 text-xs font-semibold text-[#16a34a]">
                  <FaLocationDot className="w-3 h-3" /> {withCoords} with GPS
                </span>
                {withoutCoords > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <MdOutlineGpsOff className="w-3.5 h-3.5" /> {withoutCoords} missing
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMapSearch(true)}
            className="flex items-center gap-2 border border-[#16a34a] text-[#16a34a] text-sm font-semibold px-3.5 py-2.5 rounded-xl hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}>
            <FaMagnifyingGlass className="w-3.5 h-3.5" /><span className="hidden sm:inline">Search Map</span>
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}>
            <FaPlus className="w-3.5 h-3.5" /><span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* GPS coverage warning */}
      {withoutCoords > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <MdOutlineGpsOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">{withoutCoords} facilit{withoutCoords !== 1 ? "ies" : "y"} without GPS coordinates.</span>
            {" "}Click the pin icon on any row to set coordinates on the map.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search by name, town, or location…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
      </div>

      {/* Facility list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaBuildingColumns className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{q ? "No matching facilities" : "No facilities yet"}</p>
            <p className="text-sm mt-1">Add health facilities where doctors work</p>
          </div>
        ) : (
          <>
            <div className="grid px-4 sm:px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "2rem 1fr auto" }}>
              <span /><span>Facility</span><span className="text-right">Coordinates</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(f => {
                const hasCoords = f.latitude != null && f.longitude != null;
                return (
                  <div key={f.id} className="grid items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50"
                    style={{ gridTemplateColumns: "2rem 1fr auto" }}>
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <FaBuildingColumns className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{f.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {[f.facility_type, f.town, f.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasCoords ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] border border-[#dcfce7] px-2 py-1 rounded-full font-mono whitespace-nowrap">
                          <FaLocationDot className="w-2.5 h-2.5 shrink-0" />
                          {f.latitude!.toFixed(4)}, {f.longitude!.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
                          No GPS
                        </span>
                      )}
                      <button type="button" onClick={() => setPickerTarget(f)}
                        title={hasCoords ? "Edit coordinates" : "Set coordinates on map"}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                          hasCoords ? "border-[#dcfce7] text-[#16a34a] hover:bg-[#f0fdf4]" : "border-amber-200 text-amber-600 hover:bg-amber-50"
                        }`}
                        style={{ transition: "background-color 0.15s" }}>
                        {hasCoords ? <LuPencil className="w-3.5 h-3.5" /> : <LuMapPin className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Add Facility</h2>
              <button onClick={() => { setShowCreateModal(false); setCreateCoords(null); setShowCreateMap(false); }}
                className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 flex flex-col gap-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{formError}</div>}
              {[
                { key: "name",          label: "Facility Name *",      placeholder: "e.g. Mulago National Referral Hospital" },
                { key: "location",      label: "Location / Address *", placeholder: "e.g. Mulago Hill, Kampala" },
                { key: "facility_type", label: "Type",                 placeholder: "e.g. Hospital, Clinic, Health Centre" },
                { key: "town",          label: "Town / Area",          placeholder: "e.g. Kampala" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input type="text" value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              ))}

              {/* GPS section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500">GPS Coordinates <span className="text-gray-400 font-normal">(optional)</span></label>
                  <button type="button" onClick={() => setShowCreateMap(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#16a34a] hover:underline focus-visible:outline-none">
                    <LuMapPin className="w-3.5 h-3.5" />
                    {createCoords ? "Change on map" : "Pick on map"}
                  </button>
                </div>
                {createCoords ? (
                  <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#dcfce7] rounded-xl px-3.5 py-2.5">
                    <FaLocationDot className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                    <span className="text-sm font-mono text-[#16a34a] flex-1">{createCoords.lat}, {createCoords.lng}</span>
                    <button type="button" onClick={() => setCreateCoords(null)} className="text-gray-400 hover:text-gray-600">
                      <FaXmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 border-dashed rounded-xl px-3.5 py-2.5 text-gray-400 text-sm">
                    <MdOutlineGpsOff className="w-4 h-4 shrink-0" />
                    <span>No coordinates — add now or set later</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateModal(false); setCreateCoords(null); setShowCreateMap(false); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Saving…" : "Add Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map picker for create form */}
      {showCreateMap && (
        <CoordinatePickerModal
          facilityName={form.name || "New Facility"}
          initial={{ lat: createCoords?.lat ?? null, lng: createCoords?.lng ?? null }}
          saving={false}
          onClose={() => setShowCreateMap(false)}
          onSave={(lat, lng) => { setCreateCoords({ lat, lng }); setShowCreateMap(false); }}
        />
      )}

      {/* Map picker for existing facility */}
      {pickerTarget && (
        <CoordinatePickerModal
          facilityName={pickerTarget.name}
          initial={{ lat: pickerTarget.latitude ?? null, lng: pickerTarget.longitude ?? null }}
          saving={savingCoords}
          onClose={() => setPickerTarget(null)}
          onSave={handleSaveCoords}
        />
      )}

      {showMapSearch && (
        <MapSearchModal
          onClose={() => setShowMapSearch(false)}
          onSelect={(r) => {
            const namePart = r.display_name.split(",")[0].trim();
            const addr = r.address;
            const town = addr?.city ?? addr?.town ?? addr?.village ?? addr?.suburb ?? "";
            setForm(prev => ({
              ...prev,
              name: namePart,
              town,
              location: [addr?.road, addr?.suburb].filter(Boolean).join(", ") || namePart,
            }));
            setCreateCoords({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
            setShowMapSearch(false);
            setShowCreateModal(true);
          }}
        />
      )}
    </div>
  );
};

export default Facilities;
