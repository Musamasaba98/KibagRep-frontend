import { useEffect, useState, useCallback, useRef } from "react";
import {
  FiPlus, FiTrash2, FiEdit3, FiUsers, FiMapPin, FiX, FiChevronDown, FiChevronUp, FiSearch,
} from "react-icons/fi";
import { FaHospital, FaCapsules, FaUserDoctor } from "react-icons/fa6";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  getTerritoriesApi, createTerritoryApi, updateTerritoryApi, deleteTerritoryApi,
  addTerritoryFacilityApi, removeTerritoryFacilityApi,
  addTerritoryPharmacyApi, removeTerritoryPharmacyApi,
  assignTerritoryRepApi, unassignTerritoryRepApi,
  assignTerritoryTeamApi, unassignTerritoryTeamApi,
  getCompanyUsersApi,
  getCompanyFacilitiesApi,
  getCompanyPharmaciesApi,
  getCompanyTeamsApi,
} from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rep { id: string; firstname: string; lastname: string; role: string; }
interface TeamItem { id: string; team_name: string; supervisor_id?: string | null; }

interface FacilityItem {
  id: string; name: string; location?: string; town?: string;
  working_doctors?: { doctor: { id: string; doctor_name: string; cadre?: string } }[];
}

interface PharmacyItem {
  id: string; pharmacy_name: string; location?: string; town?: string;
  district?: string; pharmacy_type?: string;
}

interface Territory {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  territory_type: string;
  facilities:  { facility: FacilityItem }[];
  pharmacies:  { pharmacy: PharmacyItem }[];
  reps:        Rep[];
  teams:       TeamItem[];
}

interface CompanyUser { id: string; firstname: string; lastname: string; role: string; }

type CardTab = "reps" | "teams" | "facilities" | "pharmacies" | "details";

const TYPE_LABELS: Record<string, string> = {
  TOWN: "Town / Urban", UPCOUNTRY: "Upcountry", REGIONAL: "Regional",
};
const TYPE_COLOURS: Record<string, string> = {
  TOWN:      "bg-blue-50 text-blue-700 border-blue-200",
  UPCOUNTRY: "bg-green-50 text-green-700 border-green-200",
  REGIONAL:  "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── Create / Edit modal ──────────────────────────────────────────────────────

const TerritoryForm = ({
  initial, onSave, onClose,
}: { initial?: Territory; onSave: (t: Territory) => void; onClose: () => void }) => {
  const [name, setName]         = useState(initial?.name ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [region, setRegion]     = useState(initial?.region ?? "");
  const [type, setType]         = useState(initial?.territory_type ?? "TOWN");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const fn = initial
        ? updateTerritoryApi(initial.id, { name, description, region, territory_type: type })
        : createTerritoryApi({ name, region, territory_type: type });
      const res = await fn;
      onSave(res.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="font-black text-[#1a1a1a] text-base">{initial ? "Edit Territory" : "New Territory / Route"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gayaza Road, Masaka, Mulago"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] bg-white">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Region</label>
            <input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Central, Eastern, Western"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Key landmarks, road names, or coverage notes…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#16a34a] resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Territory card ───────────────────────────────────────────────────────────

const TerritoryCard = ({
  territory, allUsers, onUpdated, onDeleted,
}: {
  territory: Territory;
  allUsers: CompanyUser[];
  onUpdated: (t: Territory) => void;
  onDeleted: (id: string) => void;
}) => {
  const [expanded, setExpanded]           = useState(false);
  const [activeTab, setActiveTab]         = useState<CardTab>("reps");
  const [showEdit, setShowEdit]           = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // facility search
  const [facSearch, setFacSearch]         = useState("");
  const [facResults, setFacResults]       = useState<FacilityItem[]>([]);
  const [facSearching, setFacSearching]   = useState(false);
  const [showFacSearch, setShowFacSearch] = useState(false);
  const facDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // pharmacy search
  const [phrSearch, setPhrSearch]         = useState("");
  const [phrResults, setPhrResults]       = useState<PharmacyItem[]>([]);
  const [phrSearching, setPhrSearching]   = useState(false);
  const [showPhrSearch, setShowPhrSearch] = useState(false);
  const phrDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // rep search
  const [repSearch, setRepSearch]         = useState("");
  const [showRepSearch, setShowRepSearch] = useState(false);

  // team assignment
  const [allTeams, setAllTeams]           = useState<TeamItem[]>([]);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const linkedFacIds   = new Set(territory.facilities.map(f => f.facility.id));
  const linkedPhrIds   = new Set(territory.pharmacies.map(p => p.pharmacy.id));
  const assignedRepIds = new Set(territory.reps.map(r => r.id));
  const assignedTeamIds = new Set((territory.teams ?? []).map(t => t.id));

  // Facility search — scoped to company's curated list only
  const searchFacilities = (q: string) => {
    clearTimeout(facDebounce.current);
    setFacSearch(q);
    if (q.length < 2) { setFacResults([]); return; }
    setFacSearching(true);
    facDebounce.current = setTimeout(() => {
      getCompanyFacilitiesApi({ q, limit: 30 })
        .then(r => {
          const facilities = (r.data.data ?? [])
            .map((row: any) => row.facility as FacilityItem)
            .filter((f: FacilityItem) => !linkedFacIds.has(f.id));
          setFacResults(facilities);
        })
        .catch(() => {})
        .finally(() => setFacSearching(false));
    }, 300);
  };

  // Pharmacy search — scoped to company's curated list only
  const searchPharmacies = (q: string) => {
    clearTimeout(phrDebounce.current);
    setPhrSearch(q);
    if (q.length < 2) { setPhrResults([]); return; }
    setPhrSearching(true);
    phrDebounce.current = setTimeout(() => {
      getCompanyPharmaciesApi({ q, limit: 30 })
        .then(r => {
          const pharmacies = (r.data.data ?? [])
            .map((row: any) => row.pharmacy as PharmacyItem)
            .filter((p: PharmacyItem) => !linkedPhrIds.has(p.id));
          setPhrResults(pharmacies);
        })
        .catch(() => {})
        .finally(() => setPhrSearching(false));
    }, 300);
  };

  const availableReps = allUsers.filter(u =>
    ["MedicalRep", "Supervisor"].includes(u.role) &&
    !assignedRepIds.has(u.id) &&
    (!repSearch || `${u.firstname} ${u.lastname}`.toLowerCase().includes(repSearch.toLowerCase()))
  );

  const addFac = async (facilityId: string) => {
    const res = await addTerritoryFacilityApi(territory.id, { facility_id: facilityId }).catch(() => null);
    if (!res) return;
    onUpdated({ ...territory, facilities: [...territory.facilities, res.data.data] });
    setFacSearch(""); setFacResults([]); setShowFacSearch(false);
  };

  const removeFac = async (facilityId: string) => {
    await removeTerritoryFacilityApi(territory.id, facilityId).catch(() => {});
    onUpdated({ ...territory, facilities: territory.facilities.filter(f => f.facility.id !== facilityId) });
  };

  const addPhr = async (pharmacyId: string) => {
    const res = await addTerritoryPharmacyApi(territory.id, { pharmacy_id: pharmacyId }).catch(() => null);
    if (!res) return;
    onUpdated({ ...territory, pharmacies: [...territory.pharmacies, res.data.data] });
    setPhrSearch(""); setPhrResults([]); setShowPhrSearch(false);
  };

  const removePhr = async (pharmacyId: string) => {
    await removeTerritoryPharmacyApi(territory.id, pharmacyId).catch(() => {});
    onUpdated({ ...territory, pharmacies: territory.pharmacies.filter(p => p.pharmacy.id !== pharmacyId) });
  };

  const addRep = async (userId: string) => {
    const res = await assignTerritoryRepApi(territory.id, { user_id: userId }).catch(() => null);
    if (!res) return;
    onUpdated({ ...territory, reps: [...territory.reps, res.data.data] });
    setRepSearch("");
  };

  const removeRep = async (userId: string) => {
    await unassignTerritoryRepApi(territory.id, userId).catch(() => {});
    onUpdated({ ...territory, reps: territory.reps.filter(r => r.id !== userId) });
  };

  const openTeamPicker = () => {
    getCompanyTeamsApi().then((r: any) => setAllTeams(r.data?.data ?? [])).catch(() => {});
    setShowTeamPicker(true);
  };

  const addTeam = async (teamId: string) => {
    const res = await assignTerritoryTeamApi(territory.id, { team_id: teamId }).catch(() => null);
    if (!res) return;
    onUpdated({ ...territory, teams: [...(territory.teams ?? []), res.data.data] });
  };

  const removeTeam = async (teamId: string) => {
    await unassignTerritoryTeamApi(territory.id, teamId).catch(() => {});
    onUpdated({ ...territory, teams: (territory.teams ?? []).filter(t => t.id !== teamId) });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete territory "${territory.name}"? All rep assignments and facility/pharmacy links will be removed.`)) return;
    setDeleting(true);
    await deleteTerritoryApi(territory.id).catch(() => {}).finally(() => setDeleting(false));
    onDeleted(territory.id);
  };

  const TABS: { key: CardTab; label: string; count?: number }[] = [
    { key: "reps",      label: "Reps",      count: territory.reps.length },
    { key: "teams",     label: "Teams",     count: (territory.teams ?? []).length },
    { key: "facilities",label: "Facilities",count: territory.facilities.length },
    { key: "pharmacies",label: "Pharmacies",count: territory.pharmacies.length },
    { key: "details",   label: "Details" },
  ];

  return (
    <>
      {showEdit && (
        <TerritoryForm initial={territory} onSave={t => { onUpdated(t); setShowEdit(false); }} onClose={() => setShowEdit(false)} />
      )}

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/60"
          onClick={() => setExpanded(v => !v)}>
          <div className="w-10 h-10 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
            <FiMapPin className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-[#222f36]">{territory.name}</p>
              {territory.territory_type && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLOURS[territory.territory_type] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                  {TYPE_LABELS[territory.territory_type] ?? territory.territory_type}
                </span>
              )}
              {territory.region && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{territory.region}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {territory.facilities.length} facilities · {territory.pharmacies.length} pharmacies · {territory.reps.length} rep{territory.reps.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={e => { e.stopPropagation(); setShowEdit(true); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <FiEdit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={e => { e.stopPropagation(); handleDelete(); }} disabled={deleting}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
            {expanded ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100">
            {/* Tabs */}
            <div className="flex items-center border-b border-gray-100 px-5">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px focus-visible:outline-none ${
                    activeTab === tab.key ? "border-[#16a34a] text-[#16a34a]" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-[#dcfce7] text-[#15803d]" : "bg-gray-100 text-gray-400"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-5 py-4">

              {/* ── Reps tab ── */}
              {activeTab === "reps" && (
                <div className="space-y-3">
                  {territory.reps.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {territory.reps.map(r => (
                        <div key={r.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#16a34a]/20 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-black text-[#16a34a]">{r.firstname[0]}{r.lastname[0]}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{r.firstname} {r.lastname}</span>
                          <span className="text-[9px] text-gray-400 capitalize">{r.role === "MedicalRep" ? "Rep" : r.role}</span>
                          <button onClick={() => removeRep(r.id)}
                            className="text-gray-400 hover:text-red-500 ml-0.5 focus-visible:outline-none rounded">
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add rep */}
                  {showRepSearch ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <FiSearch className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Search reps…" value={repSearch}
                          onChange={e => setRepSearch(e.target.value)}
                          className="flex-1 text-sm outline-none text-gray-700" />
                        <button onClick={() => { setShowRepSearch(false); setRepSearch(""); }} className="text-gray-400 hover:text-gray-600">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {availableReps.length === 0
                          ? <p className="text-xs text-gray-400 text-center py-4">No reps found</p>
                          : availableReps.map(u => (
                            <button key={u.id} onClick={() => addRep(u.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left">
                              <div className="w-6 h-6 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-[#16a34a]">{u.firstname[0]}{u.lastname[0]}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#222f36] truncate">{u.firstname} {u.lastname}</p>
                                <p className="text-[10px] text-gray-400">{u.role === "MedicalRep" ? "Medical Rep" : u.role}</p>
                              </div>
                              <FiPlus className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowRepSearch(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline-none rounded">
                      <FiPlus className="w-3.5 h-3.5" /> Assign rep
                    </button>
                  )}

                  {territory.reps.length === 0 && !showRepSearch && (
                    <div className="flex flex-col items-center py-6 text-gray-300">
                      <FiUsers className="w-7 h-7 mb-1.5 opacity-50" />
                      <p className="text-xs text-gray-400 font-semibold">No reps on this route yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Teams tab ── */}
              {activeTab === "teams" && (
                <div className="space-y-3">
                  {(territory.teams ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(territory.teams ?? []).map(t => (
                        <div key={t.id} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full pl-3 pr-2 py-1.5">
                          <FiUsers className="w-3 h-3 text-violet-500 shrink-0" />
                          <span className="text-xs font-semibold text-violet-700">{t.team_name}</span>
                          <button onClick={() => removeTeam(t.id)}
                            className="text-violet-300 hover:text-red-500 ml-0.5 focus-visible:outline-none rounded">
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showTeamPicker ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-600">Assign a team</span>
                        <button onClick={() => setShowTeamPicker(false)} className="text-gray-400 hover:text-gray-600">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {allTeams.filter(t => !assignedTeamIds.has(t.id)).length === 0
                          ? <p className="text-xs text-gray-400 text-center py-4">No unassigned teams</p>
                          : allTeams.filter(t => !assignedTeamIds.has(t.id)).map(t => (
                            <button key={t.id} onClick={() => { addTeam(t.id); setShowTeamPicker(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-violet-50 text-left">
                              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <FiUsers className="w-3 h-3 text-violet-600" />
                              </div>
                              <span className="text-xs font-semibold text-[#222f36] flex-1 truncate">{t.team_name}</span>
                              <FiPlus className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <button onClick={openTeamPicker}
                      className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 focus-visible:outline-none rounded">
                      <FiPlus className="w-3.5 h-3.5" /> Assign team
                    </button>
                  )}

                  {(territory.teams ?? []).length === 0 && !showTeamPicker && (
                    <div className="flex flex-col items-center py-6 text-gray-300">
                      <FiUsers className="w-7 h-7 mb-1.5 opacity-50" />
                      <p className="text-xs text-gray-400 font-semibold">No teams on this route yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Facilities tab ── */}
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
                            <p className="text-[10px] text-gray-400 truncate">{[f.location, f.town].filter(Boolean).join(" · ")}</p>
                            {f.working_doctors && f.working_doctors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {f.working_doctors.slice(0, 3).map(({ doctor: d }) => (
                                  <span key={d.id} className="flex items-center gap-0.5 text-[9px] font-medium text-[#16a34a] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">
                                    <FaUserDoctor className="w-2.5 h-2.5" />{d.doctor_name}
                                  </span>
                                ))}
                                {f.working_doctors.length > 3 && <span className="text-[9px] text-gray-400">+{f.working_doctors.length - 3} more</span>}
                              </div>
                            )}
                          </div>
                          <button onClick={() => removeFac(f.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0">
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showFacSearch ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <FiSearch className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Search facilities…" value={facSearch}
                          onChange={e => searchFacilities(e.target.value)}
                          className="flex-1 text-sm outline-none text-gray-700" />
                        <button onClick={() => { setShowFacSearch(false); setFacSearch(""); setFacResults([]); }} className="text-gray-400 hover:text-gray-600">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {facSearching
                          ? <p className="text-xs text-gray-400 text-center py-4">Searching…</p>
                          : facSearch.length < 2
                          ? <p className="text-xs text-gray-300 text-center py-4">Type to search facilities</p>
                          : facResults.length === 0
                          ? <p className="text-xs text-gray-400 text-center py-4">No facilities found</p>
                          : facResults.map(f => (
                            <button key={f.id} onClick={() => addFac(f.id)}
                              className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 text-left">
                              <FaHospital className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#222f36] truncate">{f.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{[f.location, f.town].filter(Boolean).join(" · ")}</p>
                              </div>
                              <FiPlus className="w-3.5 h-3.5 text-[#16a34a] ml-auto shrink-0 mt-0.5" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowFacSearch(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline-none rounded">
                      <FiPlus className="w-3.5 h-3.5" /> Add facility
                    </button>
                  )}
                </div>
              )}

              {/* ── Pharmacies tab ── */}
              {activeTab === "pharmacies" && (
                <div className="space-y-3">
                  {territory.pharmacies.length > 0 && (
                    <div className="space-y-2">
                      {territory.pharmacies.map(({ pharmacy: p }) => (
                        <div key={p.id} className="flex items-start gap-2.5 group">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
                            <FaCapsules className="w-3.5 h-3.5 text-sky-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#222f36] truncate">{p.pharmacy_name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{[p.location, p.town, p.district].filter(Boolean).join(" · ")}</p>
                            {p.pharmacy_type && (
                              <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                                {p.pharmacy_type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <button onClick={() => removePhr(p.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0">
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showPhrSearch ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <FiSearch className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Search pharmacies…" value={phrSearch}
                          onChange={e => searchPharmacies(e.target.value)}
                          className="flex-1 text-sm outline-none text-gray-700" />
                        <button onClick={() => { setShowPhrSearch(false); setPhrSearch(""); setPhrResults([]); }} className="text-gray-400 hover:text-gray-600">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {phrSearching
                          ? <p className="text-xs text-gray-400 text-center py-4">Searching…</p>
                          : phrSearch.length < 2
                          ? <p className="text-xs text-gray-300 text-center py-4">Type to search pharmacies</p>
                          : phrResults.length === 0
                          ? <p className="text-xs text-gray-400 text-center py-4">No pharmacies found</p>
                          : phrResults.map(p => (
                            <button key={p.id} onClick={() => addPhr(p.id)}
                              className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 text-left">
                              <FaCapsules className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#222f36] truncate">{p.pharmacy_name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{[p.location, p.town, p.district].filter(Boolean).join(" · ")}</p>
                              </div>
                              <FiPlus className="w-3.5 h-3.5 text-[#16a34a] ml-auto shrink-0 mt-0.5" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowPhrSearch(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline-none rounded">
                      <FiPlus className="w-3.5 h-3.5" /> Add pharmacy
                    </button>
                  )}
                </div>
              )}

              {/* ── Details tab ── */}
              {activeTab === "details" && (
                <div className="space-y-3">
                  {territory.description
                    ? <p className="text-sm text-gray-600 leading-relaxed">{territory.description}</p>
                    : <p className="text-xs text-gray-400 italic">No notes added.</p>
                  }
                  {territory.region && (
                    <div className="flex items-center gap-2">
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
  const [allUsers, setAllUsers]       = useState<CompanyUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    Promise.allSettled([getTerritoriesApi(), getCompanyUsersApi()])
      .then(([tRes, uRes]) => {
        if (tRes.status === "fulfilled") setTerritories(tRes.value.data?.data ?? []);
        if (uRes.status === "fulfilled") setAllUsers(uRes.value.data?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreated  = useCallback((t: Territory) => { setTerritories(prev => [...prev, t]); setShowCreate(false); }, []);
  const handleUpdated  = useCallback((t: Territory) => { setTerritories(prev => prev.map(x => x.id === t.id ? t : x)); }, []);
  const handleDeleted  = useCallback((id: string)   => { setTerritories(prev => prev.filter(x => x.id !== id)); }, []);

  const filtered = territories.filter(
    t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.region?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFacilities = territories.reduce((s, t) => s + t.facilities.length, 0);
  const totalPharmacies = territories.reduce((s, t) => s + t.pharmacies.length, 0);
  const unassigned      = territories.filter(t => t.reps.length === 0).length;

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
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
            <h1 className="text-2xl font-black text-[#222f36]">Territory Routes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Define routes, assign reps, and link facilities &amp; pharmacies to each route
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}>
            <FiPlus className="w-4 h-4" /> New Route
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Routes",       value: territories.length,  color: "text-[#16a34a]" },
            { label: "Facilities",   value: totalFacilities,     color: "text-amber-600" },
            { label: "Pharmacies",   value: totalPharmacies,     color: "text-sky-600"   },
            { label: "Unassigned",   value: unassigned,          color: unassigned > 0 ? "text-red-500" : "text-gray-400" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search routes…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] bg-white" />
        </div>

        {unassigned > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <MdOutlineWarningAmber className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              {unassigned} route{unassigned !== 1 ? "s have" : " has"} no assigned reps. Expand a route and use the Reps tab to assign coverage.
            </p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {filtered.map(t => (
            <TerritoryCard key={t.id} territory={t} allUsers={allUsers} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-300">
              <FiMapPin className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-semibold text-gray-400">No routes yet</p>
              <p className="text-xs text-gray-300 mt-1">Create routes like "Gayaza Road", "Masaka", "Mulago" and assign reps and locations to each</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerritoryManagement;
