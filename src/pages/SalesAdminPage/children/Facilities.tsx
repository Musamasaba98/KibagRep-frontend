import { useState, useEffect, useCallback } from "react";
import { FaBuildingColumns, FaMagnifyingGlass, FaLocationDot } from "react-icons/fa6";
import { MdOutlineGpsOff } from "react-icons/md";
import { LuShieldAlert } from "react-icons/lu";
import api from "../../../services/api";

interface Facility {
  id: string;
  name: string;
  facility_type?: string;
  town?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}

const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");

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

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">

      {/* Header */}
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

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
        <LuShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-sky-800">Managed by KibagRep platform administrators</p>
          <p className="text-xs text-sky-700 mt-0.5 leading-relaxed">
            Facility records and GPS coordinates can only be created or edited by the Super Admin.
            If a facility is missing or has incorrect coordinates, contact your KibagRep administrator.
          </p>
        </div>
      </div>

      {/* GPS coverage warning */}
      {withoutCoords > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <MdOutlineGpsOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">{withoutCoords} facilit{withoutCoords !== 1 ? "ies" : "y"} without GPS coordinates.</span>
            {" "}GPS anomaly detection will not fire for visits to doctors at these facilities until
            the Super Admin pins their location.
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

      {/* Facility list — read-only */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaBuildingColumns className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{q ? "No matching facilities" : "No facilities yet"}</p>
          </div>
        ) : (
          <>
            <div className="grid px-4 sm:px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "2rem 1fr auto" }}>
              <span />
              <span>Facility</span>
              <span className="text-right">Coordinates</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(f => {
                const hasCoords = f.latitude != null && f.longitude != null;
                return (
                  <div key={f.id}
                    className="grid items-center gap-3 px-4 sm:px-5 py-3.5"
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
                    <div className="shrink-0">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Facilities;
