import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getActivityHistoryApi, getPharmacyActivityHistoryApi } from "../../../services/api";
import { FaUserDoctor } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { MdOutlineMedication } from "react-icons/md";

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

const Visits = () => {
  const [allVisits, setAllVisits] = useState<AnyVisit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getActivityHistoryApi({ days: 30, limit: 200 }),
      getPharmacyActivityHistoryApi({ days: 30, limit: 200 }),
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
      <div>
        <h1 className="text-2xl font-black text-[#222f36]">Visit History</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Last 30 days —{" "}
          <span className="text-[#16a34a] font-semibold">{totalDoc} HCP</span>
          {totalPharm > 0 && (
            <> · <span className="text-violet-600 font-semibold">{totalPharm} pharmacy</span></>
          )}
        </p>
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
          <p className="font-semibold">No visits logged in the last 30 days</p>
          <p className="text-sm mt-1">Use the "Log Visit" button to record your first visit</p>
        </div>
      )}

      {!loading && !error && allVisits.length > 0 && (
        <div className="flex flex-col gap-3">
          {allVisits.map((v) =>
            v._type === "doctor" ? (
              <div key={`doc-${v.id}`} className="bg-white rounded-xl shadow shadow-gray-100/80 px-5 py-4 flex items-start gap-4">
                <div className="min-w-[56px] flex flex-col items-center bg-green-50 rounded-lg py-2 px-1">
                  <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">{format(new Date(v.date), "MMM")}</span>
                  <span className="text-2xl font-black text-[#16a34a] leading-none">{format(new Date(v.date), "dd")}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{format(new Date(v.date), "EEE")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#222f36] text-sm">{v.doctor.doctor_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{[v.doctor.location, v.doctor.town].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.samples_given > 0 && (
                        <span className="flex items-center gap-1 bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#dcfce7]">
                          <MdOutlineMedication className="w-3.5 h-3.5" />{v.samples_given} smp
                        </span>
                      )}
                      {v.gps_anomaly && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">GPS ⚠</span>}
                      {v.nca_reason  && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">NCA</span>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.focused_product && (
                      <span className="bg-[#16a34a] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">★ {v.focused_product.product_name}</span>
                    )}
                    {v.products_detailed?.filter((p) => p.id !== v.focused_product?.id).map((p) => (
                      <span key={p.id} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{p.product_name}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div key={`pharm-${v.id}`} className="bg-white rounded-xl shadow shadow-gray-100/80 px-5 py-4 flex items-start gap-4">
                <div className="min-w-[56px] flex flex-col items-center bg-violet-50 rounded-lg py-2 px-1">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">{format(new Date(v.date), "MMM")}</span>
                  <span className="text-2xl font-black text-violet-600 leading-none">{format(new Date(v.date), "dd")}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{format(new Date(v.date), "EEE")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TbPill className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <p className="font-bold text-[#222f36] text-sm">{v.pharmacy.pharmacy_name}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{[v.pharmacy.location, v.pharmacy.town].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-2 py-1 rounded-full shrink-0 border border-violet-200">Pharmacy</span>
                  </div>
                  {v.outcome && <p className="text-xs text-gray-500 mt-2 italic">"{v.outcome}"</p>}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Visits;
