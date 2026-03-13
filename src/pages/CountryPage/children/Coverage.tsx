import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LuMapPin, LuUsers, LuCalendar, LuTrendingUp } from "react-icons/lu";
import { MdOutlineWarningAmber } from "react-icons/md";
import { getCompanyFeedApi } from "../../../services/api";

// ─── Uganda town coordinates ──────────────────────────────────────────────────
const TOWN_COORDS: Record<string, [number, number]> = {
  Kampala:      [0.3136,  32.5811],
  Gulu:         [2.7748,  32.2990],
  Mbarara:      [-0.6068, 30.6451],
  Jinja:        [0.4244,  33.2041],
  "Fort Portal":[0.6710,  30.2744],
  Entebbe:      [0.0512,  32.4637],
  Mbale:        [1.0796,  34.1753],
  Masaka:       [-0.3355, 31.7357],
  Lira:         [2.2499,  32.8998],
  Soroti:       [1.7156,  33.6111],
  Arua:         [3.0200,  30.9114],
  Kabale:       [-1.2491, 29.9886],
  Hoima:        [1.4337,  31.3528],
  Kasese:       [0.1869,  30.0852],
  Tororo:       [0.7003,  34.1807],
};

// ─── Colour scale by visit density ───────────────────────────────────────────
function markerColor(visits: number, max: number): string {
  const ratio = max > 0 ? visits / max : 0;
  if (ratio >= 0.75) return "#15803d"; // deep green
  if (ratio >= 0.5)  return "#16a34a"; // brand green
  if (ratio >= 0.25) return "#86efac"; // light green
  return "#bbf7d0";                    // very light
}

function markerRadius(visits: number, max: number): number {
  const ratio = max > 0 ? visits / max : 0;
  return 10 + ratio * 30; // 10px–40px
}

const PERIODS = [
  { label: "7 days",  days: 7  },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Activity {
  id: string;
  date: string;
  gps_anomaly?: boolean;
  user: { id: string; firstname: string; lastname: string };
  doctor: { doctor_name: string; town: string };
  focused_product: { product_name: string } | null;
}

interface TownStat {
  town: string;
  coords: [number, number];
  visits: number;
  anomalies: number;
  reps: Set<string>;
  products: Record<string, number>;
}

// ─── Component ───────────────────────────────────────────────────────────────
const Coverage = () => {
  const [feed, setFeed]         = useState<Activity[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [period, setPeriod]     = useState(30);

  useEffect(() => {
    setLoading(true);
    setError("");
    getCompanyFeedApi({ days: period, limit: 200 })
      .then((r) => setFeed(r.data?.data ?? []))
      .catch(() => setError("Failed to load activity data"))
      .finally(() => setLoading(false));
  }, [period]);

  // ── Aggregate by town ────────────────────────────────────────────────────
  const townStats = useMemo<TownStat[]>(() => {
    const map: Record<string, TownStat> = {};
    for (const act of feed) {
      const town = act.doctor?.town;
      if (!town) continue;
      const coords = TOWN_COORDS[town];
      if (!coords) continue;
      if (!map[town]) {
        map[town] = { town, coords, visits: 0, anomalies: 0, reps: new Set(), products: {} };
      }
      map[town].visits++;
      if (act.gps_anomaly) map[town].anomalies++;
      if (act.user?.id) map[town].reps.add(act.user.id);
      const prod = act.focused_product?.product_name;
      if (prod) map[town].products[prod] = (map[town].products[prod] ?? 0) + 1;
    }
    return Object.values(map).sort((a, b) => b.visits - a.visits);
  }, [feed]);

  const maxVisits = townStats[0]?.visits ?? 1;
  const totalVisits  = feed.length;
  const totalTowns   = townStats.length;
  const totalAnomalies = feed.filter((a) => a.gps_anomaly).length;
  const uniqueReps = new Set(feed.map((a) => a.user?.id).filter(Boolean)).size;

  return (
    <div className="w-full flex flex-col h-full min-h-screen">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Coverage Map</h1>
          <p className="text-gray-400 text-sm mt-0.5">Visit density by location — Uganda field coverage</p>
        </div>
        {/* Period filter */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                period === p.days
                  ? "bg-white text-[#16a34a] shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-[#16a34a]"
              }`}
              style={{ transition: "color 0.15s" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Visits",    value: loading ? "—" : totalVisits.toLocaleString(), icon: LuCalendar,     color: "text-[#16a34a]", bg: "bg-[#f0fdf4]" },
          { label: "Towns Covered",   value: loading ? "—" : totalTowns,                   icon: LuMapPin,       color: "text-sky-600",   bg: "bg-sky-50"    },
          { label: "Active Reps",     value: loading ? "—" : uniqueReps,                   icon: LuUsers,        color: "text-amber-600", bg: "bg-amber-50"  },
          { label: "GPS Anomalies",   value: loading ? "—" : totalAnomalies,               icon: LuTrendingUp,   color: "text-red-500",   bg: "bg-red-50"    },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <div>
              <p className="font-black text-[#1a1a1a] text-xl leading-none">{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main: map + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-6 pb-6 flex-1 min-h-0">

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[480px]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-[#f0fdf4]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
                <p className="text-sm text-gray-400">Loading map data…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[1.3733, 32.2903]}
              zoom={7}
              style={{ width: "100%", height: "100%", minHeight: 480 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {townStats.map((ts) => (
                <CircleMarker
                  key={ts.town}
                  center={ts.coords}
                  radius={markerRadius(ts.visits, maxVisits)}
                  pathOptions={{
                    fillColor: markerColor(ts.visits, maxVisits),
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 0.85,
                  }}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-bold text-[#1a1a1a] text-sm mb-2">{ts.town}</p>
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span>🩺 <b>{ts.visits}</b> visit{ts.visits !== 1 ? "s" : ""}</span>
                        <span>👤 <b>{ts.reps.size}</b> rep{ts.reps.size !== 1 ? "s" : ""}</span>
                        {ts.anomalies > 0 && (
                          <span className="text-red-500">⚠ <b>{ts.anomalies}</b> GPS anomal{ts.anomalies !== 1 ? "ies" : "y"}</span>
                        )}
                        {Object.keys(ts.products).length > 0 && (
                          <div className="mt-1 pt-1 border-t border-gray-100">
                            <p className="font-semibold text-gray-500 mb-0.5">Top products:</p>
                            {Object.entries(ts.products)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([name, count]) => (
                                <p key={name} className="truncate">{name} <b>×{count}</b></p>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4 flex-shrink-0">

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-bold text-[#1a1a1a] text-sm mb-3">Visit Density</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "High  (≥ 75%)", color: "#15803d" },
                { label: "Good  (50–75%)", color: "#16a34a" },
                { label: "Low   (25–50%)", color: "#86efac" },
                { label: "Sparse (< 25%)", color: "#bbf7d0" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-xs text-gray-600">{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 mt-1">
                <span className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm bg-[#16a34a] opacity-40" />
                <span className="text-xs text-gray-400">Larger circle = more visits</span>
              </div>
            </div>
          </div>

          {/* Town rankings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 overflow-auto">
            <p className="font-bold text-[#1a1a1a] text-sm mb-3">By Location</p>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
              </div>
            ) : townStats.length === 0 ? (
              <div className="text-center py-6">
                <LuMapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No visit data for this period</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {townStats.map((ts, i) => {
                  const pct = Math.round((ts.visits / maxVisits) * 100);
                  return (
                    <div key={ts.town}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <span className="text-sm font-semibold text-[#1a1a1a]">{ts.town}</span>
                          {ts.anomalies > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-semibold">
                              {ts.anomalies} ⚠
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#16a34a]">{ts.visits}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: markerColor(ts.visits, maxVisits),
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {ts.reps.size} rep{ts.reps.size !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coverage;
