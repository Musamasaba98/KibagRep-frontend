import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MdClose } from "react-icons/md";
import { LuCheck, LuX } from "react-icons/lu";
import { TbActivityHeartbeat, TbPill } from "react-icons/tb";
import { getDailyReportActivitiesApi, approveReportApi, rejectReportApi } from "../../../services/api";

interface Product { id: string; product_name: string; }
interface Activity {
  id: string;
  date: string;
  activity_type?: "doctor" | "pharmacy";
  visit_type?: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given?: number;
  nca_reason?: string | null;
  gps_anomaly_flag?: boolean;
  doctor?: { doctor_name: string; speciality?: string[]; location?: string; town?: string } | null;
  pharmacy?: { pharmacy_name: string; location?: string; town?: string; contact?: string } | null;
  focused_product?: Product | null;
  products_detailed?: Product[];
  stock_noted?: Record<string, number>;
  products_in_stock?: Product[];
}

interface Props {
  reportId: string;
  repName: string;
  reportDate: string;
  visitCount: number;
  sampleCount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "DRAFT";
  summary?: string | null;
  onClose: () => void;
  onActioned?: () => void;
}

const VTYPE: Record<string, string> = {
  PLANNED:   "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  UNPLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  NCA:       "bg-amber-50 text-amber-700 border-amber-200",
};

const RejectInput = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-poppins-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
      style={{ transition: "background-color 0.15s" }}>
      <LuX className="w-3.5 h-3.5" /> Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus type="text" value={note} onChange={e => setNote(e.target.value)}
        placeholder="Reason for rejection…"
        className="flex-1 text-xs font-poppins border border-red-300 rounded-lg px-2.5 py-2 outline-none focus:border-red-400 min-w-[160px]" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-2 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700">Send</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 font-poppins">Cancel</button>
    </div>
  );
};

const ReportPreviewSlideOver = ({
  reportId, repName, reportDate, visitCount, sampleCount,
  status, summary, onClose, onActioned,
}: Props) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    getDailyReportActivitiesApi(reportId)
      .then(r => setActivities(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleApprove = async () => {
    setActioning(true);
    await approveReportApi(reportId).catch(() => {});
    onActioned?.();
    onClose();
  };

  const handleReject = async (note: string) => {
    setActioning(true);
    await rejectReportApi(reportId, { note }).catch(() => {});
    onActioned?.();
    onClose();
  };

  const docActs   = activities.filter(a => a.activity_type === "doctor" || !a.activity_type);
  const pharmActs = activities.filter(a => a.activity_type === "pharmacy");
  const totalSamples = docActs.reduce((s, a) => s + (a.samples_given ?? 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300] bg-black/40" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-[301] w-full max-w-2xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-0.5">Daily Report Preview</p>
            <h2 className="font-poppins-extrabold text-[#1a1a1a] text-lg leading-tight">{repName}</h2>
            <p className="text-sm font-poppins text-gray-500 mt-0.5">
              {format(new Date(reportDate), "EEEE, d MMMM yyyy")}
              <span className="mx-2 text-gray-300">·</span>
              <span className="font-poppins-semibold text-[#1a1a1a]">{visitCount} visit{visitCount !== 1 ? "s" : ""}</span>
              {sampleCount > 0 && (
                <><span className="mx-2 text-gray-300">·</span>
                <span className="font-poppins-semibold text-[#16a34a]">{sampleCount} samples</span></>
              )}
            </p>
            {summary && (
              <p className="text-xs font-poppins text-gray-400 italic mt-1">"{summary}"</p>
            )}
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus-visible:outline-none shrink-0 mt-0.5">
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm font-poppins text-gray-400 text-center py-12">No activities recorded for this day.</p>
          ) : (
            <>
              {/* ── HCP Visits ── */}
              {docActs.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-[#dcfce7]">
                  <div className="bg-[#16a34a] px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TbActivityHeartbeat className="w-4 h-4 text-white" />
                      <span className="text-xs font-poppins-bold text-white uppercase tracking-wider">
                        HCP Visits — {docActs.length}
                      </span>
                    </div>
                    {totalSamples > 0 && (
                      <span className="text-[10px] font-poppins-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                        {totalSamples} samples total
                      </span>
                    )}
                  </div>
                  {/* Headers */}
                  <div className="grid bg-[#f0fdf4] border-b border-[#dcfce7] px-4 py-1.5"
                    style={{ gridTemplateColumns: "1.5rem 1fr 1fr 3.5rem 4.5rem" }}>
                    {["#","Doctor / Facility","Products Detailed","Smp","Type"].map(h => (
                      <span key={h} className="text-[9px] font-poppins-bold text-[#16a34a] uppercase">{h}</span>
                    ))}
                  </div>
                  {docActs.map((act, idx) => {
                    const detailed: Product[] = (act as any).products_detailed ?? [];
                    const focusedId = act.focused_product?.id;
                    const allProds = [
                      ...(act.focused_product ? [{ ...act.focused_product, isFocus: true }] : []),
                      ...detailed.filter(p => p.id !== focusedId).map(p => ({ ...p, isFocus: false })),
                    ];
                    return (
                      <div key={act.id}
                        className={`grid items-start px-4 py-2.5 border-b border-gray-50 last:border-0 gap-1 ${idx % 2 === 1 ? "bg-[#f9fefb]" : "bg-white"}`}
                        style={{ gridTemplateColumns: "1.5rem 1fr 1fr 3.5rem 4.5rem" }}>
                        <span className="text-[10px] font-poppins-bold text-gray-400 pt-0.5">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-poppins-semibold truncate ${act.nca_reason ? "text-amber-700 italic" : "text-[#1a1a1a]"}`}>
                            {act.nca_reason ? "NCA — " : ""}{act.doctor?.doctor_name ?? "Unknown"}
                          </p>
                          <p className="text-[10px] font-poppins text-gray-400 truncate">
                            {[act.doctor?.location, act.doctor?.town].filter(Boolean).join(" · ") || "—"}
                          </p>
                          {act.nca_reason && <p className="text-[10px] text-amber-600">↳ {act.nca_reason}</p>}
                          {act.gps_anomaly_flag && (
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 mt-0.5">GPS flag</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {allProds.length > 0 ? allProds.map(p => (
                            <span key={p.id} className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${
                              p.isFocus ? "bg-[#dcfce7] text-[#16a34a] border-[#86efac]" : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}>
                              {p.isFocus ? "★ " : ""}{p.product_name}
                            </span>
                          )) : <span className="text-gray-300 text-[10px]">—</span>}
                        </div>
                        <div className="text-center pt-0.5">
                          {(act.samples_given ?? 0) > 0
                            ? <span className="text-xs font-poppins-bold text-blue-700">{act.samples_given}</span>
                            : <span className="text-gray-300 text-[10px]">—</span>}
                        </div>
                        <div className="text-center pt-0.5">
                          {act.visit_type && (
                            <span className={`text-[9px] font-poppins-bold px-1.5 py-0.5 rounded-full border ${VTYPE[act.visit_type] ?? ""}`}>
                              {act.visit_type}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pharmacy Coverage ── */}
              {pharmActs.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-violet-200">
                  <div className="bg-violet-700 px-4 py-2.5 flex items-center gap-2">
                    <TbPill className="w-4 h-4 text-white" />
                    <span className="text-xs font-poppins-bold text-white uppercase tracking-wider">
                      Pharmacy Coverage — {pharmActs.length}
                    </span>
                  </div>
                  <div className="grid bg-violet-50 border-b border-violet-100 px-4 py-1.5"
                    style={{ gridTemplateColumns: "1fr 5rem 1fr" }}>
                    {["Pharmacy / Location","Contact","Stock on Shelf"].map(h => (
                      <span key={h} className="text-[9px] font-poppins-bold text-violet-700 uppercase">{h}</span>
                    ))}
                  </div>
                  {pharmActs.map((act, idx) => {
                    const stockNoted = (act as any).stock_noted ?? {};
                    const productsInStock: Product[] = (act as any).products_in_stock ?? [];
                    return (
                      <div key={act.id}
                        className={`grid items-start px-4 py-2.5 border-b border-violet-50 last:border-0 gap-2 ${idx % 2 === 1 ? "bg-violet-50/40" : "bg-white"}`}
                        style={{ gridTemplateColumns: "1fr 5rem 1fr" }}>
                        <div className="min-w-0">
                          <p className="text-xs font-poppins-semibold text-[#1a1a1a] truncate">
                            {act.pharmacy?.pharmacy_name ?? "Unknown"}
                          </p>
                          <p className="text-[10px] font-poppins text-gray-400 truncate">
                            {[act.pharmacy?.location, act.pharmacy?.town].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <span className="text-[10px] font-poppins text-gray-500 pt-0.5">
                          {(act.pharmacy as any)?.contact ?? "—"}
                        </span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {productsInStock.length > 0 ? productsInStock.map(p => {
                            const qty = stockNoted[p.id] ?? 0;
                            return (
                              <span key={p.id} className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${
                                qty > 0 ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-400 border-gray-200"
                              }`}>
                                {p.product_name}{qty > 0 ? ` ×${qty}` : ""}
                              </span>
                            );
                          }) : <span className="text-[10px] font-poppins text-gray-300 italic">No stock recorded</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — actions */}
        {status === "SUBMITTED" && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            {actioning ? (
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            ) : (
              <>
                <button onClick={handleApprove}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-poppins-bold rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  <LuCheck className="w-3.5 h-3.5" /> Approve
                </button>
                <RejectInput onConfirm={handleReject} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ReportPreviewSlideOver;
