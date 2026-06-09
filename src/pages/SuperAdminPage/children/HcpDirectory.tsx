import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaStethoscope, FaMagnifyingGlass, FaPlus, FaXmark, FaLocationDot, FaHospital, FaBuildingColumns,
  FaFileExcel, FaDownload, FaUpload,
} from "react-icons/fa6";
import { LuPencil, LuCheck, LuX, LuStar, LuChevronDown, LuTrash2 } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import { FiCheckSquare, FiSquare, FiEdit3, FiList, FiGrid } from "react-icons/fi";
import api from "../../../services/api";
import {
  bulkEditDoctorsApi, bulkUploadDoctorsApi, downloadDoctorTemplateApi, deleteDoctorApi,
} from "../../../services/api";

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

interface RowEdit {
  doctor_name: string;
  cadre: string;
  speciality: string;
  location: string;
  town: string;
  contact: string;
  license_number: string;
  prescribing_level: string;
}

const initRowEdit = (d: Doctor): RowEdit => ({
  doctor_name:       d.doctor_name ?? "",
  cadre:             d.cadre ?? "",
  speciality:        (d.speciality ?? []).join(", "),
  location:          d.location ?? "",
  town:              d.town ?? "",
  contact:           d.contact ?? "",
  license_number:    d.license_number ?? "",
  prescribing_level: d.prescribing_level ?? "",
});

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

// ─── Excel Upload Modal ───────────────────────────────────────────────────────
const UploadModal = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
  const [file, setFile]       = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]   = useState<{ created: number; updated: number; errors: {row:string;error:string}[] } | null>(null);
  const [err, setErr]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    const res = await downloadDoctorTemplateApi();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a"); a.href = url; a.download = "doctors_upload_template.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setErr(""); setResult(null);
    try {
      const res = await bulkUploadDoctorsApi(file);
      setResult(res.data);
      onDone();
    } catch (e: any) {
      setErr(e.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#16a34a] px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Upload Doctors (Excel)</h2>
            <p className="text-green-100 text-xs mt-0.5">Creates new or updates existing by license / name match</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><FaXmark className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <button onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 border border-[#16a34a] text-[#16a34a] font-semibold text-sm py-2.5 rounded-xl hover:bg-green-50"
            style={{ transition: "background-color 0.15s" }}>
            <FaDownload className="w-3.5 h-3.5" /> Download Template
          </button>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#16a34a] hover:bg-green-50/30"
            style={{ transition: "border-color 0.15s, background-color 0.15s" }}>
            <FaFileExcel className="w-8 h-8 text-green-600 mx-auto mb-2" />
            {file ? (
              <p className="text-sm font-semibold text-gray-700">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Click to select your filled Excel file</p>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setErr(""); }} />
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm font-bold text-green-800">Upload complete</p>
              <p className="text-xs text-green-700">{result.created} created · {result.updated} updated</p>
              {result.errors.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e.row}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleUpload} disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm"
              style={{ transition: "opacity 0.15s" }}>
              <FaUpload className="w-3.5 h-3.5" />
              {uploading ? "Uploading…" : "Upload & Process"}
            </button>
            <button onClick={onClose} className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteConfirmModal = ({
  targets, onConfirm, onCancel, deleting,
}: {
  targets: { id: string; name: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) => {
  const [agreed, setAgreed] = useState(false);
  const isBulk = targets.length > 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.22)] w-full max-w-md p-6 flex flex-col gap-4">

        {/* Icon + title */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <LuTrash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-black text-[#1a2530] text-base">
              {isBulk ? `Delete ${targets.length} doctors?` : "Delete this doctor?"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isBulk
                ? "These records will be permanently removed from the KibagRep master database."
                : "This record will be permanently removed from the KibagRep master database."}
            </p>
          </div>
        </div>

        {/* Name list */}
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 max-h-40 overflow-y-auto">
          {isBulk ? (
            <ul className="flex flex-col gap-1">
              {targets.map(t => (
                <li key={t.id} className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {t.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-red-700">{targets[0].name}</p>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <span className="text-amber-500 text-base shrink-0">⚠</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">This cannot be undone.</span> Deleted doctors are removed from the master database — any company call cycles or tour plans referencing {isBulk ? "them" : "this doctor"} may be affected.
          </p>
        </div>

        {/* Checkbox gate */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div
            onClick={() => setAgreed(a => !a)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "bg-red-500 border-red-500" : "border-gray-300 hover:border-red-400"}`}
            style={{ transition: "background-color 0.12s, border-color 0.12s" }}>
            {agreed && <LuCheck className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-gray-600">
            I understand this is <span className="font-semibold text-[#1a2530]">permanent and irreversible</span>
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            style={{ transition: "background-color 0.15s" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!agreed || deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold"
            style={{ transition: "background-color 0.15s" }}>
            {deleting ? "Deleting…" : `Delete${isBulk ? ` ${targets.length}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bulk Edit Panel ──────────────────────────────────────────────────────────
const CADRES_LIST = ["Doctor","Nurse","Midwife","Clinician","Pharmacist","Other"] as const;
const TOWNS = ["Kampala","Entebbe","Jinja","Mbarara","Gulu","Mbale","Masaka","Lira","Fort Portal","Arua","Other"];

const BulkEditPanel = ({
  count, onApply, onClear, onDelete,
}: { count: number; onApply: (fields: Record<string, unknown>) => Promise<void>; onClear: () => void; onDelete: () => void }) => {
  const [cadre, setCadre]   = useState("");
  const [town, setTown]     = useState("");
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    const fields: Record<string, unknown> = {};
    if (cadre) fields.cadre = cadre;
    if (town)  fields.town  = town;
    if (!Object.keys(fields).length) return;
    setApplying(true);
    await onApply(fields);
    setApplying(false);
    setCadre(""); setTown("");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[#1a2530] text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 flex-wrap">
      <span className="text-sm font-bold shrink-0">
        <FiCheckSquare className="inline w-4 h-4 text-[#16a34a] mr-1.5" />{count} selected
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <select value={cadre} onChange={e => setCadre(e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg outline-none hover:bg-white/20"
          style={{ transition: "background-color 0.15s" }}>
          <option value="">Set cadre…</option>
          {CADRES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={town} onChange={e => setTown(e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg outline-none hover:bg-white/20"
          style={{ transition: "background-color 0.15s" }}>
          <option value="">Set town…</option>
          {TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={handleApply} disabled={applying || (!cadre && !town)}
          className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
          style={{ transition: "background-color 0.15s" }}>
          <FiEdit3 className="w-3.5 h-3.5" />{applying ? "Applying…" : "Apply"}
        </button>
      </div>
      <div className="w-px h-5 bg-white/20 shrink-0" />
      <button onClick={onDelete}
        className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500 border border-red-400/40 text-red-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
        style={{ transition: "background-color 0.15s, color 0.15s" }}>
        <LuTrash2 className="w-3.5 h-3.5" /> Delete
      </button>
      <button onClick={onClear}
        className="text-gray-400 hover:text-white text-xs underline shrink-0"
        style={{ transition: "color 0.15s" }}>
        Clear
      </button>
    </div>
  );
};

// ─── Government Registry types ────────────────────────────────────────────────

interface HcpRecord {
  id:                  string;
  portal_id:           string;
  name:                string;
  council:             string;
  registration_no:     string;
  registration_status: string | null;
  registration_date:   string | null;
  license_number:      string | null;
  license_expiry:      string | null;
  licence_status:      string | null;
  doctor_id:           string | null;
  doctor?:             { id: string; doctor_name: string; cadre: string } | null;
}

interface DoctorSearchResult {
  id:          string;
  doctor_name: string;
  town?:       string;
  location?:   string;
  speciality?: string[];
  contact?:    string | null;
}

const COUNCIL_SHORT: Record<string, string> = {
  "Uganda Medical & Dental Practitioners Council": "UMDPC",
  "Uganda Nurses & Midwives Council":              "UNMC",
  "Allied Health Professionals Council":           "AHPC",
};

const COUNCIL_COLOR: Record<string, string> = {
  UMDPC: "bg-sky-50 text-sky-700 border-sky-200",
  UNMC:  "bg-violet-50 text-violet-700 border-violet-200",
  AHPC:  "bg-teal-50 text-teal-700 border-teal-200",
};

// ─── Link HCP to master directory modal ──────────────────────────────────────

const LinkModal = ({
  record, onClose, onLinked,
}: {
  record: HcpRecord;
  onClose: () => void;
  onLinked: (doctorId: string, doctor: { id: string; doctor_name: string; cadre: string }) => void;
}) => {
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState<DoctorSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<DoctorSearchResult | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    timer.current = setTimeout(() => {
      api.get(`/doctor/search?q=${encodeURIComponent(q.trim())}`)
        .then(r => setResults(r.data.data ?? []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(timer.current);
  }, [q]);

  const handleLink = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const res = await api.put(`/hcp-records/${record.id}`, { doctor_id: selected.id });
      const linked = res.data.data;
      onLinked(linked.doctor_id, linked.doctor);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.response?.data?.error || "Link failed — doctor may already be claimed.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-black text-[#1a2530] text-base">Link to Master Directory</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{record.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 focus-visible:outline-none shrink-0">
              <FaXmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">{error}</div>
          )}

          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={e => { setQ(e.target.value); setSelected(null); }}
              placeholder="Search master directory by name…"
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
          </div>

          {searching && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
              {results.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected(prev => prev?.id === d.id ? null : d)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left ${
                    selected?.id === d.id
                      ? "border-[#16a34a] bg-[#f0fdf4]"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                  style={{ transition: "border-color 0.12s, background-color 0.12s" }}>
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <FaStethoscope className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2530] truncate">{d.doctor_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[d.town, d.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {selected?.id === d.id && (
                    <LuCheck className="w-4 h-4 text-[#16a34a] shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}

          {!searching && q.trim().length >= 2 && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">No matching doctors found</p>
          )}

          {q.trim().length < 2 && (
            <p className="text-center text-xs text-gray-400 py-4">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            style={{ transition: "background-color 0.15s" }}>
            Cancel
          </button>
          <button onClick={handleLink} disabled={!selected || saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-sm font-bold"
            style={{ transition: "background-color 0.15s" }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Linking…</>
              : <><LuCheck className="w-4 h-4" />Link Record</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Government Registry panel ────────────────────────────────────────────────

const GovernmentRegistry = ({ onTotalLoaded }: { onTotalLoaded?: (n: number) => void }) => {
  const [records, setRecords]     = useState<HcpRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [council, setCouncil]     = useState("");
  const [licStatus, setLicStatus] = useState("");
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [councilCounts, setCouncilCounts] = useState<Record<string, number>>({});
  const [linkTarget, setLinkTarget]   = useState<HcpRecord | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const searchTimer               = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback((p = 1, query = q, c = council, lic = licStatus) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "30" });
    if (query.trim())  params.set("q", query.trim());
    if (c)             params.set("council", c);
    if (lic)           params.set("licence_status", lic);
    api.get(`/hcp-records?${params}`)
      .then(r => { setRecords(r.data.data ?? []); setTotal(r.data.meta?.total ?? 0); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, council, licStatus]);

  useEffect(() => {
    load(1, "", "", "");
    api.get("/hcp-records/stats")
      .then(r => {
        const byCouncil: { council: string; _count: { id: number } }[] = r.data.data?.byCouncil ?? [];
        const counts: Record<string, number> = {};
        let grandTotal = 0;
        for (const row of byCouncil) {
          counts[row.council] = row._count.id;
          grandTotal += row._count.id;
        }
        setCouncilCounts(counts);
        onTotalLoaded?.(grandTotal);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (val: string) => {
    setQ(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val, council, licStatus), 300);
  };

  const handleCouncil = (val: string) => { setCouncil(val); load(1, q, val, licStatus); };
  const handleLic     = (val: string) => { setLicStatus(val); load(1, q, council, val); };

  const handleUnlink = async (id: string) => {
    setUnlinkingId(id);
    try {
      await api.put(`/hcp-records/${id}`, { doctor_id: null });
      setRecords(prev => prev.map(r =>
        r.id === id ? { ...r, doctor_id: null, doctor: null } : r
      ));
    } catch { /* silent — row stays linked if it fails */ }
    finally { setUnlinkingId(null); }
  };

  const totalPages = Math.ceil(total / 30);

  const STAT_CARDS = [
    { label: "UMDPC — Doctors", color: "text-sky-700",    filter: "Uganda Medical" },
    { label: "UNMC — Nurses",   color: "text-violet-700", filter: "Uganda Nurses"  },
    { label: "AHPC — Allied",   color: "text-teal-700",   filter: "Allied"         },
  ];

  const getCount = (filter: string) => {
    const entry = Object.entries(councilCounts).find(([k]) => k.includes(filter));
    return entry ? entry[1] : null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ label, color, filter }) => (
          <button key={label}
            onClick={() => handleCouncil(council.includes(filter) ? "" : filter)}
            className={`bg-white rounded-xl border p-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)] text-left hover:ring-2 hover:ring-[#16a34a]/30 ${council.includes(filter) ? "ring-2 ring-[#16a34a]" : "border-gray-100"}`}
            style={{ transition: "box-shadow 0.15s" }}>
            <p className={`text-xs font-bold ${color}`}>{label}</p>
            <p className="text-lg font-black text-[#1a2530] mt-0.5">
              {getCount(filter) != null
                ? getCount(filter)!.toLocaleString()
                : <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse" />
              }
            </p>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={q} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name or registration number…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
        </div>
        <select value={licStatus} onChange={e => handleLic(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20">
          <option value="">All licence statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        {(q || council || licStatus) && (
          <button onClick={() => { setQ(""); setCouncil(""); setLicStatus(""); load(1, "", "", ""); }}
            className="px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl bg-white"
            style={{ transition: "color 0.12s" }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FaStethoscope className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm font-semibold">No records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 200 }}>Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 80  }}>Council</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 110 }}>Reg No.</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 90  }}>Registered</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 90  }}>Expiry</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 80  }}>Licence</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 140 }}>Claimed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => {
                    const short = COUNCIL_SHORT[r.council] ?? r.council.slice(0, 5);
                    const color = COUNCIL_COLOR[short] ?? "bg-gray-100 text-gray-600 border-gray-200";
                    const isActive = r.licence_status?.toLowerCase() === "active";
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/60" style={{ transition: "background-color 0.1s" }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1a2530] text-sm">{r.name}</p>
                          {r.license_number && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{r.license_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{short}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.registration_no || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {r.registration_date ? new Date(r.registration_date).getFullYear() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {r.license_expiry ? new Date(r.license_expiry).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {r.licence_status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.doctor_id && r.doctor ? (
                            <div className="flex items-center gap-1.5">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold text-[#16a34a] truncate" style={{ maxWidth: 90 }}>{r.doctor.doctor_name}</p>
                                <p className="text-[9px] text-gray-400">{r.doctor.cadre}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUnlink(r.id)}
                                disabled={unlinkingId === r.id}
                                title="Unlink from master directory"
                                className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-40 shrink-0"
                                style={{ transition: "color 0.12s, background-color 0.12s" }}>
                                {unlinkingId === r.id
                                  ? <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                                  : <LuX className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setLinkTarget(r)}
                              className="text-[10px] font-semibold text-[#16a34a] border border-[#dcfce7] bg-[#f0fdf4] px-2 py-0.5 rounded-full hover:bg-[#dcfce7]"
                              style={{ transition: "background-color 0.12s" }}>
                              Link
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              <span>{total.toLocaleString()} total · Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => load(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  style={{ transition: "background-color 0.12s" }}>Prev</button>
                <button onClick={() => load(page + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  style={{ transition: "background-color 0.12s" }}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {linkTarget && (
        <LinkModal
          record={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={(doctorId, doctor) => {
            setRecords(prev => prev.map(r =>
              r.id === linkTarget.id ? { ...r, doctor_id: doctorId, doctor } : r
            ));
            setLinkTarget(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Main HCP Directory Page ──────────────────────────────────────────────────

const HcpDirectory = () => {
  const [tab, setTab]             = useState<"master" | "registry">("master");
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Delete
  const [deleteTargets, setDeleteTargets] = useState<{ id: string; name: string }[] | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const [registryTotal, setRegistryTotal] = useState(0);

  // Spreadsheet edit mode
  const [viewMode,    setViewMode]    = useState<"list" | "table">("list");
  const [tableEdits,  setTableEdits]  = useState<Record<string, RowEdit>>({});
  const [dirtyIds,    setDirtyIds]    = useState<Set<string>>(new Set());
  const [savingAll,   setSavingAll]   = useState(false);
  const [saveMsg,     setSaveMsg]     = useState<{ text: string; ok: boolean } | null>(null);

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

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === doctors.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(doctors.map(d => d.id)));
    }
  };

  const handleBulkEdit = async (fields: Record<string, unknown>) => {
    await bulkEditDoctorsApi([...checkedIds], fields);
    setDoctors(prev => prev.map(d =>
      checkedIds.has(d.id) ? { ...d, ...fields } as Doctor : d
    ));
    setCheckedIds(new Set());
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return;
    setDeleting(true);
    await Promise.allSettled(deleteTargets.map(t => deleteDoctorApi(t.id)));
    const deletedIds = new Set(deleteTargets.map(t => t.id));
    setDoctors(prev => prev.filter(d => !deletedIds.has(d.id)));
    setCheckedIds(prev => { const n = new Set(prev); deletedIds.forEach(id => n.delete(id)); return n; });
    setDeleteTargets(null);
    setDeleting(false);
  };

  // Reset table edits whenever the doctors page changes (pagination / search)
  useEffect(() => {
    const init: Record<string, RowEdit> = {};
    for (const d of doctors) init[d.id] = initRowEdit(d);
    setTableEdits(init);
    setDirtyIds(new Set());
    setSaveMsg(null);
  }, [doctors]);

  const enterTableMode = () => {
    setViewMode("table");
    const init: Record<string, RowEdit> = {};
    for (const d of doctors) init[d.id] = initRowEdit(d);
    setTableEdits(init);
    setDirtyIds(new Set());
    setSaveMsg(null);
  };

  const changeCell = (id: string, field: keyof RowEdit, value: string) => {
    setTableEdits(prev => ({ ...prev, [id]: { ...(prev[id] ?? initRowEdit(doctors.find(d => d.id === id)!)), [field]: value } }));
    setDirtyIds(prev => new Set([...prev, id]));
    setSaveMsg(null);
  };

  const discardEdits = () => {
    const init: Record<string, RowEdit> = {};
    for (const d of doctors) init[d.id] = initRowEdit(d);
    setTableEdits(init);
    setDirtyIds(new Set());
    setSaveMsg(null);
  };

  const saveAll = async () => {
    if (dirtyIds.size === 0 || savingAll) return;
    setSavingAll(true);
    setSaveMsg(null);
    let saved = 0, failed = 0;
    for (const id of Array.from(dirtyIds)) {
      const edit = tableEdits[id];
      if (!edit) continue;
      try {
        await api.put(`/doctor/${id}`, {
          doctor_name:       edit.doctor_name,
          cadre:             edit.cadre,
          speciality:        edit.speciality.split(",").map((s: string) => s.trim()).filter(Boolean),
          location:          edit.location,
          town:              edit.town,
          contact:           edit.contact || null,
          license_number:    edit.license_number || null,
          prescribing_level: edit.prescribing_level || null,
        });
        saved++;
      } catch { failed++; }
    }
    setSavingAll(false);
    if (failed === 0) {
      setSaveMsg({ text: `${saved} doctor${saved !== 1 ? "s" : ""} updated`, ok: true });
      setDirtyIds(new Set());
      load(page, q);
    } else {
      setSaveMsg({ text: `${saved} saved · ${failed} failed — check connection`, ok: false });
    }
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
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold ${viewMode === "list" ? "bg-[#16a34a] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              style={{ transition: "background-color 0.12s, color 0.12s" }}>
              <FiList className="w-3 h-3" /> List
            </button>
            <button
              onClick={enterTableMode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-l border-gray-200 ${viewMode === "table" ? "bg-[#16a34a] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              style={{ transition: "background-color 0.12s, color 0.12s" }}>
              <FiGrid className="w-3 h-3" /> Spreadsheet
            </button>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 border border-[#16a34a] text-[#16a34a] text-sm font-semibold px-3.5 py-2.5 rounded-xl hover:bg-green-50"
            style={{ transition: "background-color 0.15s" }}>
            <FaFileExcel className="w-3.5 h-3.5" /><span className="hidden sm:inline">Upload Excel</span>
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)]"
            style={{ transition: "background-color 0.15s" }}>
            <FaPlus className="w-3.5 h-3.5" /><span>Add HCP</span>
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-100 -mb-1">
        {([
          { key: "master",   label: "Master Directory", count: total },
          { key: "registry", label: "Government Registry", count: registryTotal },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.key
                ? "border-[#16a34a] text-[#16a34a]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            style={{ transition: "color 0.12s" }}>
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key ? "bg-green-100 text-[#16a34a]" : "bg-gray-100 text-gray-400"
            }`}>{t.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Government Registry panel */}
      {tab === "registry" && <GovernmentRegistry onTotalLoaded={setRegistryTotal} />}

      {/* Unlinked warning */}
      {tab === "master" && withoutFacility > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FaHospital className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">{withoutFacility} HCP{withoutFacility !== 1 ? "s" : ""} not linked to any facility.</span>
            {" "}GPS anomaly detection requires a primary facility with GPS coordinates.
            Click a row to assign facilities.
          </p>
        </div>
      )}

      {tab === "master" && <>
      {/* Search */}
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input type="text" value={q} onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name, town, or location…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && doctors.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex flex-col items-center py-20 text-gray-400">
          <FaStethoscope className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">{q ? "No matching HCPs" : "No HCPs in database"}</p>
        </div>
      )}

      {/* List view */}
      {!loading && doctors.length > 0 && viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="hidden sm:grid px-4 sm:px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
            style={{ gridTemplateColumns: "1.5rem 2rem 1fr 6rem 8rem 2rem" }}>
            <button onClick={toggleAll} className="flex items-center justify-center focus-visible:outline-none">
              {checkedIds.size === doctors.length && doctors.length > 0
                ? <FiCheckSquare className="w-3.5 h-3.5 text-[#16a34a]" />
                : <FiSquare className="w-3.5 h-3.5 text-gray-300" />}
            </button>
            <span /><span>Clinician</span><span>Cadre</span><span>Primary Facility</span><span />
          </div>
          <div className="divide-y divide-gray-50">
            {doctors.map(d => {
              const primary = d.work_facilities?.find(f => f.is_primary) ?? d.work_facilities?.[0];
              const facilityHasGps = primary?.facility.latitude != null;
              const isChecked = checkedIds.has(d.id);
              return (
                <div key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`grid sm:grid-cols-[1.5rem_2rem_1fr_6rem_8rem_2rem] items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer ${isChecked ? "bg-green-50" : "hover:bg-[#f0fdf4]/40"}`}
                  style={{ transition: "background-color 0.12s" }}>

                  <button
                    onClick={(e) => toggleCheck(d.id, e)}
                    className="hidden sm:flex items-center justify-center focus-visible:outline-none shrink-0">
                    {isChecked
                      ? <FiCheckSquare className="w-4 h-4 text-[#16a34a]" />
                      : <FiSquare className="w-4 h-4 text-gray-300 hover:text-gray-400" />}
                  </button>

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

                  {/* Per-row delete */}
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTargets([{ id: d.id, name: d.doctor_name }]); }}
                    className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 shrink-0 focus-visible:outline-none"
                    style={{ transition: "color 0.12s, background-color 0.12s" }}
                    title="Delete doctor">
                    <LuTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

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
        </div>
      )}

      {/* Spreadsheet view */}
      {!loading && doctors.length > 0 && viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-x-auto">
          {dirtyIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-semibold">
              <span>{dirtyIds.size} unsaved row{dirtyIds.size !== 1 ? "s" : ""}</span>
              <span className="text-amber-300">·</span>
              <span className="font-normal">Highlighted rows have pending changes</span>
            </div>
          )}
          <table className="w-full text-xs" style={{ minWidth: 1020 }}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 w-8">#</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 160 }}>Name</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 110 }}>Cadre</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 140 }}>Speciality</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 120 }}>Location</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 100 }}>Town</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 110 }}>Contact</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 100 }}>License #</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400" style={{ minWidth: 150 }}>Prescribing Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doctors.map((d, idx) => {
                const edit = tableEdits[d.id] ?? initRowEdit(d);
                const dirty = dirtyIds.has(d.id);
                const cellCls = "w-full border border-transparent hover:border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 rounded px-1.5 py-1 text-xs text-[#1a2530] outline-none bg-transparent focus:bg-white";
                return (
                  <tr key={d.id}
                    className={dirty ? "bg-amber-50" : "hover:bg-gray-50/60"}
                    style={{ borderLeft: `3px solid ${dirty ? "#f59e0b" : "transparent"}`, transition: "background-color 0.1s" }}>
                    <td className="px-3 py-1.5 text-gray-400 text-[11px] select-none">{(page - 1) * 30 + idx + 1}</td>
                    <td className="px-1.5 py-1">
                      <input value={edit.doctor_name} onChange={e => changeCell(d.id, "doctor_name", e.target.value)}
                        className={cellCls + " font-medium"} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <select value={edit.cadre} onChange={e => changeCell(d.id, "cadre", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }}>
                        {CADRES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={edit.speciality} onChange={e => changeCell(d.id, "speciality", e.target.value)}
                        placeholder="comma-separated"
                        className={cellCls + " placeholder:text-gray-300"} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={edit.location} onChange={e => changeCell(d.id, "location", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={edit.town} onChange={e => changeCell(d.id, "town", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={edit.contact} onChange={e => changeCell(d.id, "contact", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={edit.license_number} onChange={e => changeCell(d.id, "license_number", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }} />
                    </td>
                    <td className="px-1.5 py-1">
                      <select value={edit.prescribing_level} onChange={e => changeCell(d.id, "prescribing_level", e.target.value)}
                        className={cellCls} style={{ transition: "border-color 0.1s, box-shadow 0.1s" }}>
                        <option value="">—</option>
                        {PRESC_LVL.map(p => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {total > 30 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Page {page} of {Math.ceil(total / 30)}</span>
              <div className="flex gap-2">
                <button onClick={() => { discardEdits(); load(page - 1); }} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  style={{ transition: "background-color 0.12s" }}>Prev</button>
                <button onClick={() => { discardEdits(); load(page + 1); }} disabled={page >= Math.ceil(total / 30)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  style={{ transition: "background-color 0.12s" }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
      </>}

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

      {/* Excel upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => { setShowUpload(false); load(1, q); }}
        />
      )}

      {/* Floating bulk-edit panel (list mode) */}
      {checkedIds.size > 0 && viewMode === "list" && (
        <BulkEditPanel
          count={checkedIds.size}
          onApply={handleBulkEdit}
          onClear={() => setCheckedIds(new Set())}
          onDelete={() => setDeleteTargets(doctors.filter(d => checkedIds.has(d.id)).map(d => ({ id: d.id, name: d.doctor_name })))}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTargets && (
        <DeleteConfirmModal
          targets={deleteTargets}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargets(null)}
          deleting={deleting}
        />
      )}

      {/* Floating save bar (spreadsheet mode) */}
      {viewMode === "table" && dirtyIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a2530] text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.35)]"
          style={{ whiteSpace: "nowrap" }}>
          <span className="text-sm font-semibold">{dirtyIds.size} unsaved change{dirtyIds.size !== 1 ? "s" : ""}</span>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={discardEdits}
            className="text-xs text-gray-400 hover:text-white focus-visible:outline-none"
            style={{ transition: "color 0.12s" }}>
            Discard
          </button>
          <button onClick={saveAll} disabled={savingAll}
            className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-xl"
            style={{ transition: "background-color 0.15s" }}>
            {savingAll ? "Saving…" : `Save ${dirtyIds.size} change${dirtyIds.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Save result toast */}
      {saveMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] text-sm font-semibold text-white ${saveMsg.ok ? "bg-[#16a34a]" : "bg-red-600"}`}
          style={{ whiteSpace: "nowrap" }}>
          <span>{saveMsg.ok ? "✓" : "✕"} {saveMsg.text}</span>
          <button onClick={() => setSaveMsg(null)} className="opacity-60 hover:opacity-100 focus-visible:outline-none ml-1"
            style={{ transition: "opacity 0.12s" }}>
            <FaXmark className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HcpDirectory;
