import { useState, useEffect, useRef } from "react";
import { FaBuildingColumns, FaMagnifyingGlass, FaXmark, FaPlus, FaCheck } from "react-icons/fa6";
import {
  getCompanyFacilitiesApi,
  addCompanyFacilityApi,
  removeCompanyFacilityApi,
  searchFacilitiesApi,
} from "../../../services/api";

interface MasterFacility {
  id: string;
  name: string;
  town?: string;
  location?: string;
  district?: string;
  facility_type?: string;
  ownership?: string;
}

interface CompanyFacilityRow {
  facility_id: string;
  notes?: string | null;
  facility: MasterFacility & {
    company_tiers?: { tier: string }[];
  };
}

const TYPE_COLOR: Record<string, string> = {
  "Regional Referral Hospital": "bg-purple-100 text-purple-700 border-purple-200",
  "General Hospital":           "bg-blue-100 text-blue-700 border-blue-200",
  "Health Centre IV":           "bg-green-100 text-[#16a34a] border-green-200",
  "Health Centre III":          "bg-teal-100 text-teal-700 border-teal-200",
  "Health Centre II":           "bg-gray-100 text-gray-600 border-gray-200",
  "Private Hospital":           "bg-amber-100 text-amber-700 border-amber-200",
  "Clinic":                     "bg-orange-100 text-orange-700 border-orange-200",
  "National Referral Hospital": "bg-red-100 text-red-700 border-red-200",
};

const typeChip = (type?: string) => {
  if (!type) return null;
  const cls = TYPE_COLOR[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {type}
    </span>
  );
};

const CompanyFacilities = () => {
  const [rows, setRows]                   = useState<CompanyFacilityRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [listQ, setListQ]                 = useState("");

  // Master-search panel
  const [searchQ, setSearchQ]             = useState("");
  const [searchResults, setSearchResults] = useState<MasterFacility[]>([]);
  const [searching, setSearching]         = useState(false);
  const [showSearch, setShowSearch]       = useState(false);
  const [addingId, setAddingId]           = useState<string | null>(null);
  const [removing, setRemoving]           = useState<string | null>(null);
  const debounceRef                       = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = () => {
    setLoading(true);
    getCompanyFacilitiesApi()
      .then(r => setRows(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Debounced master search
  useEffect(() => {
    if (!showSearch) return;
    clearTimeout(debounceRef.current);
    if (searchQ.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchFacilitiesApi(searchQ.trim())
        .then(r => setSearchResults(r.data.data ?? r.data ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ, showSearch]);

  const filtered = listQ.length >= 2
    ? rows.filter(r =>
        r.facility.name.toLowerCase().includes(listQ.toLowerCase()) ||
        r.facility.town?.toLowerCase().includes(listQ.toLowerCase()) ||
        r.facility.district?.toLowerCase().includes(listQ.toLowerCase()) ||
        r.facility.facility_type?.toLowerCase().includes(listQ.toLowerCase())
      )
    : rows;

  const alreadyAdded = new Set(rows.map(r => r.facility_id));

  const handleAdd = async (facility: MasterFacility) => {
    setAddingId(facility.id);
    try {
      await addCompanyFacilityApi({ facility_id: facility.id });
      load();
      setSearchResults(prev => prev.filter(f => f.id !== facility.id));
    } catch { alert("Failed to add facility"); }
    finally { setAddingId(null); }
  };

  const handleRemove = async (facilityId: string) => {
    if (!confirm("Remove this facility from your company list?")) return;
    setRemoving(facilityId);
    try {
      await removeCompanyFacilityApi(facilityId);
      setRows(prev => prev.filter(r => r.facility_id !== facilityId));
    } catch { alert("Failed to remove facility"); }
    finally { setRemoving(null); }
  };

  const typeCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const t = r.facility.facility_type ?? "Other";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Company Facilities</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {rows.length} facilities on your list
          </p>
        </div>
        <button
          onClick={() => { setShowSearch(true); setSearchQ(""); setSearchResults([]); }}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Add Facility</span>
        </button>
      </div>

      {/* Summary strip */}
      {topTypes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {topTypes.map(([type, count]) => (
            <div key={type} className="bg-white rounded-xl border border-gray-100 p-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
              <p className="text-xs text-gray-400 font-medium mb-1 truncate">{type}</p>
              <p className="text-xl font-black text-[#1a2530]">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search master list panel */}
      {showSearch && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.07)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1a2530]">Search NHFR Facility Database</p>
            <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-gray-600">
              <FaXmark className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Type facility name, town or district..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
            />
          </div>
          {searching && <p className="text-xs text-gray-400 text-center py-2">Searching…</p>}
          {!searching && searchQ.trim().length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No facilities found</p>
          )}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {searchResults.map(f => {
                const added = alreadyAdded.has(f.id);
                return (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a2530] truncate">{f.name}</p>
                        {typeChip(f.facility_type)}
                      </div>
                      <p className="text-xs text-gray-400">{[f.location, f.town, f.district].filter(Boolean).join(" · ")}</p>
                    </div>
                    {!added ? (
                      <button
                        onClick={() => handleAdd(f)}
                        disabled={addingId === f.id}
                        className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 shrink-0"
                        style={{ transition: "background-color 0.15s" }}>
                        <FaPlus className="w-3 h-3" />
                        {addingId === f.id ? "Adding…" : "Add"}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[#16a34a] text-xs font-semibold shrink-0">
                        <FaCheck className="w-3 h-3" /> Added
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Company list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              value={listQ}
              onChange={e => setListQ(e.target.value)}
              placeholder="Filter your facility list..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FaBuildingColumns className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {listQ ? "No facilities match your filter" : "No facilities on your list yet — use Add Facility to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => {
              const tier = r.facility.company_tiers?.[0]?.tier;
              return (
                <div key={r.facility_id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{r.facility.name}</p>
                      {typeChip(r.facility.facility_type)}
                      {tier && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-100 text-[#16a34a] border-green-200">
                          Tier {tier}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[r.facility.location, r.facility.town, r.facility.district].filter(Boolean).join(" · ")}
                      {r.facility.ownership ? ` · ${r.facility.ownership}` : ""}
                    </p>
                    {r.notes && <p className="text-xs text-gray-400 italic mt-0.5">{r.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleRemove(r.facility_id)}
                    disabled={removing === r.facility_id}
                    title="Remove from list"
                    className="text-gray-300 hover:text-red-400 disabled:opacity-40 shrink-0"
                    style={{ transition: "color 0.1s" }}>
                    <FaXmark className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyFacilities;
