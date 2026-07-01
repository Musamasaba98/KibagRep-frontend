import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { FiMapPin, FiAlertTriangle, FiLoader, FiPlus, FiUser, FiCheck } from "react-icons/fi";
import { getProductsApi, addPharmacyActivityApi, getPharmacyStaffApi, suggestPharmacyStaffApi } from "../../services/api";

interface Product { id: string; product_name: string; }
interface StockItem { product_id: string; qty: number; }
interface StaffMember { id: string; name: string; role: string; phone?: string | null; }

interface LogPharmacyModalProps {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLocation?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type GpsStatus = "acquiring" | "acquired" | "denied" | "unavailable";

const ROLES = ["Dispenser", "Pharmacist", "Procurement", "Owner", "Manager"] as const;

const RoleBadge = ({ role }: { role: string }) => {
  const colours: Record<string, string> = {
    Dispenser:   "bg-violet-50 text-violet-700 border-violet-200",
    Pharmacist:  "bg-blue-50 text-blue-700 border-blue-200",
    Procurement: "bg-amber-50 text-amber-700 border-amber-200",
    Owner:       "bg-green-50 text-green-700 border-green-200",
    Manager:     "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`text-[10px] font-poppins-semibold px-1.5 py-0.5 rounded-full border ${colours[role] ?? colours.Manager}`}>
      {role}
    </span>
  );
};

const LogPharmacyModal = ({
  pharmacyId,
  pharmacyName,
  pharmacyLocation,
  onClose,
  onSuccess,
}: LogPharmacyModalProps) => {
  const [products,      setProducts]      = useState<Product[]>([]);
  const [stockItems,    setStockItems]    = useState<StockItem[]>([]);
  const [outcome,       setOutcome]       = useState("");
  const [gpsLat,        setGpsLat]        = useState<number | null>(null);
  const [gpsLng,        setGpsLng]        = useState<number | null>(null);
  const [gpsStatus,     setGpsStatus]     = useState<GpsStatus>("acquiring");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  // Staff
  const [staffList,     setStaffList]     = useState<StaffMember[]>([]);
  const [metIds,        setMetIds]        = useState<Set<string>>(new Set());
  const [showAddStaff,  setShowAddStaff]  = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newRole,       setNewRole]       = useState<string>("Dispenser");
  const [newPhone,      setNewPhone]      = useState("");
  const [addingStaff,   setAddingStaff]   = useState(false);
  const [staffError,    setStaffError]    = useState("");

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setGpsStatus("acquired"); },
      (err) => setGpsStatus(err.code === 1 ? "denied" : "unavailable"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Products + Staff
  useEffect(() => {
    getProductsApi().then((r) => {
      const prods: Product[] = r.data.data ?? r.data;
      setProducts(prods);
      setStockItems(prods.map((p) => ({ product_id: p.id, qty: 0 })));
    }).catch(() => {});

    getPharmacyStaffApi(pharmacyId).then((r) => {
      setStaffList(r.data.data ?? []);
    }).catch(() => {});
  }, [pharmacyId]);

  const updateQty = (productId: string, qty: number) =>
    setStockItems((prev) => prev.map((s) => s.product_id === productId ? { ...s, qty } : s));

  const toggleMet = (id: string) =>
    setMetIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleAddStaff = async () => {
    if (!newName.trim()) { setStaffError("Name is required"); return; }
    setStaffError("");
    setAddingStaff(true);
    try {
      const res = await suggestPharmacyStaffApi({
        name: newName.trim(),
        role: newRole,
        phone: newPhone.trim() || undefined,
        pharmacy_id: pharmacyId,
      });
      const added: StaffMember = res.data.data;
      // Suggested staff won't appear in master list yet, but mark as met immediately
      setMetIds((prev) => new Set([...prev, added.id]));
      setShowAddStaff(false);
      setNewName(""); setNewPhone(""); setNewRole("Dispenser");
    } catch {
      setStaffError("Failed to save. Try again.");
    } finally {
      setAddingStaff(false);
    }
  };

  const observedCount = stockItems.filter((s) => s.qty > 0).length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (gpsStatus === "denied") { setError("Location access is blocked. Enable it in your phone settings to log visits."); return; }
    const observed = stockItems.filter((s) => s.qty > 0);
    setError("");
    setLoading(true);
    try {
      const res = await addPharmacyActivityApi({
        pharmacy_id:       pharmacyId,
        products_observed: observed,
        outcome,
        gps_lat:       gpsLat,
        gps_lng:       gpsLng,
        staff_met_ids: [...metIds],
      });
      if (res.data.data?.gps_anomaly) {
        setError("⚠️ GPS anomaly: your location is >100m from this pharmacy's registered address. Visit saved — supervisor will be notified.");
        setTimeout(() => { onSuccess(); onClose(); }, 3000);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to log pharmacy visit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const gpsIndicator = () => {
    if (gpsStatus === "acquiring") return (
      <span className="flex items-center font-poppins gap-1 text-[11px] text-amber-500 font-medium">
        <FiLoader className="w-3 h-3 animate-spin" /> Acquiring GPS…
      </span>
    );
    if (gpsStatus === "acquired") return (
      <span className="flex items-center font-poppins gap-1 text-[11px] text-violet-200 font-medium">
        <FiMapPin className="w-3 h-3" /> GPS acquired
      </span>
    );
    return (
      <span className="flex items-center font-poppins gap-1 text-[11px] text-violet-300 font-medium">
        <FiAlertTriangle className="w-3 h-3" /> GPS unavailable
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-violet-600 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <TbPill className="w-5 h-5 text-white/80" />
              <h2 className="text-white font-poppins-bold text-lg leading-tight">{pharmacyName}</h2>
            </div>
            {pharmacyLocation && (
              <p className="text-violet-200 font-poppins text-xs mt-0.5">{pharmacyLocation}</p>
            )}
            <div className="mt-1">{gpsIndicator()}</div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-600 font-poppins text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* ── Staff met ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-poppins-semibold text-gray-700">Who did you speak to?</label>
              <button type="button" onClick={() => setShowAddStaff((v) => !v)}
                className="flex items-center gap-1 text-xs font-poppins-semibold text-violet-600 hover:text-violet-700">
                <FiPlus className="w-3.5 h-3.5" /> Add person
              </button>
            </div>

            {staffList.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {staffList.map((s) => {
                  const checked = metIds.has(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleMet(s.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left w-full
                        ${checked ? "border-violet-300 bg-violet-50" : "border-gray-100 bg-gray-50/40 hover:bg-gray-100/60"}`}
                      style={{ transition: "background-color 0.12s, border-color 0.12s" }}>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0
                        ${checked ? "bg-violet-600 border-violet-600" : "border-gray-300"}`}>
                        {checked && <FiCheck className="w-3 h-3 text-white" />}
                      </div>
                      <FiUser className={`w-4 h-4 shrink-0 ${checked ? "text-violet-500" : "text-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-poppins-medium truncate ${checked ? "text-violet-700" : "text-gray-700"}`}>{s.name}</p>
                        {s.phone && <p className="text-[11px] font-poppins text-gray-400">{s.phone}</p>}
                      </div>
                      <RoleBadge role={s.role} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-poppins text-gray-400 mb-1">
                No contacts on record for this pharmacy yet. Add the people you meet below.
              </p>
            )}

            {/* Inline add-staff form */}
            {showAddStaff && (
              <div className="mt-3 border border-violet-200 bg-violet-50/40 rounded-xl px-4 py-3 flex flex-col gap-3">
                <p className="text-xs font-poppins-semibold text-violet-700">New person — sent for approval</p>
                {staffError && <p className="text-xs text-red-500 font-poppins">{staffError}</p>}
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name *"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30" />
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30" />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-poppins outline-none focus:border-violet-500 bg-white">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddStaff} disabled={addingStaff}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-poppins-semibold py-2 rounded-lg text-sm"
                    style={{ transition: "opacity 0.15s" }}>
                    {addingStaff ? "Saving…" : "Save & mark as met"}
                  </button>
                  <button type="button" onClick={() => { setShowAddStaff(false); setStaffError(""); }}
                    className="px-4 border border-gray-300 text-gray-600 font-poppins rounded-lg text-sm hover:bg-gray-50"
                    style={{ transition: "background-color 0.15s" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Stock on shelf ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-poppins-semibold text-gray-700">Stock on shelf</label>
              {observedCount > 0 && (
                <span className="text-xs font-poppins-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                  {observedCount} product{observedCount > 1 ? "s" : ""} found
                </span>
              )}
            </div>
            <p className="text-xs font-poppins text-gray-400 mb-3">Enter the quantity you see on shelf. Leave at 0 if not stocked.</p>
            <div className="flex flex-col gap-2">
              {products.map((p) => {
                const item = stockItems.find((s) => s.product_id === p.id);
                const qty = item?.qty ?? 0;
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${qty > 0 ? "border-violet-200 bg-violet-50/40" : "border-gray-100 bg-gray-50/40"}`}>
                    <span className="flex-1 text-sm font-poppins-medium text-[#222f36] truncate">{p.product_name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button"
                        onClick={() => updateQty(p.id, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-poppins-bold text-base flex items-center justify-center hover:bg-gray-100 focus-visible:outline-none">
                        −
                      </button>
                      <span className={`w-8 text-center font-poppins-bold text-sm ${qty > 0 ? "text-violet-600" : "text-gray-300"}`}>
                        {qty}
                      </span>
                      <button type="button"
                        onClick={() => updateQty(p.id, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-poppins-bold text-base flex items-center justify-center focus-visible:outline-none">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Outcome ───────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Outcome</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3}
              placeholder="Orders placed? Stock issues? Key observations from this pharmacy…"
              className="w-full font-poppins border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 resize-none" />
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-poppins-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
              style={{ transition: "opacity 0.15s" }}>
              {loading ? "Saving…" : "Log Pharmacy Visit"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 border font-poppins border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: "background-color 0.15s" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogPharmacyModal;
