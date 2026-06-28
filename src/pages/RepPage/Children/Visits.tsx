import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  getActivityHistoryApi,
  getPharmacyActivityHistoryApi,
  logCompetitorIntelApi,
} from "../../../services/api";
import { FaUserDoctor } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { MdOutlineMedication, MdClose, MdAdd } from "react-icons/md";
import { LuShield } from "react-icons/lu";

interface DoctorVisit {
  _type: "doctor";
  id: string;
  date: string;
  samples_given: number;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  doctor: { id: string; doctor_name: string; town: string; location: string };
  focused_product: { id: string; product_name: string } | null;
  products_detailed: { id: string; product_name: string }[];
}

interface PharmacyVisit {
  _type: "pharmacy";
  id: string;
  date: string;
  outcome?: string | null;
  stock_noted?: Record<string, number> | null;
  pharmacy: { id: string; pharmacy_name: string; town?: string; location?: string };
}

type AnyVisit = DoctorVisit | PharmacyVisit;

// ─── Competitor Intel Modal ────────────────────────────────────────────────────

interface CompIntelModalProps {
  onClose: () => void;
  prefillDoctorId?: string;
  prefillDoctorName?: string;
}

const CompIntelModal = ({ onClose, prefillDoctorId, prefillDoctorName }: CompIntelModalProps) => {
  const [form, setForm] = useState({
    competitor_company: "",
    competitor_brand: "",
    competitor_sku: "",
    is_listed: false,
    price_to_consumer: "",
    price_to_trade: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.competitor_company.trim() || !form.competitor_brand.trim()) {
      setError("Company and brand are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await logCompetitorIntelApi({
        competitor_company: form.competitor_company.trim(),
        competitor_brand: form.competitor_brand.trim(),
        competitor_sku: form.competitor_sku.trim() || undefined,
        is_listed: form.is_listed,
        price_to_consumer: form.price_to_consumer ? parseFloat(form.price_to_consumer) : null,
        price_to_trade: form.price_to_trade ? parseFloat(form.price_to_trade) : null,
        notes: form.notes.trim() || undefined,
        doctor_id: prefillDoctorId || null,
      });
      setDone(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative bg-white rounded-2xl shadow-xl w-[340px] max-w-[90vw] p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center">
            <LuShield className="w-7 h-7 text-[#16a34a]" />
          </div>
          <h2 className="font-poppins-bold text-[#1a1a1a] text-lg text-center">Competitor intel saved</h2>
          <p className="text-sm font-poppins text-gray-400 text-center">
            Your observation has been recorded and will appear in the competitor intelligence summary.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#16a34a] text-white font-poppins-semibold rounded-xl hover:bg-[#15803d] focus-visible:outline-none text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-xl w-[380px] max-w-[92vw] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest">Field Intel</p>
            <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Log Competitor Observation</h2>
            {prefillDoctorName && (
              <p className="text-xs text-gray-400 font-poppins mt-0.5">at {prefillDoctorName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none"
          >
            <MdClose className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-poppins px-3 py-2 rounded-xl">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">
                Competitor company <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cipla Quality"
                value={form.competitor_company}
                onChange={(e) => set("competitor_company", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              />
            </div>
            <div>
              <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">
                Brand / product <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Amlodipine 5mg"
                value={form.competitor_brand}
                onChange={(e) => set("competitor_brand", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">SKU / pack size (optional)</label>
            <input
              type="text"
              placeholder="e.g. 30 tabs / blister pack"
              value={form.competitor_sku}
              onChange={(e) => set("competitor_sku", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Consumer price (UGX)</label>
              <input
                type="number"
                placeholder="e.g. 4500"
                value={form.price_to_consumer}
                onChange={(e) => set("price_to_consumer", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              />
            </div>
            <div>
              <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Trade price (UGX)</label>
              <input
                type="number"
                placeholder="e.g. 3200"
                value={form.price_to_trade}
                onChange={(e) => set("price_to_trade", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_listed}
              onChange={(e) => set("is_listed", e.target.checked)}
              className="w-4 h-4 rounded accent-[#16a34a]"
            />
            <span className="text-sm font-poppins text-[#444]">Product is listed / stocked here</span>
          </label>

          <div>
            <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Notes (optional)</label>
            <textarea
              placeholder="Any observations about availability, rep activity, promotions…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#16a34a] text-white font-poppins-semibold text-sm rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
          >
            {saving ? "Saving…" : "Save observation"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Visits page ──────────────────────────────────────────────────────────────

const Visits = () => {
  const [allVisits, setAllVisits] = useState<AnyVisit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [compModal, setCompModal] = useState<{ doctorId?: string; doctorName?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getActivityHistoryApi({ days: 30, limit: 200 } as any),
      getPharmacyActivityHistoryApi({ days: 30, limit: 200 } as any),
    ])
      .then(([docRes, pharmRes]) => {
        const docVisits: DoctorVisit[] = (docRes.data.data ?? []).map((v: any) => ({ ...v, _type: "doctor" as const }));
        const pharmVisits: PharmacyVisit[] = (pharmRes.data.data ?? []).map((v: any) => ({ ...v, _type: "pharmacy" as const }));
        const merged = [...docVisits, ...pharmVisits].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAllVisits(merged);
      })
      .catch(() => setError("Failed to load visit history"))
      .finally(() => setLoading(false));
  }, []);

  const totalDoc   = allVisits.filter((v) => v._type === "doctor").length;
  const totalPharm = allVisits.filter((v) => v._type === "pharmacy").length;

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-poppins-extrabold text-[#222f36]">Visit History</h1>
          <p className="text-sm font-poppins text-gray-500 mt-0.5">
            Last 30 days —{" "}
            <span className="text-[#16a34a] font-poppins-semibold">{totalDoc} HCP</span>
            {totalPharm > 0 && (
              <> · <span className="text-violet-600 font-poppins-semibold">{totalPharm} pharmacy</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => setCompModal({})}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-sm font-poppins-semibold hover:bg-orange-100 focus-visible:outline-none"
        >
          <MdAdd className="w-4 h-4" />
          Log Competitor Intel
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {!loading && !error && allVisits.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <FaUserDoctor className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-poppins-semibold">No visits logged in the last 30 days</p>
          <p className="text-sm font-poppins mt-1">Use the "Log Visit" button to record your first visit</p>
        </div>
      )}

      {!loading && !error && allVisits.length > 0 && (
        <div className="flex flex-col gap-3">
          {allVisits.map((v) =>
            v._type === "doctor" ? (
              <div key={`doc-${v.id}`} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4">
                <div className="min-w-[56px] flex flex-col items-center bg-green-50 rounded-lg py-2 px-1">
                  <span className="text-xs font-poppins-bold text-[#16a34a] uppercase tracking-wide">{format(new Date(v.date), "MMM")}</span>
                  <span className="text-2xl font-poppins-extrabold text-[#16a34a] leading-none">{format(new Date(v.date), "dd")}</span>
                  <span className="text-[10px] font-poppins text-gray-400 mt-0.5">{format(new Date(v.date), "EEE")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-poppins-bold text-[#222f36] text-sm">{v.doctor.doctor_name}</p>
                      <p className="text-xs font-poppins text-gray-400 mt-0.5">{[v.doctor.location, v.doctor.town].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.samples_given > 0 && (
                        <span className="flex items-center gap-1 bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#dcfce7]">
                          <MdOutlineMedication className="w-3.5 h-3.5" />{v.samples_given} smp
                        </span>
                      )}
                      {v.gps_anomaly && <span className="text-[10px] font-poppins-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">GPS ⚠</span>}
                      {v.nca_reason  && <span className="text-[10px] font-poppins-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">NCA</span>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    {v.focused_product && (
                      <span className="bg-[#16a34a] text-white text-[11px] font-poppins-semibold px-2 py-0.5 rounded-full">★ {v.focused_product.product_name}</span>
                    )}
                    {v.products_detailed?.filter((p) => p.id !== v.focused_product?.id).map((p) => (
                      <span key={p.id} className="bg-gray-100 text-gray-600 text-[11px] font-poppins-semibold px-2 py-0.5 rounded-full">{p.product_name}</span>
                    ))}
                    <button
                      onClick={() => setCompModal({ doctorId: v.doctor.id, doctorName: v.doctor.doctor_name })}
                      className="ml-auto text-[10px] font-poppins-semibold text-orange-500 hover:text-orange-700 focus-visible:outline-none flex items-center gap-0.5"
                    >
                      <LuShield className="w-3 h-3" /> Log intel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={`pharm-${v.id}`} className="bg-white rounded-xl shadow shadow-gray-100/80 px-5 py-4 flex items-start gap-4">
                <div className="min-w-[56px] flex flex-col items-center bg-violet-50 rounded-lg py-2 px-1">
                  <span className="text-xs font-poppins-bold text-violet-600 uppercase tracking-wide">{format(new Date(v.date), "MMM")}</span>
                  <span className="text-2xl font-poppins-extrabold text-violet-600 leading-none">{format(new Date(v.date), "dd")}</span>
                  <span className="text-[10px] font-poppins text-gray-400 mt-0.5">{format(new Date(v.date), "EEE")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TbPill className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <p className="font-poppins-bold text-[#222f36] text-sm">{v.pharmacy.pharmacy_name}</p>
                      </div>
                      <p className="text-xs text-gray-400 font-poppins mt-0.5">{[v.pharmacy.location, v.pharmacy.town].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="text-[10px] font-poppins-bold bg-violet-100 text-violet-600 px-2 py-1 rounded-full shrink-0 border border-violet-200">Pharmacy</span>
                  </div>
                  {v.outcome && <p className="text-xs font-poppins text-gray-500 mt-2 italic">"{v.outcome}"</p>}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {compModal !== null && (
        <CompIntelModal
          onClose={() => setCompModal(null)}
          prefillDoctorId={compModal.doctorId}
          prefillDoctorName={compModal.doctorName}
        />
      )}
    </div>
  );
};

export default Visits;
