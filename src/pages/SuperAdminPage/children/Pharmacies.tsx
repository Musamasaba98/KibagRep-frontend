import { useState, useEffect, useCallback, useRef } from "react";
import { FaHospital, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaXmark, FaSpinner, FaLocationDot } from "react-icons/fa6";
import { LuMapPin, LuPencil, LuCheck } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../services/api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const GREEN_ICON = new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="#16a34a"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`)}`,
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38],
});
const UGANDA_CENTER: [number, number] = [0.3476, 32.5825];

const TYPE_LABELS: Record<string, string> = {
  INDEPENDENT:       "Independent",
  CHAIN:             "Chain",
  HOSPITAL_INTERNAL: "Hospital",
  DISPENSING_CLINIC: "Dispensing Clinic",
  COMMUNITY_HEALTH:  "Community Health",
};
const TYPE_COLOURS: Record<string, string> = {
  INDEPENDENT:       "bg-gray-50 text-gray-600 border-gray-200",
  CHAIN:             "bg-blue-50 text-blue-700 border-blue-200",
  HOSPITAL_INTERNAL: "bg-amber-50 text-amber-700 border-amber-200",
  DISPENSING_CLINIC: "bg-sky-50 text-sky-700 border-sky-200",
  COMMUNITY_HEALTH:  "bg-green-50 text-green-700 border-green-200",
};
const GPS_SOURCE_META: Record<string, { label: string; cls: string }> = {
  ROOFTOP:            { label: "Rooftop",        cls: "text-[#16a34a] bg-[#f0fdf4] border-[#dcfce7]" },
  RANGE_INTERPOLATED: { label: "Street-level",   cls: "text-blue-700 bg-blue-50 border-blue-200" },
  GEOMETRIC_CENTER:   { label: "Approx. centre", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  APPROXIMATE:        { label: "Approximate",    cls: "text-orange-700 bg-orange-50 border-orange-200" },
  MANUAL:             { label: "Manual",         cls: "text-purple-700 bg-purple-50 border-purple-200" },
};
const TYPES = Object.keys(TYPE_LABELS);
const LIMIT = 50;

interface Pharmacy {
  id: string;
  pharmacy_name: string;
  location?: string;
  town?: string;
  district?: string;
  region?: string;
  pharmacy_type?: string;
  contact?: string;
  latitude?: number | null;
  longitude?: number | null;
  gps_source?: string | null;
}

interface NominatimResult {
  place_id: number; lat: string; lon: string; display_name: string;
}

/* ─── Map helpers ─── */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}
function FlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.9 });
  }, [target?.lat, target?.lng]);
  return null;
}

/* ─── Pharmacy Details Modal ─── */
const PharmacyDetailsModal = ({
  pharmacy, onClose, onEditCoords,
}: { pharmacy: Pharmacy; onClose: () => void; onEditCoords: () => void }) => {
  const hasCoords = pharmacy.latitude != null && pharmacy.longitude != null;
  const gpsMeta   = pharmacy.gps_source ? GPS_SOURCE_META[pharmacy.gps_source] : null;
  const typeLabel = pharmacy.pharmacy_type ? (TYPE_LABELS[pharmacy.pharmacy_type] ?? pharmacy.pharmacy_type) : null;
  const typeColour = pharmacy.pharmacy_type ? (TYPE_COLOURS[pharmacy.pharmacy_type] ?? TYPE_COLOURS.INDEPENDENT) : null;

  const infoItems = [
    { label: "Town",     value: pharmacy.town },
    { label: "Location", value: pharmacy.location },
    { label: "District", value: pharmacy.district },
    { label: "Region",   value: pharmacy.region },
    { label: "Contact",  value: pharmacy.contact },
  ].filter(i => i.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <FaHospital className="w-5 h-5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-[#1a2530] text-base leading-snug">{pharmacy.pharmacy_name}</h2>
              {typeLabel && typeColour && (
                <div className="mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColour}`}>
                    {typeLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 ml-2 shrink-0 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Info grid */}
          {infoItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</p>
              <div className="grid grid-cols-2 gap-2">
                {infoItems.map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-[#1a2530] mt-0.5 truncate" title={item.value}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GPS section */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">GPS Coordinates</p>
            {hasCoords ? (
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#16a34a]">
                      {pharmacy.latitude!.toFixed(6)}, {pharmacy.longitude!.toFixed(6)}
                    </p>
                    {gpsMeta && (
                      <span className={`inline-flex items-center mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${gpsMeta.cls}`}>
                        {gpsMeta.label}
                      </span>
                    )}
                  </div>
                  <FaLocationDot className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <MdOutlineGpsOff className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">No coordinates set.</span>
                  {" "}Rep check-ins cannot be validated for this pharmacy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
            Close
          </button>
          <button onClick={onEditCoords}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold focus-visible:outline-none ${
              hasCoords
                ? "bg-[#16a34a] hover:bg-[#15803d] text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}>
            {hasCoords ? <LuPencil className="w-3.5 h-3.5" /> : <LuMapPin className="w-3.5 h-3.5" />}
            {hasCoords ? "Edit Coordinates" : "Set Coordinates"}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─── Coordinate Picker Modal ─── */
const CoordinatePickerModal = ({
  pharmacyName, initial, onSave, onClose, saving,
}: { pharmacyName: string; initial: { lat: number | null; lng: number | null }; onSave: (lat: number, lng: number) => void; onClose: () => void; saving: boolean }) => {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [latInput, setLatInput] = useState(initial.lat != null ? String(initial.lat) : "");
  const [lngInput, setLngInput] = useState(initial.lng != null ? String(initial.lng) : "");
  const [err, setErr]           = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [pasteCoord, setPasteCoord] = useState("");
  const [pasteOk, setPasteOk]       = useState(false);

  const [geoQ, setGeoQ]           = useState(pharmacyName);
  const [geoResults, setGeoResults] = useState<NominatimResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchGeo = (q: string) => {
    clearTimeout(geoDebounce.current);
    if (q.trim().length < 3) { setGeoResults([]); setGeoLoading(false); return; }
    setGeoLoading(true);
    geoDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Uganda")}&format=json&limit=6&addressdetails=0`,
          { headers: { "Accept-Language": "en" } }
        );
        setGeoResults(await res.json());
      } catch { setGeoResults([]); }
      finally { setGeoLoading(false); }
    }, 500);
  };

  useEffect(() => { searchGeo(pharmacyName); }, []);

  const handleMapPick = (lat: number, lng: number) => {
    const r = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
    const rLat = r(lat, 6), rLng = r(lng, 6);
    setPos({ lat: rLat, lng: rLng });
    setLatInput(String(rLat)); setLngInput(String(rLng)); setErr("");
  };

  const handleSuggestion = (result: NominatimResult) => {
    const lat = parseFloat(result.lat), lng = parseFloat(result.lon);
    handleMapPick(lat, lng);
    setFlyTarget({ lat, lng });
    setGeoResults([]);
    setGeoQ(result.display_name.split(",")[0]);
  };

  const applyManual = () => {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput);
    if (isNaN(lat) || lat < -90 || lat > 90)   { setErr("Latitude must be -90 to 90"); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setErr("Longitude must be -180 to 180"); return; }
    setErr(""); handleMapPick(lat, lng); setFlyTarget({ lat, lng });
  };

  const handlePasteCoord = (raw: string) => {
    setPasteCoord(raw); setPasteOk(false);
    const parts = raw.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2) return;
    const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    setErr(""); handleMapPick(lat, lng); setFlyTarget({ lat, lng });
    setPasteOk(true);
    setTimeout(() => { setPasteCoord(""); setPasteOk(false); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-[#1a2530] text-base">Set Map Coordinates</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{pharmacyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            {geoLoading
              ? <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              : <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            }
            <input value={geoQ} onChange={e => { setGeoQ(e.target.value); searchGeo(e.target.value); }}
              placeholder="Search for location…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>
          {geoResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {geoResults.map(r => (
                <button key={r.place_id} onClick={() => handleSuggestion(r)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#f0fdf4] border-b border-gray-50 last:border-0 focus-visible:outline-none"
                  style={{ transition: "background-color 0.1s" }}>
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{r.display_name.split(",")[0]}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{r.display_name.split(",").slice(1, 4).join(",").trim()}</p>
                </button>
              ))}
            </div>
          )}
          {!geoLoading && geoQ.trim().length >= 3 && geoResults.length === 0 && (
            <p className="mt-1.5 text-xs text-gray-400">No map results — try a shorter name or nearby landmark</p>
          )}
        </div>

        <div className="px-5 py-2 bg-sky-50 border-b border-sky-100 shrink-0">
          <p className="text-xs text-sky-700">
            <span className="font-semibold">Pick a suggestion</span> above to fly to it, then{" "}
            <span className="font-semibold">click the map</span> to place the pin exactly, or drag the marker to adjust.
          </p>
        </div>

        <div className="flex-1 min-h-[240px]" style={{ cursor: "crosshair" }}>
          <MapContainer center={pos ? [pos.lat, pos.lng] : UGANDA_CENTER} zoom={pos ? 15 : 7}
            style={{ width: "100%", height: "100%", minHeight: 240 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={handleMapPick} />
            <FlyTo target={flyTarget} />
            {pos && (
              <Marker position={[pos.lat, pos.lng]} icon={GREEN_ICON} draggable
                eventHandlers={{ dragend(e) {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  handleMapPick(lat, lng);
                }}}
              />
            )}
          </MapContainer>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paste coordinates</label>
            <input type="text" value={pasteCoord} onChange={e => handlePasteCoord(e.target.value)}
              placeholder="e.g. 3.3743915, 31.7926280"
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none font-mono transition-colors ${
                pasteOk ? "border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]" : "border-gray-200 focus:border-[#16a34a]"
              }`} />
            {pasteOk && <span className="absolute right-3 top-1/2 translate-y-1 text-xs font-semibold text-[#16a34a]">✓ Applied</span>}
          </div>
          <div className="flex items-end gap-3">
            {([{ l: "Latitude", v: latInput, s: setLatInput }, { l: "Longitude", v: lngInput, s: setLngInput }] as const).map(({ l, v, s }) => (
              <div key={l} className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{l}</label>
                <input type="number" step="any" value={v} onChange={e => s(e.target.value)} onBlur={applyManual}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#16a34a] font-mono" />
              </div>
            ))}
            <button onClick={applyManual} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 shrink-0">
              Apply
            </button>
          </div>
          {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
          {pos && <p className="text-xs text-[#16a34a] font-mono bg-[#f0fdf4] border border-[#dcfce7] rounded-lg px-3 py-2">📍 {pos.lat}, {pos.lng}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={() => pos && onSave(pos.lat, pos.lng)} disabled={!pos || saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-50">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><LuCheck className="w-4 h-4" /> Save</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─── Page ─── */
const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [detailTarget, setDetailTarget] = useState<Pharmacy | null>(null);
  const [pickerTarget, setPickerTarget] = useState<Pharmacy | null>(null);
  const [savingCoords, setSavingCoords] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback((pg: number, q: string, type: string) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: pg, limit: LIMIT };
    if (q)    params.search = q;
    if (type) params.type   = type;
    api.get("/pharmacy", { params })
      .then(r => {
        setPharmacies(r.data.data ?? []);
        setTotal(r.data.total ?? 0);
        setPages(r.data.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search, typeFilter); }, [page, typeFilter]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, v, typeFilter); }, 400);
  };

  const handleSaveCoords = async (lat: number, lng: number) => {
    if (!pickerTarget) return;
    setSavingCoords(true);
    try {
      await api.put(`/pharmacy/${pickerTarget.id}`, { latitude: lat, longitude: lng });
      setPharmacies(prev => prev.map(p =>
        p.id === pickerTarget.id ? { ...p, latitude: lat, longitude: lng, gps_source: "MANUAL" } : p
      ));
      if (detailTarget?.id === pickerTarget.id) {
        setDetailTarget(prev => prev ? { ...prev, latitude: lat, longitude: lng, gps_source: "MANUAL" } : null);
      }
      setPickerTarget(null);
    } catch { /* user can retry */ }
    finally { setSavingCoords(false); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Licensed Pharmacies</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${total.toLocaleString()} pharmacies · NDA licensed outlets`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, district, or region…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#16a34a] cursor-pointer">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaHospital className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No matching pharmacies</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "1fr 12rem 14rem 10rem 2.5rem" }}>
              <span>Pharmacy</span><span>Type</span><span>Location</span><span>District</span><span />
            </div>
            <div className="divide-y divide-gray-50">
              {pharmacies.map(p => {
                const hasCoords = p.latitude != null && p.longitude != null;
                return (
                  <div key={p.id} className="grid items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/60"
                    style={{ gridTemplateColumns: "1fr auto" }}>
                    {/* Mobile */}
                    <div className="flex items-start gap-2.5 sm:hidden">
                      <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <FaHospital className="w-3.5 h-3.5 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2530] leading-snug">{p.pharmacy_name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {[p.district, p.region].filter(Boolean).join(" · ")}
                        </p>
                        {p.pharmacy_type && (
                          <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_COLOURS[p.pharmacy_type] ?? TYPE_COLOURS.INDEPENDENT}`}>
                            {TYPE_LABELS[p.pharmacy_type] ?? p.pharmacy_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:grid items-center gap-3 min-w-0"
                      style={{ gridTemplateColumns: "1fr 12rem 14rem 10rem" }}>
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{p.pharmacy_name}</p>
                      {p.pharmacy_type ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit whitespace-nowrap ${TYPE_COLOURS[p.pharmacy_type] ?? TYPE_COLOURS.INDEPENDENT}`}>
                          {TYPE_LABELS[p.pharmacy_type] ?? p.pharmacy_type}
                        </span>
                      ) : <span />}
                      <p className="text-xs text-gray-500 truncate">{p.location ?? "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{p.district ?? "—"}</p>
                    </div>
                    {/* GPS icon button — opens details modal */}
                    <button onClick={() => setDetailTarget(p)} title={hasCoords ? "View details / Edit coordinates" : "View details / Set coordinates"}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg border focus-visible:outline-none ${
                        hasCoords ? "border-[#dcfce7] text-[#16a34a] hover:bg-[#f0fdf4]" : "border-gray-200 text-gray-400 hover:bg-gray-50"
                      }`} style={{ transition: "background-color 0.15s" }}>
                      {hasCoords ? <LuPencil className="w-3.5 h-3.5" /> : <LuMapPin className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} total</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <FaChevronLeft className="w-3 h-3" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pages - 4));
              const pg = start + i;
              if (pg > pages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border ${
                    pg === page ? "bg-[#16a34a] text-white border-[#16a34a]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>{pg}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Pharmacy Details Modal */}
      {detailTarget && !pickerTarget && (
        <PharmacyDetailsModal
          pharmacy={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEditCoords={() => setPickerTarget(detailTarget)}
        />
      )}

      {/* Coordinate Picker (layered on top) */}
      {pickerTarget && (
        <CoordinatePickerModal
          pharmacyName={pickerTarget.pharmacy_name}
          initial={{ lat: pickerTarget.latitude ?? null, lng: pickerTarget.longitude ?? null }}
          saving={savingCoords}
          onClose={() => setPickerTarget(null)}
          onSave={handleSaveCoords}
        />
      )}
    </div>
  );
};

export default Pharmacies;
