import { useEffect, useState } from "react";
import { LuUsers, LuChevronDown, LuChevronUp, LuCalendarDays } from "react-icons/lu";
import { TbActivityHeartbeat } from "react-icons/tb";
import { getJfwReportsApi, getDailyReportActivitiesApi } from "../../../services/api";

interface JfwReport {
  id: string;
  report_date: string;
  visits_count: number;
  samples_count: number;
  summary: string | null;
  user: { id: string; firstname: string; lastname: string };
}

interface Activity {
  id: string;
  visit_type: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given: number;
  nca_reason: string | null;
  doctor: { doctor_name: string; location?: string; town?: string } | null;
  focused_product: { product_name: string } | null;
}

const INITIALS = (r: JfwReport) => `${r.user.firstname?.[0] ?? ""}${r.user.lastname?.[0] ?? ""}`.toUpperCase();
const FMT = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const VTYPE: Record<string, string> = {
  PLANNED: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  UNPLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  NCA: "bg-amber-50 text-amber-700 border-amber-200",
};

const Jfw = () => {
  const [reports, setReports] = useState<JfwReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acts, setActs] = useState<Record<string, Activity[]>>({});
  const [loadingAct, setLoadingAct] = useState<string | null>(null);

  useEffect(() => {
    getJfwReportsApi()
      .then((r) => setReports(r.data?.data ?? []))
      .catch(() => setError("Failed to load JFW records."))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (acts[id]) return;
    setLoadingAct(id);
    try {
      const r = await getDailyReportActivitiesApi(id);
      setActs((p) => ({ ...p, [id]: r.data?.data ?? [] }));
    } catch { setActs((p) => ({ ...p, [id]: [] })); }
    finally { setLoadingAct(null); }
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Joint Field Work</h1>
        <p className="text-gray-400 text-sm mt-0.5">Days you joined a rep in the field</p>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
        <LuUsers className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-violet-700 leading-relaxed">
          When a rep submits their daily report and tags you as the JFW observer, the visit appears here.
          You can expand each entry to review all HCPs visited that day.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-gray-400 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />Loading...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <LuCalendarDays className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-semibold text-sm">No JFW visits yet</p>
            <p className="text-gray-400 text-xs mt-1 text-center max-w-xs">
              Reps can tag you as their JFW observer when submitting their daily report
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((rep) => {
              const isOpen = expanded === rep.id;
              const repActs = acts[rep.id] ?? [];
              return (
                <div key={rep.id}>
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer" onClick={() => toggleExpand(rep.id)}>
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-600 font-black text-xs">{INITIALS(rep)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1a1a] text-sm leading-tight">{rep.user.firstname} {rep.user.lastname}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{FMT(rep.report_date)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <span><strong className="text-[#1a1a1a]">{rep.visits_count}</strong> visits</span>
                      <span><strong className="text-[#1a1a1a]">{rep.samples_count}</strong> samples</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">JFW</span>
                    <div className="text-gray-400 flex-shrink-0">{isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}</div>
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-4 sm:px-5 py-4 flex flex-col gap-3">
                      {rep.summary && (
                        <p className="text-sm text-gray-600 italic bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">"{rep.summary}"</p>
                      )}
                      {loadingAct === rep.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />Loading visits...
                        </div>
                      ) : repActs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">No visit activities found.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{repActs.length} Visit{repActs.length !== 1 ? "s" : ""}</p>
                          {repActs.map((act) => (
                            <div key={act.id} className="bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 flex items-start gap-3">
                              <TbActivityHeartbeat className={`w-4 h-4 mt-0.5 flex-shrink-0 ${act.visit_type === "NCA" ? "text-amber-500" : act.visit_type === "UNPLANNED" ? "text-sky-500" : "text-[#16a34a]"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-[#1a1a1a]">{act.doctor?.doctor_name ?? "Unknown HCP"}</p>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${VTYPE[act.visit_type] ?? ""}`}>{act.visit_type}</span>
                                </div>
                                {act.doctor && <p className="text-xs text-gray-400 mt-0.5">{[act.doctor.location, act.doctor.town].filter(Boolean).join(" - ") || "-"}</p>}
                                {act.visit_type === "NCA" && act.nca_reason && <p className="text-xs text-amber-700 mt-0.5">Reason: {act.nca_reason}</p>}
                                {act.focused_product && <p className="text-xs text-[#16a34a] mt-0.5">{act.focused_product.product_name}{act.samples_given > 0 ? ` - ${act.samples_given} samples` : ""}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jfw;
