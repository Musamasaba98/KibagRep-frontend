import { useState, useEffect, useRef } from "react";
import { FaHospital, FaMagnifyingGlass, FaXmark, FaPlus, FaCheck, FaLocationDot } from "react-icons/fa6";
import {
  getCompanyPharmaciesApi,
  addCompanyPharmacyApi,
  updateCompanyPharmacyApi,
  removeCompanyPharmacyApi,
  searchPharmaciesApi,
} from "../../../services/api";

type Tier = "A" | "B" | "C";

interface MasterPharmacy {
  id: string;
  pharmacy_name: string;
  location?: string;
  town?: string;
  district?: string;
  region?: string;
}

interface CompanyPharmacyRow {
  pharmacy_id: string;
  tier: Tier;
  notes?: string | null;
  pharmacy: MasterPharmacy;
}

const TIER_COLOR: Record<Tier, string> = {
  A: "bg-green-100 text-[#16a34a] border-green-200",
  B: "bg-amber-100 text-amber-700 border-amber-200",
  C: "bg-gray-100 text-gray-600 border-gray-200",
};

const TIER_LABEL: Record<Tier, string> = {
  A: "Tier A — High priority",
  B: "Tier B — Regular",
  C: "Tier C — Low priority",
};

const TIERS: Tier[] = ["A", "B", "C"];

const CompanyPharmacies = () => {
  const [rows, setRows]               = useState<CompanyPharmacyRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [listQ, setListQ]             = useState("");

  // Master-search panel
  const [searchQ, setSearchQ]         = useState("");
  const [searchResults, setSearchResults] = useState<MasterPharmacy[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [addingId, setAddingId]       = useState<string | null>(null);
  const [pendingTier, setPendingTier] = useState<Record<string, Tier>>({});
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Inline tier editing
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [savingTier, setSavingTier]   = useState<string | null>(null);
  const [removing, setRemoving]       = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getCompanyPharmaciesApi()
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
      searchPharmaciesApi(searchQ.trim())
        .then(r => setSearchResults(r.data.data ?? r.data ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ, showSearch]);

  const onListQ = (v: string) => setListQ(v);

  const filtered = listQ.length >= 2
    ? rows.filter(r => {
        const q = listQ.toLowerCase();
        const p = r.pharmacy;
        return (
          p.pharmacy_name.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.town?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q)
        );
      })
    : rows;

  const alreadyAdded = new Set(rows.map(r => r.pharmacy_id));

  const handleAdd = async (pharmacy: MasterPharmacy) => {
    const tier = pendingTier[pharmacy.id] ?? "B";
    setAddingId(pharmacy.id);
    try {
      await addCompanyPharmacyApi({ pharmacy_id: pharmacy.id, tier });
      load();
      setSearchResults(prev => prev.filter(p => p.id !== pharmacy.id));
    } catch { alert("Failed to add pharmacy"); }
    finally { setAddingId(null); }
  };

  const handleTierSave = async (pharmacyId: string, tier: Tier) => {
    setSavingTier(pharmacyId);
    try {
      await updateCompanyPharmacyApi(pharmacyId, { tier });
      setRows(prev => prev.map(r => r.pharmacy_id === pharmacyId ? { ...r, tier } : r));
      setEditingTier(null);
    } catch { alert("Failed to update tier"); }
    finally { setSavingTier(null); }
  };

  const handleRemove = async (pharmacyId: string) => {
    if (!confirm("Remove this pharmacy from your company list?")) return;
    setRemoving(pharmacyId);
    try {
      await removeCompanyPharmacyApi(pharmacyId);
      setRows(prev => prev.filter(r => r.pharmacy_id !== pharmacyId));
    } catch { alert("Failed to remove pharmacy"); }
    finally { setRemoving(null); }
  };

  const tierCounts = { A: 0, B: 0, C: 0 } as Record<Tier, number>;
  for (const r of rows) if (r.tier in tierCounts) tierCounts[r.tier as Tier]++;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Company Pharmacies</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {rows.length} pharmacies on your list
          </p>
        </div>
        <button
          onClick={() => { setShowSearch(true); setSearchQ(""); setSearchResults([]); }}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Add Pharmacy</span>
        </button>
      </div>

      {/* Tier summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {TIERS.map(t => (
          <div key={t} className="bg-white rounded-xl border border-gray-100 p-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]">
            <p className="text-xs text-gray-400 font-medium mb-1">Tier {t}</p>
            <p className="text-xl font-black text-[#1a2530]">{tierCounts[t]}</p>
          </div>
        ))}
      </div>

      {/* Search master list panel */}
      {showSearch && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.07)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1a2530]">Search NDA Pharmacy Database</p>
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
              placeholder="Type pharmacy name, town or district..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
            />
          </div>
          {searching && <p className="text-xs text-gray-400 text-center py-2">Searching...</p>}
          {!searching && searchQ.trim().length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No pharmacies found</p>
          )}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {searchResults.map(p => {
                const added = alreadyAdded.has(p.id);
                const tier  = pendingTier[p.id] ?? "B";
                return (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2530] truncate">{p.pharmacy_name}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <FaLocationDot className="w-3 h-3 shrink-0 text-gray-300" />
                        <span className="truncate">{[p.location || null, p.town || null, p.district || null, p.region || null].filter(Boolean).join(" · ") || "—"}</span>
                      </p>
                    </div>
                    {!added && (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={tier}
                          onChange={e => setPendingTier(prev => ({ ...prev, [p.id]: e.target.value as Tier }))}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30"
                        >
                          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          onClick={() => handleAdd(p)}
                          disabled={addingId === p.id}
                          className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                          style={{ transition: "background-color 0.15s" }}>
                          <FaPlus className="w-3 h-3" />
                          {addingId === p.id ? "Adding…" : "Add"}
                        </button>
                      </div>
                    )}
                    {added && (
                      <span className="flex items-center gap-1 text-[#16a34a] text-xs font-semibold">
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
        {/* List search */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              value={listQ}
              onChange={e => onListQ(e.target.value)}
              placeholder="Filter your pharmacy list..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FaHospital className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {listQ ? "No pharmacies match your filter" : "No pharmacies on your list yet — use Add Pharmacy to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <div key={r.pharmacy_id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{r.pharmacy.pharmacy_name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <FaLocationDot className="w-3 h-3 shrink-0 text-gray-300" />
                    <span className="truncate">{[r.pharmacy.location || null, r.pharmacy.town || null, r.pharmacy.district || null, r.pharmacy.region || null].filter(Boolean).join(" · ") || "—"}</span>
                  </p>
                </div>

                {/* Tier badge / editor */}
                {editingTier === r.pharmacy_id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {TIERS.map(t => (
                      <button
                        key={t}
                        onClick={() => handleTierSave(r.pharmacy_id, t)}
                        disabled={savingTier === r.pharmacy_id}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${r.tier === t ? TIER_COLOR[t] : "text-gray-400 border-gray-200 hover:border-gray-300"}`}
                        style={{ transition: "background-color 0.1s" }}>
                        {t}
                      </button>
                    ))}
                    <button
                      onClick={() => setEditingTier(null)}
                      className="text-gray-400 hover:text-gray-600 ml-1">
                      <FaXmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingTier(r.pharmacy_id)}
                    title={TIER_LABEL[r.tier]}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${TIER_COLOR[r.tier]} hover:opacity-80`}
                    style={{ transition: "opacity 0.1s" }}>
                    Tier {r.tier}
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemove(r.pharmacy_id)}
                  disabled={removing === r.pharmacy_id}
                  title="Remove from list"
                  className="text-gray-300 hover:text-red-400 disabled:opacity-40 shrink-0"
                  style={{ transition: "color 0.1s" }}>
                  <FaXmark className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPharmacies;
