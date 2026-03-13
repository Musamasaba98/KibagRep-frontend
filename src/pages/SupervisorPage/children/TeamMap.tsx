import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MdOutlineGpsOff } from "react-icons/md";
import { LuMapPin } from "react-icons/lu";
import { getTeamMapApi } from "../../../services/api";

// Fix Leaflet default icon broken by Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Colour palette per rep ───────────────────────────────────────────────────
const PALETTE = [
  "#16a34a", "#2563eb", "#9333ea", "#ea580c", "#0891b2",
  "#be185d", "#ca8a04", "#059669", "#7c3aed", "#dc2626",
];

function repIcon(color: string) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -32],
  });
}

// ─── Auto-fit bounds ──────────────────────────────────────────────────────────
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 14); return; }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points.length]);
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Activity {
  id: string; date: string; gps_lat: number; gps_lng: number;
  gps_anomaly: boolean; nca_reason: string | null;
  doctor: { doctor_name: string; town?: string } | null;
  focused_product: { product_name: string } | null;
}
interface RepData {
  user: { id: string; firstname: string; lastname: string };
  activities: Activity[];
}

const FMT_DT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Days = 1 | 3 | 7;

// ─── Main ─────────────────────────────────────────────────────────────────────
const TeamMap = () => {
  const [days, setDays] = useState<Days>(3);
  const [repData, setRepData] = useState<RepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReps, setActiveReps] = useState<Set<string>>(new Set());

  const load = useCallback((d: Days) => {
    setLoading(true);
    getTeamMapApi(d)
      .then(r => {
        const data: RepData[] = r.data?.data ?? [];
        setRepData(data);
        setActiveReps(new Set(data.map(r => r.user.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const toggleRep = (id: string) => {
    setActiveReps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visibleData = repData.filter(r => activeReps.has(r.user.id));

  const allPoints: [number, number][] = visibleData.flatMap(r =>
    r.activities.map(a => [a.gps_lat, a.gps_lng] as [number, number])
  );

  const colorOf = (userId: string) => {
    const idx = repData.findIndex(r => r.user.id === userId);
    return PALETTE[idx % PALETTE.length];
  };

  const totalPins = visibleData.reduce((s, r) => s + r.activities.length, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Sidebar ── */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <LuMapPin className="w-4 h-4 text-[#16a34a]" />
            <h2 className="text-sm font-bold text-[#1a1a1a]">Team Map</h2>
          </div>
          <div className="flex gap-1">
            {([1, 3, 7] as Days[]).map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  days === d ? "bg-[#16a34a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={{ transition: "background-color 0.15s" }}>
                {d}d
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{totalPins} GPS points visible</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
            </div>
          ) : repData.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">No GPS data yet</p>
          ) : (
            repData.map((r, i) => {
              const color = PALETTE[i % PALETTE.length];
              const active = activeReps.has(r.user.id);
              const count = r.activities.length;
              const anomalies = r.activities.filter(a => a.gps_anomaly).length;
              return (
                <button key={r.user.id} onClick={() => toggleRep(r.user.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${
                    !active ? "opacity-40" : ""
                  }`}
                  style={{ transition: "opacity 0.15s" }}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1a1a1a] truncate">
                      {r.user.firstname} {r.user.lastname}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {count} visit{count !== 1 ? "s" : ""}
                      {anomalies > 0 && <span className="text-red-500 ml-1">· {anomalies} anomal{anomalies !== 1 ? "ies" : "y"}</span>}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
          </div>
        )}
        {!loading && totalPins === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50">
            <MdOutlineGpsOff className="w-14 h-14 opacity-25" />
            <p className="text-sm font-medium">No GPS data in the last {days} day{days !== 1 ? "s" : ""}</p>
            <p className="text-xs text-gray-400">GPS coordinates are captured when reps log visits</p>
          </div>
        ) : (
          <MapContainer
            center={allPoints[0] ?? [-1.2921, 36.8219]}
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FitBounds points={allPoints} />
            {visibleData.map((r) => {
              const color = colorOf(r.user.id);
              return r.activities.map(a => (
                <div key={a.id}>
                  <Marker
                    position={[a.gps_lat, a.gps_lng]}
                    icon={repIcon(color)}
                  >
                    <Popup>
                      <div className="text-xs min-w-[160px]">
                        <p className="font-bold text-[#1a1a1a] mb-1">{r.user.firstname} {r.user.lastname}</p>
                        {a.doctor && <p className="text-gray-700">{a.doctor.doctor_name}{a.doctor.town ? `, ${a.doctor.town}` : ""}</p>}
                        {a.focused_product && <p className="text-[#16a34a]">{a.focused_product.product_name}</p>}
                        <p className="text-gray-400 mt-1">{FMT_DT(a.date)}</p>
                        {a.gps_anomaly && <p className="text-red-500 font-semibold mt-1">⚠ GPS anomaly</p>}
                      </div>
                    </Popup>
                  </Marker>
                  {a.gps_anomaly && (
                    <CircleMarker
                      center={[a.gps_lat, a.gps_lng]}
                      radius={14}
                      pathOptions={{ color: "#ef4444", fillColor: "transparent", weight: 2 }}
                    />
                  )}
                </div>
              ));
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default TeamMap;
