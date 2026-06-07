import { useState, useEffect, useCallback, useRef } from "react";
import { FaBuildingColumns, FaPlus, FaXmark, FaMagnifyingGlass, FaLocationDot, FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa6";
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

const TYPE_COLOURS: Record<string, string> = {
  "NRH":             "bg-red-50 text-red-700 border-red-200",
  "RRH":             "bg-orange-50 text-orange-700 border-orange-200",
  "General Hospital":"bg-amber-50 text-amber-700 border-amber-200",
  "HC IV":           "bg-violet-50 text-violet-700 border-violet-200",
  "HC III":          "bg-blue-50 text-blue-700 border-blue-200",
  "HC II":           "bg-gray-50 text-gray-600 border-gray-200",
  "Clinic":          "bg-sky-50 text-sky-700 border-sky-200",
};
const OWN_COLOURS: Record<string, string> = {
  "GOV":  "bg-green-50 text-green-700 border-green-200",
  "PNFP": "bg-purple-50 text-purple-700 border-purple-200",
  "PFP":  "bg-blue-50 text-blue-700 border-blue-200",
};

interface Facility {
  id: string; name: string; facility_type?: string; town?: string;
  district?: string; region?: string; ownership?: string;
  latitude?: number | null; longitude?: number | null;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

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

const CoordinatePickerModal = ({
  facilityName, initial, onSave, onClose, saving,
}: { facilityName: string; initial: { lat: number | null; lng: number | null }; onSave: (lat: number, lng: number) => void; onClose: () => void; saving: boolean }) => {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [latInput, setLatInput] = useState(initial.lat != null ? String(initial.lat) : "");
  const [lngInput, setLngInput] = useState(initial.lng != null ? String(initial.lng) : "");
  const [err, setErr]           = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Geocoding search
  const [geoQ, setGeoQ]           = useState(facilityName);
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

  // Auto-search on open with facility name
  useEffect(() => { searchGeo(facilityName); }, []);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-[#1a2530] text-base">Set Map Coordinates</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{facilityName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Geocoding search bar */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 relative">
          <div className="relative">
            {geoLoading
              ? <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              : <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            }
            <input
              value={geoQ}
              onChange={e => { setGeoQ(e.target.value); searchGeo(e.target.value); }}
              placeholder="Search for location…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
          </div>
          {/* Suggestions dropdown */}
          {geoResults.length > 0 && (
            <div className="absolute left-5 right-5 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-[0_4px_20px_0_rgba(0,0,0,0.10)] z-10 overflow-hidden">
              {geoResults.map(r => (
                <button
                  key={r.place_id}
                  onClick={() => handleSuggestion(r)}
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

        {/* Instruction hint */}
        <div className="px-5 py-2 bg-sky-50 border-b border-sky-100 shrink-0">
          <p className="text-xs text-sky-700">
            <span className="font-semibold">Pick a suggestion</span> above to fly to it, then <span className="font-semibold">click the map</span> to place the pin exactly, or drag the marker to adjust.
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[240px]" style={{ cursor: "crosshair" }}>
          <MapContainer
            center={pos ? [pos.lat, pos.lng] : UGANDA_CENTER}
            zoom={pos ? 15 : 7}
            style={{ width: "100%", height: "100%", minHeight: 240 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={handleMapPick} />
            <FlyTo target={flyTarget} />
            {pos && (
              <Marker
                position={[pos.lat, pos.lng]}
                icon={GREEN_ICON}
                draggable
                eventHandlers={{ dragend(e) {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  handleMapPick(lat, lng);
                }}}
              />
            )}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex flex-col gap-3">
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

const LIMIT = 50;
const TYPES = ["HC II", "HC III", "HC IV", "Clinic", "General Hospital", "RRH", "NRH"];
const OWNERSHIPS = ["GOV", "PFP", "PNFP"];

const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownFilter, setOwnFilter]   = useState("");
  const [pickerTarget, setPickerTarget]   = useState<Facility | null>(null);
  const [savingCoords, setSavingCoords]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback((pg: number, q: string, type: string, own: string) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: pg, limit: LIMIT };
    if (q)    params.search    = q;
    if (type) params.type      = type;
    if (own)  params.ownership = own;
    api.get("/facility", { params })
      .then(r => {
        setFacilities(r.data.data ?? []);
        setTotal(r.data.total ?? 0);
        setPages(r.data.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search, typeFilter, ownFilter); }, [page, typeFilter, ownFilter]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, v, typeFilter, ownFilter); }, 400);
  };

  const setFilter = (type: string, own: string) => {
    setTypeFilter(type); setOwnFilter(own); setPage(1);
  };

  const handleSaveCoords = async (lat: number, lng: number) => {
    if (!pickerTarget) return;
    setSavingCoords(true);
    try {
      await api.put(`/facility/${pickerTarget.id}`, { latitude: lat, longitude: lng });
      setFacilities(prev => prev.map(f => f.id === pickerTarget.id ? { ...f, latitude: lat, longitude: lng } : f));
      setPickerTarget(null);
    } catch { /* user can retry */ }
    finally { setSavingCoords(false); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Health Facilities</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${total.toLocaleString()} active facilities · Uganda NHFR registry`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, district, or region…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
        </div>
        <select value={typeFilter} onChange={e => setFilter(e.target.value, ownFilter)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#16a34a] cursor-pointer">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={ownFilter} onChange={e => setFilter(typeFilter, e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#16a34a] cursor-pointer">
          <option value="">All ownership</option>
          {OWNERSHIPS.map(o => <option key={o} value={o}>{o === "GOV" ? "Government" : o === "PFP" ? "Private For-Profit" : "Private Non-Profit"}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaBuildingColumns className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No matching facilities</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "1fr 9rem 14rem 5rem 2.5rem" }}>
              <span>Facility</span><span>Type</span><span>Location</span><span>Ownership</span><span />
            </div>
            <div className="divide-y divide-gray-50">
              {facilities.map(f => {
                const hasCoords = f.latitude != null && f.longitude != null;
                return (
                  <div key={f.id} className="grid items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/60"
                    style={{ gridTemplateColumns: "1fr auto" }}>
                    {/* Mobile layout */}
                    <div className="sm:hidden flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <FaBuildingColumns className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2530] leading-snug">{f.name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {[f.district, f.region].filter(Boolean).join(" · ")}
                        </p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {f.facility_type && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_COLOURS[f.facility_type] ?? TYPE_COLOURS["HC II"]}`}>
                              {f.facility_type}
                            </span>
                          )}
                          {f.ownership && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${OWN_COLOURS[f.ownership] ?? ""}`}>
                              {f.ownership}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Desktop layout */}
                    <div className="hidden sm:grid items-center gap-3 min-w-0"
                      style={{ gridTemplateColumns: "1fr 9rem 14rem 5rem" }}>
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{f.name}</p>
                      {f.facility_type ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit whitespace-nowrap ${TYPE_COLOURS[f.facility_type] ?? TYPE_COLOURS["HC II"]}`}>
                          {f.facility_type}
                        </span>
                      ) : <span />}
                      <p className="text-xs text-gray-500 truncate">{[f.district, f.region].filter(Boolean).join(", ")}</p>
                      {f.ownership ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${OWN_COLOURS[f.ownership] ?? ""}`}>
                          {f.ownership}
                        </span>
                      ) : <span />}
                    </div>
                    {/* GPS pin button */}
                    <button onClick={() => setPickerTarget(f)} title={hasCoords ? "Edit coordinates" : "Set coordinates"}
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
          <p className="text-xs text-gray-400">
            Page {page} of {pages} · {total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <FaChevronLeft className="w-3 h-3" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pages - 4));
              const p = start + i;
              if (p > pages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border ${
                    p === page ? "bg-[#16a34a] text-white border-[#16a34a]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {pickerTarget && (
        <CoordinatePickerModal
          facilityName={pickerTarget.name}
          initial={{ lat: pickerTarget.latitude ?? null, lng: pickerTarget.longitude ?? null }}
          saving={savingCoords}
          onClose={() => setPickerTarget(null)}
          onSave={handleSaveCoords}
        />
      )}
    </div>
  );
};

export default Facilities;
