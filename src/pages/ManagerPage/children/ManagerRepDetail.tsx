import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { LuArrowLeft, LuFileText, LuCircleCheck, LuDownload } from "react-icons/lu";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { MdOutlineGpsOff, MdOutlineHistory, MdOutlineWarningAmber } from "react-icons/md";
import { BsDroplet } from "react-icons/bs";
import { IoCalendarOutline } from "react-icons/io5";
import { TbActivityHeartbeat } from "react-icons/tb";
import { getTeamPerformanceApi, getCompanyFeedApi, getCompanyReportsApi, downloadReportApi } from "../../../services/api";

interface TeamPerf {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_visits_done: number;
  cycle_total_target: number;
  cycle_adherence_pct: number | null;
  last_visit_date: string | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
  pending_expenses: number;
}

interface Activity {
  id: string;
  date: string;
  samples_given: number;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  user: { id: string; firstname: string; lastname: string; role: string };
  doctor: { id: string; doctor_name: string; speciality?: string[]; town: string };
  focused_product: { id: string; product_name: string } | null;
}

interface Report {
  id: string;
  report_date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  visits_count: number;
  samples_count: number;
  user: { id: string; firstname: string; lastname: string; role: string };
}

const STATUS_CHIP: Record<string, string> = {
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED:  "bg-[#f0fdf4] text-[#16a34a]",
  REJECTED:  "bg-red-50 text-red-600",
  DRAFT:     "bg-gray-100 text-gray-500",
};

const ManagerRepDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [perf, setPerf] = useState<TeamPerf | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const now = new Date();
  const [dlMonth, setDlMonth] = useState(now.getMonth() + 1);
  const [dlYear, setDlYear]   = useState(now.getFullYear());
  const [dlLoading, setDlLoading] = useState(false);

  const handleDownload = async () => {
    if (!id) return;
    setDlLoading(true);
    try {
      const res = await downloadReportApi(dlMonth, dlYear, id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${repName.replace(/\s+/g, "-")}-${dlYear}-${String(dlMonth).padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No report data found for that period.");
    } finally {
      setDlLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([
      getTeamPerformanceApi(),
      getCompanyFeedApi({ days: 30 }),
      getCompanyReportsApi("days=30&status=SUBMITTED,APPROVED,REJECTED"),
    ]).then(([perfRes, feedRes, reportsRes]) => {
      if (perfRes.status === "fulfilled") {
        const found = (perfRes.value.data?.data ?? []).find((r: TeamPerf) => r.user.id === id);
        setPerf(found ?? null);
      } else {
        setError("Could not load performance data.");
      }
      if (feedRes.status === "fulfilled") {
        const all: Activity[] = feedRes.value.data?.data ?? [];
        setActivities(
          all
            .filter((a) => a.user.id === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      }
      if (reportsRes.status === "fulfilled") {
        const all: Report[] = reportsRes.value.data?.data ?? [];
        setReports(
          all
            .filter((r) => r.user.id === id)
            .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())
        );
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const pct = perf?.cycle_adherence_pct ?? 0;
  const repName = perf ? `${perf.user.firstname} ${perf.user.lastname}` : "Rep";
  const initials = perf
    ? `${perf.user.firstname.charAt(0)}${perf.user.lastname.charAt(0)}`
    : "?";

  const daysSince = perf?.days_since_last_visit ?? null;
  const lastSeenLabel =
    daysSince === null  ? "Never visited"
    : daysSince === 0  ? "Active today"
    : daysSince === 1  ? "Last visit yesterday"
    : `Last visit ${daysSince}d ago`;
  const lastSeenColor =
    daysSince === null  ? "text-red-500"
    : daysSince === 0  ? "text-[#16a34a]"
    : daysSince <= 2   ? "text-gray-600"
    : "text-red-500";

  const kpis = perf
    ? [
        { label: "Today",        value: perf.visits_today,      icon: MdOutlineHistory,  color: "from-sky-500 to-sky-600",           shadow: "shadow-sky-100"     },
        { label: "This Week",    value: perf.visits_this_week,  icon: FaArrowTrendUp,    color: "from-[#16a34a] to-[#15803d]",       shadow: "shadow-green-200"   },
        { label: "This Month",   value: perf.visits_this_month, icon: IoCalendarOutline, color: "from-violet-500 to-violet-600",     shadow: "shadow-violet-100"  },
        {
          label: "Samples Given",
          value: activities.reduce((s, a) => s + (a.samples_given ?? 0), 0),
          icon: BsDroplet,
          color: "from-amber-500 to-amber-600",
          shadow: "shadow-amber-100",
        },
        {
          label: "GPS Flags",
          value: perf.gps_anomaly_count_week,
          icon: MdOutlineGpsOff,
          color: perf.gps_anomaly_count_week > 0 ? "from-red-500 to-red-600" : "from-gray-400 to-gray-500",
          shadow: perf.gps_anomaly_count_week > 0 ? "shadow-red-100" : "shadow-gray-100",
        },
      ]
    : [];

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Back nav */}
      <button
        onClick={() => navigate("/manager/analytics")}
        className="flex items-center font-poppins gap-2 text-sm text-gray-500 hover:text-[#16a34a] w-fit focus-visible:outline-none"
        style={{ transition: "color 0.15s" }}
      >
        <LuArrowLeft className="w-4 h-4" />
        Back to Analytics
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#16a34a] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      ) : (
        <>
          {/* Rep header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shadow-lg shadow-green-200 flex-shrink-0">
              <span className="text-white font-poppins-bold text-xl">{initials}</span>
            </div>
            <div>
              <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">{repName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs font-poppins text-gray-400">Medical Rep</span>
                <span className={`text-xs font-poppins-semibold ${lastSeenColor}`}>{lastSeenLabel}</span>
                {perf && perf.pending_reports > 0 && (
                  <span className="text-[11px] font-poppins-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {perf.pending_reports} report{perf.pending_reports > 1 ? "s" : ""} pending
                  </span>
                )}
                {perf && perf.gps_anomaly_count_week > 0 && (
                  <span className="text-[11px] font-poppins-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                    <MdOutlineGpsOff className="w-3 h-3" />
                    {perf.gps_anomaly_count_week} GPS flag{perf.gps_anomaly_count_week > 1 ? "s" : ""} this week
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Report download */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] px-5 py-4 flex items-center gap-3 flex-wrap">
            <LuDownload className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-poppins-semibold text-[#1a1a1a] mr-auto">Download monthly report</span>
            <select
              value={dlMonth}
              onChange={(e) => setDlMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] bg-white"
            >
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={dlYear}
              onChange={(e) => setDlYear(Number(e.target.value))}
              min={2024}
              max={now.getFullYear()}
              className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a]"
            />
            <button
              onClick={handleDownload}
              disabled={dlLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#16a34a] text-white text-sm font-poppins-semibold rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
            >
              <LuDownload className="w-3.5 h-3.5" />
              {dlLoading ? "Generating…" : "Download"}
            </button>
          </div>

          {/* KPI cards */}
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {kpis.map(({ label, value, icon: Icon, color, shadow }) => (
                <div
                  key={label}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-4 shadow-lg ${shadow}`}
                >
                  <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-poppins-extrabold text-white text-2xl leading-none">{value}</p>
                    <p className="text-white/80 font-poppins text-xs mt-1">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cycle adherence */}
          {perf && perf.cycle_total_target > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Call Cycle Adherence</h2>
                  <p className="text-xs font-poppins text-gray-400 mt-0.5">
                    {perf.cycle_visits_done} of {perf.cycle_total_target} target visits this month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pct >= 70
                    ? <FaArrowTrendUp className="w-4 h-4 text-[#16a34a]" />
                    : <FaArrowTrendDown className="w-4 h-4 text-red-500" />}
                  <span className={`text-2xl font-poppins-extrabold ${pct >= 70 ? "text-[#16a34a]" : pct >= 40 ? "text-amber-500" : "text-red-500"}`}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct >= 70 ? "bg-[#16a34a]" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${Math.min(100, pct)}%`, transition: "width 0.5s ease" }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Visit activity — 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <TbActivityHeartbeat className="w-5 h-5 text-[#16a34a]" />
                <div className="flex-1">
                  <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Visit Activity</h2>
                  <p className="text-xs text-poppins text-gray-400">Last 30 days · {activities.length} visits</p>
                </div>
              </div>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <LuCircleCheck className="w-10 h-10 text-gray-200 mb-3"/>
                  <p className="text-gray-400 text-sm font-poppins-semibold">No visits in the last 30 days</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                  {activities.slice(0, 30).map((act) => (
                    <div key={act.id} className="flex items-start gap-3 px-5 py-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          act.nca_reason ? "bg-amber-50" : act.gps_anomaly ? "bg-red-50" : "bg-[#f0fdf4]"
                        }`}
                      >
                        <TbActivityHeartbeat
                          className={`w-3.5 h-3.5 ${
                            act.nca_reason ? "text-amber-500" : act.gps_anomaly ? "text-red-500" : "text-[#16a34a]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{act.doctor.doctor_name}</p>
                          {act.gps_anomaly && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                              <MdOutlineGpsOff className="w-2.5 h-2.5" /> GPS
                            </span>
                          )}
                          {act.nca_reason && (
                            <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              NCA
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-poppins text-gray-400 mt-0.5">
                          {act.doctor.town}
                          {act.focused_product && (
                            <> · <span className="text-[#16a34a] font-poppins-bold">{act.focused_product.product_name}</span></>
                          )}
                          {act.samples_given > 0 && <> · {act.samples_given} samples</>}
                          {act.nca_reason && <> · <span className="text-amber-600">{act.nca_reason}</span></>}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-poppins flex-shrink-0 whitespace-nowrap">
                        {format(new Date(act.date), "MMM d, HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reports sidebar */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <LuFileText className="w-5 h-5 text-gray-500" />
                <div>
                  <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Daily Reports</h2>
                  <p className="text-xs font-poppins text-gray-400">Last 30 days</p>
                </div>
              </div>
              {reports.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <p className="text-gray-400 font-poppins text-sm">No reports found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-poppins-semibold text-[#1a1a1a]">
                          {format(new Date(r.report_date), "EEE d MMM")}
                        </p>
                        <p className="text-xs font-poppins text-gray-400 mt-0.5">
                          {r.visits_count} visits · {r.samples_count} samples
                        </p>
                      </div>
                      <span className={`text-[11px] font-poppins-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CHIP[r.status] ?? STATUS_CHIP.DRAFT}`}>
                        {r.status === "SUBMITTED" ? "Pending" : r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerRepDetail;
