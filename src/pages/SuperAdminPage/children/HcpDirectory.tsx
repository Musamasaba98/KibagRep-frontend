import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaStethoscope, FaMagnifyingGlass, FaPlus, FaXmark, FaLocationDot, FaHospital, FaBuildingColumns,
} from "react-icons/fa6";
import { LuPencil, LuCheck, LuX, LuStar, LuChevronDown } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import api from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

const CADRES    = ["Doctor", "Nurse", "Midwife", "Clinician", "Pharmacist", "Other"] as const;
const PRESC_LVL = ["CONSULTANT","SPECIALIST","MEDICAL_OFFICER","RESIDENT","CLINICAL_OFFICER","NURSE_PRACTITIONER","PHARMACIST","DISPENSER"] as const;
type Cadre = typeof CADRES[number];

interface FacilityLink {
  doctor_id:   string;
  facility_id: string;
  is_primary:  boolean;
  facility: {
    id: string; name: string; location?: string; town?: string;
    facility_type?: string; latitude?: number | null; longitude?: number | null;
  };
}

interface Doctor {
  id: string;
  doctor_name: string;
  cadre: Cadre;
  speciality: string[];
  location: string;
  town: string;
  contact?: string | null;
  license_number?: string | null;
  prescribing_level?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  work_facilities: FacilityLink[];
}

interface FacilitySearchResult {
  id: string; name: string; location?: string; town?: string;
  latitude?: number | null; longitude?: number | null;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
);

const cadreColor: Record<string, string> = {
  Doctor:     "bg-sky-50 text-sky-700 border-sky-200",
  Nurse:      "bg-violet-50 text-violet-700 border-violet-200",
  Midwife:    "bg-pink-50 text-pink-700 border-pink-200",
  Clinician:  "bg-amber-50 text-amber-700 border-amber-200",
  Pharmacist: "bg-teal-50 text-teal-700 border-teal-200",
  Other:      "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Facility search dropdown ─────────────────────────────────────────────────

const FacilitySearch = ({ onSelect }: { onSelect: (f: FacilitySearchResult) => void }) => {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState<FacilitySearchResult[]>([]);
  const [open, setOpen]     = useState(false);
  const timer               = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(() => {
      api.get(`/facility/search?q=${encodeURIComponent(q)}`)
        .then(r => { setResults(r.data.data ?? []); setOpen(true); })
        .catch(() => {});
    }, 280);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="relative">
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search facility by name…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {results.map(f => (
            <button key={f.id} type="button"
              onClick={() => { onSelect(f); setQ(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-[#f0fdf4] flex items-center gap-3 border-b border-gray-50 last:border-0"
              style={{ transition: "background-color 0.12s" }}>
              <FaBuildingColumns className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a2530] truncate">{f.name}</p>
                <p className="text-xs text-gray-400 truncate">{[f.town, f.location].filter(Boolean).join(" · ")}</p>
              </div>
              {(f.latitude != null && f.longitude != null) && (
                <FaLocationDot className="w-3 h-3 text-[#16a34a] shrink-0 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Edit Panel ───────────────────────────────────────────────────────────────

const EditPanel = ({ doctorId, onClose, onSaved }: {
  doctorId: string;
  onClose: () => void;
  onSaved: (d: Doctor) => void;
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [tab, setTab]       = useState<"details" | "facilities">("details");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  // Details form state
  const [form, setForm] = useState({
    doctor_name: "", cadre: "Doctor" as Cadre, speciality: "",
    location: "", town: "", contact: "", license_number: "", prescribing_level: "",
    gps_lat: "", gps_lng: "",
  });

  // Facility link state
  const [linkSaving, setLinkSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/doctor/${doctorId}`)
      .then(r => {
        const d: Doctor = r.data.data;
        setDoctor(d);
        setForm({
          doctor_name:       d.doctor_name,
          cadre:             d.cadre,
          speciality:        (d.speciality ?? []).join(", "),
          location:          d.location ?? "",
          town:              d.town ?? "",
          contact:           d.contact ?? "",
          license_number:    d.license_number ?? "",
          prescribing_level: d.prescribing_level ?? "",
          gps_lat:           d.gps_lat != null ? String(d.gps_lat) : "",
          gps_lng:           d.gps_lng != null ? String(d.gps_lng) : "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveDetails = async () => {
    setSaving(true); setSaveError("");
    try {
      const payload: Record<string, unknown> = {
        doctor_name:       form.doctor_name.trim(),
        cadre:             form.cadre,
        speciality:        form.speciality.split(",").map(s => s.trim()).filter(Boolean),
        location:          form.location.trim(),
        town:              form.town.trim(),
        contact:           form.contact.trim() || null,
        license_number:    form.license_number.trim() || null,
        prescribing_level: form.prescribing_level || null,
        gps_lat:           form.gps_lat ? parseFloat(form.gps_lat) : null,
        gps_lng:           form.gps_lng ? parseFloat(form.gps_lng) : null,
      };
      const res = await api.put(`/doctor/${doctorId}`, payload);
      const updated: Doctor = { ...res.data.data, work_facilities: doctor?.work_facilities ?? [] };
      setDoctor(updated);
      onSaved(updated);
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleAddFacility = async (facility: FacilitySearchResult) => {
    if (!doctor) return;
    const alreadyLinked = doctor.work_facilities.some(f => f.facility_id === facility.id);
    if (alreadyLinked) return;
    setLinkSaving(facility.id);
    try {
      const isPrimary = doctor.work_facilities.length === 0;
      const res = await api.post(`/doctor/${doctorId}/facilities`, {
        facility_id: facility.id,
        is_primary: isPrimary,
      });
      setDoctor(prev => prev ? {
        ...prev,
        work_facilities: [...prev.work_facilities, res.data.data],
      } : prev);
    } catch {
    } finally { setLinkSaving(null); }
  };

  const handleSetPrimary = async (facilityId: string) => {
    if (!doctor) return;
    setLinkSaving(facilityId);
    try {
      await api.put(`/doctor/${doctorId}/facilities/${facilityId}`, { is_primary: true });
      setDoctor(prev => prev ? {
        ...prev,
        work_facilities: prev.work_facilities.map(f => ({
          ...f,
          is_primary: f.facility_id === facilityId,
        })),
      } : prev);
    } catch {
    } finally { setLinkSaving(null); }
  };

  const handleRemoveFacility = async (facilityId: string) => {
    if (!doctor) return;
    setLinkSaving(facilityId);
    try {
      await api.delete(`/doctor/${doctorId}/facilities/${facilityId}`);
      setDoctor(prev => prev ? {
        ...prev,
        work_facilities: prev.work_facilities.filter(f => f.facility_id !== facilityId),
      } : prev);
    } catch {
    } finally { setLinkSaving(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-black text-[#1a2530] text-base leading-tight truncate">
                {loading ? "Loading…" : (doctor?.doctor_name ?? "Unknown")}
              </h2>
              {!loading && doctor && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge label={doctor.cadre} color={cadreColor[doctor.cadre] ?? cadreColor.Other} />
                  {doctor.prescribing_level && (
                    <Badge label={doctor.prescribing_level.replace(/_/g, " ")} color="bg-gray-100 text-gray-600 border-gray-200" />
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 focus-visible:outline-none shrink-0">
              <FaXmark className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-xl">
            {(["details", "facilities"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold focus-visible:outline-none capitalize ${
                  tab === t ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ transition: "background-color 0.15s" }}>
                {t === "facilities"
                  ? `Facilities (${doctor?.work_facilities.length ?? 0})`
                  : "Details"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          ) : tab === "details" ? (

            /* ── Details form ── */
            <div className="px-5 py-5 flex flex-col gap-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">{saveError}</div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                <input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>

              {/* Cadre */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cadre</label>
                <div className="relative">
                  <select value={form.cadre} onChange={e => setForm(f => ({ ...f, cadre: e.target.value as Cadre }))}
                    className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white pr-9">
                    {CADRES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <LuChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Speciality */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Speciality <span className="font-normal text-gray-400">(comma-separated)</span>
                </label>
                <input value={form.speciality} onChange={e => setForm(f => ({ ...f, speciality: e.target.value }))}
                  placeholder="e.g. Cardiology, Internal Medicine"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>

              {/* Location + Town */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location / Address</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Town</label>
                  <input value={form.town} onChange={e => setForm(f => ({ ...f, town: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              </div>

              {/* Contact + License */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Contact</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="+256 700 000 000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">License No.</label>
                  <input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              </div>

              {/* Prescribing level */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Prescribing Level</label>
                <div className="relative">
                  <select value={form.prescribing_level} onChange={e => setForm(f => ({ ...f, prescribing_level: e.target.value }))}
                    className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white pr-9">
                    <option value="">— not set —</option>
                    {PRESC_LVL.map(l => <option key={l} value={l}>{l.replace(/_/g, " ")}</option>)}
                  </select>
                  <LuChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* GPS (doctor's own coordinates) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Doctor GPS <span className="font-normal text-gray-400">(optional — facility GPS takes priority for anomaly detection)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.gps_lat} onChange={e => setForm(f => ({ ...f, gps_lat: e.target.value }))}
                    type="number" step="any" placeholder="Latitude"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 font-mono" />
                  <input value={form.gps_lng} onChange={e => setForm(f => ({ ...f, gps_lng: e.target.value }))}
                    type="number" step="any" placeholder="Longitude"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 font-mono" />
                </div>
              </div>
            </div>

          ) : (

            /* ── Facilities tab ── */
            <div className="px-5 py-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Link a facility</p>
                <FacilitySearch onSelect={handleAddFacility} />
              </div>

              {doctor && doctor.work_facilities.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <FaHospital className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-semibold">No facilities linked</p>
                  <p className="text-xs mt-1">Search above to assign this doctor to a facility</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Linked facilities</p>
                  {doctor?.work_facilities.map(fl => {
                    const isActioning = linkSaving === fl.facility_id;
                    return (
                      <div key={fl.facility_id}
                        className={`flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 ${isActioning ? "opacity-50" : ""}`}>
                        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <FaBuildingColumns className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#1a2530] truncate">{fl.facility.name}</p>
                            {fl.is_primary && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                                <LuStar className="w-2.5 h-2.5" /> Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {[fl.facility.town, fl.facility.location].filter(Boolean).join(" · ")}
                          </p>
                          {fl.facility.latitude != null ? (
                            <p className="text-[10px] text-[#16a34a] font-mono mt-0.5">
                              <FaLocationDot className="inline w-2.5 h-2.5 mr-0.5" />
                              {fl.facility.latitude.toFixed(4)}, {fl.facility.longitude?.toFixed(4)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                              <MdOutlineGpsOff className="w-3 h-3" /> No GPS on this facility
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!fl.is_primary && (
                            <button type="button" onClick={() => handleSetPrimary(fl.facility_id)}
                              disabled={isActioning}
                              title="Set as primary facility"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#dcfce7] text-[#16a34a] hover:bg-[#f0fdf4] disabled:opacity-40"
                              style={{ transition: "background-color 0.12s" }}>
                              <LuStar className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => handleRemoveFacility(fl.facility_id)}
                            disabled={isActioning}
                            title="Unlink facility"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40"
                            style={{ transition: "background-color 0.12s" }}>
                            <LuX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions (details tab only) */}
        {!loading && tab === "details" && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <button onClick={handleSaveDetails} disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-50"
              style={{ transition: "background-color 0.15s" }}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><LuCheck className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Add Doctor Modal ─────────────────────────────────────────────────────────

const AddDoctorModal = ({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) => {
  const [form, setForm] = useState({
    doctor_name: "", cadre: "Doctor" as Cadre, speciality: "",
    location: "", town: "", contact: "",
  });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setError("");
    if (!form.doctor_name.trim() || !form.location.trim()) {
      setError("Name and location are required"); return;
    }
    setSaving(true);
    try {
      await api.post("/doctor", {
        doctor_name: form.doctor_name.trim(),
        cadre:       form.cadre,
        speciality:  form.speciality.split(",").map(s => s.trim()).filter(Boolean),
        location:    form.location.trim(),
        town:        form.town.trim(),
        contact:     form.contact.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to create");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Add HCP</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
            <input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
              placeholder="e.g. Dr. Sarah Nambi"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cadre</label>
            <div className="relative">
              <select value={form.cadre} onChange={e => setForm(f => ({ ...f, cadre: e.target.value as Cadre }))}
                className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white pr-9">
                {CADRES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <LuChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Speciality <span className="font-normal text-gray-400">(comma-separated)</span></label>
            <input value={form.speciality} onChange={e => setForm(f => ({ ...f, speciality: e.target.value }))}
              placeholder="e.g. Internal Medicine, Paediatrics"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location *</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Mulago Hill"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Town</label>
              <input value={form.town} onChange={e => setForm(f => ({ ...f, town: e.target.value }))}
                placeholder="e.g. Kampala"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Contact</label>
            <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              placeholder="+256 700 000 000"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60"
              style={{ transition: "background-color 0.15s" }}>
              {saving ? "Saving…" : "Add HCP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main HCP Directory Page ──────────────────────────────────────────────────

const HcpDirectory = () => {
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback((p = 1, query = q) => {
    setLoading(true);
    const params = new URLSearchParams({ scope: "all", page: String(p), limit: "30" });
    if (query.trim().length >= 1) params.set("q", query.trim());
    api.get(`/doctor?${params}`)
      .then(r => {
        setDoctors(r.data.data ?? []);
        setTotal(r.data.meta?.total ?? 0);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => { load(1, ""); }, []);

  const handleSearchChange = (val: string) => {
    setQ(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val), 300);
  };

  const handleDoctorSaved = (updated: Doctor) => {
    setDoctors(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
  };

  const withFacility    = doctors.filter(d => d.work_facilities?.length > 0).length;
  const withoutFacility = doctors.length - withFacility;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">HCP Directory</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-gray-400">{total} clinicians in master database</p>
            {doctors.length > 0 && (
              <>
                <span className="text-xs font-semibold text-[#16a34a]">
                  {withFacility} with facility
                </span>
                {withoutFacility > 0 && (
                  <span className="text-xs font-semibold text-amber-600">
                    {withoutFacility} unlinked
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Add HCP</span>
        </button>
      </div>

      {/* Unlinked warning */}
      {withoutFacility > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FaHospital className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">{withoutFacility} HCP{withoutFacility !== 1 ? "s" : ""} not linked to any facility.</span>
            {" "}GPS anomaly detection requires a primary facility with GPS coordinates.
            Click a row to assign facilities.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input type="text" value={q} onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name, town, or location…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
      </div>

      {/* Doctor list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaStethoscope className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{q ? "No matching HCPs" : "No HCPs in database"}</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid px-4 sm:px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "2rem 1fr 6rem 8rem" }}>
              <span /><span>Clinician</span><span>Cadre</span><span>Primary Facility</span>
            </div>
            <div className="divide-y divide-gray-50">
              {doctors.map(d => {
                const primary = d.work_facilities?.find(f => f.is_primary) ?? d.work_facilities?.[0];
                const facilityHasGps = primary?.facility.latitude != null;
                return (
                  <div key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className="grid sm:grid-cols-[2rem_1fr_6rem_8rem] items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-[#f0fdf4]/40 cursor-pointer"
                    style={{ transition: "background-color 0.12s" }}>

                    <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                      <FaStethoscope className="w-3.5 h-3.5 text-sky-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a2530] truncate">{d.doctor_name}</p>
                        <LuPencil className="w-3 h-3 text-gray-300 shrink-0" />
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {[...d.speciality ?? [], d.town].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <Badge label={d.cadre} color={cadreColor[d.cadre] ?? cadreColor.Other} />
                    </div>

                    <div className="hidden sm:block min-w-0">
                      {primary ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {facilityHasGps
                            ? <FaLocationDot className="w-3 h-3 text-[#16a34a] shrink-0" />
                            : <MdOutlineGpsOff className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="text-xs text-gray-600 truncate">{primary.facility.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold">Not linked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 30 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                <span>Page {page} of {Math.ceil(total / 30)}</span>
                <div className="flex gap-2">
                  <button onClick={() => load(page - 1)} disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    style={{ transition: "background-color 0.12s" }}>Prev</button>
                  <button onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / 30)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    style={{ transition: "background-color 0.12s" }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit panel */}
      {selectedId && (
        <EditPanel
          doctorId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={handleDoctorSaved}
        />
      )}

      {/* Add doctor modal */}
      {showAdd && (
        <AddDoctorModal
          onClose={() => setShowAdd(false)}
          onAdded={() => load(1, q)}
        />
      )}
    </div>
  );
};

export default HcpDirectory;
