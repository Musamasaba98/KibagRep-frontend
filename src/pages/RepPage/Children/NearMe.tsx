import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaUserDoctor, FaLocationCrosshairs } from "react-icons/fa6";
import { MdOutlineSearch, MdMyLocation } from "react-icons/md";
import { FiAlertCircle } from "react-icons/fi";
import { getCompanyDoctorListApi } from "../../../services/api";

// Fix Leaflet default icon broken by Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Custom coloured marker factory ──────────────────────────────────────────

function coloredIcon(color: string) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const ICONS = {
  company:    coloredIcon("#16a34a"),   // green — on company list
  directory:  coloredIcon("#64748b"),   // slate — full directory
  me:         coloredIcon("#ef4444"),   // red — current location
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  doctor_name: string;
  town?: string;
  location?: string;
  cadre?: string;
  speciality?: string[];
  contact?: string;
  latitude?: number | null;
  longitude?: number | null;
  on_company_list?: boolean;
}

// ─── Haversine distance (km) ─────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Re-centre map when userPos changes ──────────────────────────────────────

function RecenterOnMe({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 15);
  }, [pos]);
  return null;
}

// ─── Doctor list card ─────────────────────────────────────────────────────────

const DoctorCard = ({
  doc,
  distKm,
  onClick,
}: {
  doc: Doctor;
  distKm: number | null;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-[0_1px_6px_0_rgba(0,0,0,0.06)] hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.10)] cursor-pointer transition-shadow"
  >
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        doc.on_company_list ? "bg-[#dcfce7]" : "bg-gray-100"
      }`}
    >
      <FaUserDoctor
        className={`w-4 h-4 ${doc.on_company_list ? "text-[#16a34a]" : "text-gray-400"}`}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-[#222f36] truncate">{doc.doctor_name}</p>
      <p className="text-[10px] text-gray-400 truncate mt-0.5">
        {[doc.location, doc.town].filter(Boolean).join(" · ") || "—"}
      </p>
      {doc.speciality && doc.speciality.length > 0 && (
        <p className="text-[10px] text-[#16a34a] font-medium truncate mt-0.5">
          {doc.speciality.slice(0, 2).join(", ")}
        </p>
      )}
    </div>
    {distKm !== null && (
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-gray-500">
          {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
        </p>
        <p className="text-[9px] text-gray-300">away</p>
      </div>
    )}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [0.5, 1, 2, 5];

const NearMe = () => {
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userPos, setUserPos]     = useState<[number, number] | null>(null);
  const [gpsError, setGpsError]   = useState("");
  const [locating, setLocating]   = useState(false);
  const [radius, setRadius]       = useState(2);        // km
  const [search, setSearch]       = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef                    = useRef<L.Map | null>(null);

  // Load company doctor list on mount
  useEffect(() => {
    getCompanyDoctorListApi()
      .then((res) => {
        const raw = res.data?.data ?? [];
        // Flatten company-scope response (nested doctor object)
        const normalized: Doctor[] = raw.map((cd: any) => ({
          id: cd.doctor?.id ?? cd.doctor_id,
          doctor_name: cd.doctor?.doctor_name ?? "",
          town: cd.doctor?.town,
          location: cd.doctor?.location,
          cadre: cd.doctor?.cadre,
          speciality: cd.doctor?.speciality ?? [],
          contact: cd.doctor?.contact,
          latitude: cd.doctor?.latitude ?? null,
          longitude: cd.doctor?.longitude ?? null,
          on_company_list: true,
        }));
        setDoctors(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get user's GPS position
  const locate = () => {
    setLocating(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setGpsError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Run on first load
  useEffect(() => { locate(); }, []);

  // Filter: search + radius (when user pos known)
  const filtered = useMemo(() => {
    let list = doctors.filter((d) =>
      !search ||
      d.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      d.town?.toLowerCase().includes(search.toLowerCase()) ||
      d.location?.toLowerCase().includes(search.toLowerCase())
    );

    if (userPos) {
      list = list
        .map((d) => ({
          ...d,
          _dist:
            d.latitude && d.longitude
              ? haversine(userPos[0], userPos[1], d.latitude, d.longitude)
              : null,
        }))
        .filter((d) => d._dist === null || d._dist <= radius)
        .sort((a, b) => (a._dist ?? 9999) - (b._dist ?? 9999)) as any;
    }

    return list;
  }, [doctors, search, userPos, radius]);

  // Doctors with coordinates (for map markers)
  const mappable = useMemo(
    () => filtered.filter((d: any) => d.latitude && d.longitude),
    [filtered]
  );

  const flyTo = (doc: Doctor) => {
    setSelectedId(doc.id);
    if (doc.latitude && doc.longitude && mapRef.current) {
      mapRef.current.flyTo([doc.latitude, doc.longitude], 16, { duration: 0.8 });
    }
  };

  // Default map centre: Uganda
  const defaultCenter: [number, number] = userPos ?? [1.3733, 32.2903];

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 130px)" }}>

      {/* ── Left: doctor list ── */}
      <div className="w-[300px] shrink-0 flex flex-col gap-3 overflow-hidden">

        {/* Search */}
        <div className="relative">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search HCPs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors bg-white"
          />
        </div>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-500 shrink-0">Radius:</span>
          <div className="flex gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                  radius === r
                    ? "bg-[#16a34a] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {r < 1 ? `${r * 1000}m` : `${r}km`}
              </button>
            ))}
          </div>
          <button
            onClick={locate}
            disabled={locating}
            title="Re-locate me"
            className="ml-auto w-8 h-8 rounded-full bg-[#16a34a] text-white flex items-center justify-center hover:bg-[#15803d] disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            {locating ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <MdMyLocation className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* GPS error */}
        {gpsError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
            <FiAlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>GPS unavailable. Showing all doctors. {gpsError}</span>
          </div>
        )}

        {/* Count */}
        <p className="text-[11px] font-semibold text-gray-400">
          {loading ? "Loading…" : `${filtered.length} HCPs ${userPos ? `within ${radius}km` : "on your list"}`}
        </p>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((doc: any) => (
            <DoctorCard
              key={doc.id}
              doc={doc}
              distKm={doc._dist ?? null}
              onClick={() => flyTo(doc)}
            />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-10 text-gray-300 text-center">
              <FaLocationCrosshairs className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-semibold text-gray-400">No HCPs in range</p>
              <p className="text-xs text-gray-300 mt-1">Try increasing the radius</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Leaflet map ── */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-[0_2px_16px_0_rgba(0,0,0,0.08)]">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterOnMe pos={userPos} />

          {/* User position */}
          {userPos && (
            <>
              <Marker position={userPos} icon={ICONS.me}>
                <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>
              <Circle
                center={userPos}
                radius={radius * 1000}
                pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.05, weight: 1.5, dashArray: "4 4" }}
              />
            </>
          )}

          {/* Doctor markers */}
          {mappable.map((doc: any) => (
            <Marker
              key={doc.id}
              position={[doc.latitude, doc.longitude]}
              icon={doc.on_company_list ? ICONS.company : ICONS.directory}
              eventHandlers={{ click: () => setSelectedId(doc.id) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{doc.doctor_name}</p>
                  {doc.cadre && <p className="text-gray-500 text-xs">{doc.cadre}</p>}
                  {(doc.location || doc.town) && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      {[doc.location, doc.town].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {doc.contact && (
                    <p className="text-xs mt-1 text-[#16a34a]">{doc.contact}</p>
                  )}
                  {doc._dist !== null && (
                    <p className="text-xs text-gray-400 mt-1">
                      {doc._dist < 1
                        ? `${Math.round(doc._dist * 1000)} m away`
                        : `${doc._dist.toFixed(1)} km away`}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default NearMe;
