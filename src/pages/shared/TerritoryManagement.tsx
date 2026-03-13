import { useEffect, useState, useCallback } from "react";
import {
  FiPlus, FiTrash2, FiEdit3, FiUsers, FiMapPin, FiX,
  FiChevronDown, FiChevronUp, FiSearch,
} from "react-icons/fi";
import { FaHospital, FaUserDoctor } from "react-icons/fa6";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  getTerritoriesApi, createTerritoryApi, updateTerritoryApi, deleteTerritoryApi,
  addTerritoryFacilityApi, removeTerritoryFacilityApi,
  unassignTerritoryRepApi,
  getFacilitiesApi,
} from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  doctor_name: string;
  cadre?: string;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  town?: string;
  description?: string;
  working_doctors?: { doctor: Doctor }[];
}

interface Rep {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
}

interface Territory {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  facilities: { facility: Facility }[];
  reps: Rep[];
}

type CardTab = "reps" | "facilities" | "details";

// ─── Create/Edit Territory modal ──────────────────────────────────────────────

const TerritoryForm = ({
  initial,
  onSave,
  onClose,
}: {
  initial?: Territory;
  onSave: (t: Territory) => void;
  onClose: () => void;
}) => {
  const [name, setName]             = useState(initial?.name ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [region, setRegion]         = useState(initial?.region ?? "");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const save = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const fn = initial ? updateTerritoryApi(initial.id, { name, description, region }) : createTerritoryApi({ name, region });
      const res = await fn;
      onSave(res.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="font-black text-[#1a1a1a] text-base">{initial ? "Edit Territory" : "New Territory"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kampala Central"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Region</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Central, Eastern, Western"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="Key areas, routes, or notes…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] resize-none transition-colors" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Territory card ───────────────────────────────────────────────────────────

const TerritoryCard = ({
  territory,
  allFacilities,
  onUpdated,
  onDeleted,
}: {
  territory: Territory;
  allFacilities: Facility[];
  onUpdated: (t: Territory) => void;
  onDeleted: (id: string) => void;
}) => {
  const [expanded, setExpanded]           = useState(false);
  const [activeTab, setActiveTab]         = useState<CardTab>("reps");
  const [showEdit, setShowEdit]           = useState(false);
  const [facilitySearch, setFacSearch]    = useState("");
  const [showFacSearch, setShowFacSearch] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const linkedFacIds = new Set(territory.facilities.map((f) => f.facility.id));
  const availableFacilities = allFacilities.filter(
    (f) => !linkedFacIds.has(f.id) &&
      (!facilitySearch || f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
       f.location?.toLowerCase().includes(facilitySearch.toLowerCase()))
  );

  const addFac = async (facilityId: string) => {
    try {
      const res = await addTerritoryFacilityApi(territory.id, { facility_id: facilityId });
      onUpdated({ ...territory, facilities: [...territory.facilities, res.data.data] });
      setFacSearch("");
      setShowFacSearch(false);
    } catch { /* ignore */ }
  };

  const removeFac = async (facilityId: string) => {
    try {
      await removeTerritoryFacilityApi(territory.id, facilityId);
      onUpdated({ ...territory, facilities: territory.facilities.filter((f) => f.facility.id !== facilityId) });
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete territory "${territory.name}"? Reps will be unassigned.`)) return;
    setDeleting(true);
    try {
      await deleteTerritoryApi(territory.id);
      onDeleted(territory.id);
    } finally {
      setDeleting(false);
    }
  };

  const TABS: { key: CardTab; label: string; count?: number }[] = [
    { key: "reps",       label: "Reps",       count: territory.reps.length },
    { key: "facilities", label: "Facilities", count: territory.facilities.length },
    { key: "details",    label: "Details" },
  ];

  return (
    <>
      {showEdit && (
        <TerritoryForm initial={territory} onSave={(t) => { onUpdated(t); setShowEdit(false); }} onClose={() => setShowEdit(false)} />
      )}

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="w-10 h-10 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
            <FiMapPin className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-[#222f36]">{territory.name}</p>
              {territory.region && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{territory.region}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {territory.facilities.length} facilities · {territory.reps.length} rep{territory.reps.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <FiEdit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={deleting}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors">
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
            {expanded ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* Tab nav */}
            <div className="flex items-center gap-0 border-b border-gray-100 px-5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] -mb-px ${
                    activeTab === tab.key
                      ? "border-[#16a34a] text-[#16a34a]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-5 py-4">

              {/* ── Reps tab ──────────────────────────────────────────── */}
              {activeTab === "reps" && (
                <div>
                  {territory.reps.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {territory.reps.map((r) => (
                        <div key={r.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
                          <span className="text-xs font-semibold text-gray-700">{r.firstname} {r.lastname}</span>
                          <span className="text-[10px] text-gray-400">{r.role}</span>
                          <button
                            onClick={() =>
                              unassignTerritoryRepApi(territory.id, r.id).then(() =>
                                onUpdated({ ...territory, reps: territory.reps.filter((x) => x.id !== r.id) })
                              )
                            }
                            className="text-gray-400 hover:text-red-500 ml-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 rounded"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-gray-300">
                      <FiUsers className="w-7 h-7 mb-2 opacity-50" />
                      <p className="text-xs text-gray-400 font-semibold">No reps assigned</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">Assign reps from the Teams page</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Facilities tab ────────────────────────────────────── */}
              {activeTab === "facilities" && (
                <div className="space-y-3">
                  {territory.facilities.length > 0 && (
                    <div className="space-y-2">
                      {territory.facilities.map(({ facility: f }) => (
                        <div key={f.id} className="flex items-start gap-2.5 group">
                          <div className="w-7 h-7 rounded-lg bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
                            <FaHospital className="w-3.5 h-3.5 text-[#16a34a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#222f36] truncate">{f.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {[f.location, f.town].filter(Boolean).join(" · ")}
                            </p>
                            {f.working_doctors && f.working_doctors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {f.working_doctors.slice(0, 4).map(({ doctor: d }) => (
                                  <span key={d.id} className="flex items-center gap-0.5 text-[9px] font-medium text-[#16a34a] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">
                                    <FaUserDoctor className="w-2.5 h-2.5" />
                                    {d.doctor_name}
                                  </span>
                                ))}
                                {f.working_doctors.length > 4 && (
                                  <span className="text-[9px] text-gray-400">+{f.working_doctors.length - 4} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFac(f.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add facility search */}
                  {showFacSearch ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <FiSearch className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Search facilities…" value={facilitySearch}
                          onChange={(e) => setFacSearch(e.target.value)}
                          className="flex-1 text-sm outline-none text-gray-700" />
                        <button onClick={() => setShowFacSearch(false)} className="text-gray-400 hover:text-gray-600">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {availableFacilities.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">No facilities found</p>
                        )}
                        {availableFacilities.map((f) => (
                          <button key={f.id} onClick={() => addFac(f.id)}
                            className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors">
                            <FaHospital className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#222f36] truncate">{f.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{[f.location, f.town].filter(Boolean).join(" · ")}</p>
                            </div>
                            <FiPlus className="w-3.5 h-3.5 text-[#16a34a] ml-auto shrink-0 mt-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowFacSearch(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      Add facility
                    </button>
                  )}
                </div>
              )}

              {/* ── Details tab ───────────────────────────────────────── */}
              {activeTab === "details" && (
                <div>
                  {territory.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed">{territory.description}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No description added. Edit this territory to add one.</p>
                  )}
                  {territory.region && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Region</span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{territory.region}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TerritoryManagement = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [facilities, setFacilities]   = useState<Facility[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    Promise.all([getTerritoriesApi(), getFacilitiesApi()])
      .then(([tRes, fRes]) => {
        setTerritories(tRes.data.data ?? []);
        setFacilities(fRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = useCallback((t: Territory) => {
    setTerritories((prev) => [...prev, t]);
    setShowCreate(false);
  }, []);

  const handleUpdated = useCallback((t: Territory) => {
    setTerritories((prev) => prev.map((x) => x.id === t.id ? t : x));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setTerritories((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const filtered = territories.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.region?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showCreate && <TerritoryForm onSave={handleCreated} onClose={() => setShowCreate(false)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#222f36]">Territories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Define geographic zones, assign facilities and reps
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            <FiPlus className="w-4 h-4" />
            New Territory
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
            <p className="text-2xl font-black text-[#16a34a]">{territories.length}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Territories</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
            <p className="text-2xl font-black text-[#16a34a]">
              {territories.reduce((s, t) => s + t.facilities.length, 0)}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Facilities Mapped</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
            <p className="text-2xl font-black text-amber-500">
              {territories.filter((t) => t.reps.length === 0).length}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Unassigned</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search territories…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] transition-colors bg-white"
          />
        </div>

        {/* Unassigned warning */}
        {territories.some((t) => t.reps.length === 0) && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <MdOutlineWarningAmber className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Some territories have no assigned reps. Go to each territory and assign a medical rep.
            </p>
          </div>
        )}

        {/* Territory list */}
        <div className="space-y-3">
          {filtered.map((t) => (
            <TerritoryCard
              key={t.id}
              territory={t}
              allFacilities={facilities}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-300">
              <FiMapPin className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-semibold text-gray-400">No territories yet</p>
              <p className="text-xs text-gray-300 mt-1">Create your first territory to start mapping your field force coverage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerritoryManagement;
