import { useState, useEffect } from "react";
import { FaHospital, FaPlus, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import api from "../../../services/api";

interface Pharmacy {
  id: string;
  name: string;
  town?: string;
  location?: string;
  contact?: string;
  is_active?: boolean;
}

const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ name: "", town: "", location: "", contact: "" });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  const load = () => {
    setLoading(true);
    api.get("/pharmacy")
      .then(r => setPharmacies(r.data.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = q.length >= 2
    ? pharmacies.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.town?.toLowerCase().includes(q.toLowerCase()) ||
        p.location?.toLowerCase().includes(q.toLowerCase())
      )
    : pharmacies;

  const activeCount   = pharmacies.filter(p => p.is_active !== false).length;
  const townSet       = new Set(pharmacies.map(p => p.town).filter(Boolean));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.name.trim()) { setFormError("Pharmacy name is required"); return; }
    setSaving(true);
    try {
      await api.post("/pharmacy", {
        name:     form.name.trim(),
        town:     form.town || undefined,
        location: form.location || undefined,
        contact:  form.contact || undefined,
      });
      setShowModal(false);
      setForm({ name: "", town: "", location: "", contact: "" });
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.message || "Failed to create pharmacy");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Pharmacy Directory</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {pharmacies.length} pharmacies · {townSet.size} towns
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Add Pharmacy</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: pharmacies.length, color: "text-gray-700" },
          { label: "Active",   value: activeCount,       color: "text-[#16a34a]" },
          { label: "Towns",    value: townSet.size,       color: "text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
            <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
            {loading
              ? <div className="h-7 w-10 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search by name, town, or location…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaHospital className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">{q ? "No matching pharmacies" : "No pharmacies yet"}</p>
            <p className="text-sm mt-1">Add pharmacies your reps visit in the field</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((p, i) => (
              <div key={p.id || String(i)} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/50">
                <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <FaHospital className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[p.town, p.location, p.contact].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {p.is_active === false && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                    Inactive
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Add Pharmacy</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 flex flex-col gap-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}
              {[
                { key: "name",     label: "Pharmacy Name *",   placeholder: "e.g. Kampala Pharmacy Ltd" },
                { key: "town",     label: "Town / Area",        placeholder: "e.g. Kampala" },
                { key: "location", label: "Location / Address", placeholder: "e.g. Nakasero Road, Shop 12" },
                { key: "contact",  label: "Contact",            placeholder: "e.g. +256 700 000000" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Saving…" : "Add Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacies;
