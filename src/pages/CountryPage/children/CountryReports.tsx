import { useEffect, useState } from "react";
import { Column } from "@ant-design/plots";
import {
  LuTrendingUp, LuUsers, LuMapPin, LuFlaskConical,
  LuActivity, LuCalendarCheck, LuTriangleAlert, LuDownload,
} from "react-icons/lu";
import {
  getNationalOverviewApi, getTerritoryCoverageApi, getTierCoverageApi,
  getVisitTrendApi,
} from "../../../services/api";
import DownloadReportWidget from "../../../componets/DownloadReportWidget/DownloadReportWidget";

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "overview" | "territories" | "tiers" | "trend" | "download";

interface Overview {
  month: number; year: number;
  total_reps: number; doctor_visits: number; pharmacy_visits: number;
  total_visits: number; unique_doctors_visited: number;
  samples_given: number; reports_submitted: number; working_days: number;
}
interface TerritoryRow {
  id: string; name: string; territory_type: string;
  rep_count: number; doctor_count: number; pharmacy_count: number;
  doctor_visits: number; pharmacy_visits: number;
  unique_doctors_visited: number; doctor_coverage_pct: number | null;
}
interface TierRow {
  tier: "A" | "B" | "C"; planned: number; done: number;
  actual_visits: number; coverage_pct: number | null;
}
interface TrendPoint {
  date: string; doctor_visits: number; pharmacy_visits: number; total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const FMT_SHORT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const Spinner = () => (
  <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
);

const MonthPicker = ({
  month, year, onMonth, onYear,
}: { month: number; year: number; onMonth: (n: number) => void; onYear: (n: number) => void }) => {
  const thisYear = new Date().getFullYear();
  return (
    <div className="flex items-center gap-2">
      <select value={month} onChange={(e) => onMonth(Number(e.target.value))}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
        {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m.slice(0, 3)}</option>)}
      </select>
      <select value={year} onChange={(e) => onYear(Number(e.target.value))}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-poppins outline-none focus:border-[#16a34a] bg-white">
        {[thisYear - 1, thisYear].map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

const BarInline = ({ value, max, color = "#16a34a" }: { value: number; max: number; color?: string }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.4s" }} />
    </div>
  );
};

// ─── Tab: National Overview ───────────────────────────────────────────────────

const OverviewTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNationalOverviewApi(month, year)
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const submissionRate = data && data.working_days > 0
    ? Math.round((data.reports_submitted / (data.total_reps * data.working_days)) * 100)
    : 0;

  const kpis = data ? [
    { label: "Total Reps",       value: data.total_reps,               Icon: LuUsers,          color: "#16a34a" },
    { label: "Total Visits",     value: data.total_visits,             Icon: LuActivity,       color: "#0284c7" },
    { label: "Doctors Reached",  value: data.unique_doctors_visited,   Icon: LuCalendarCheck,  color: "#7c3aed" },
    { label: "Samples Given",    value: data.samples_given,            Icon: LuFlaskConical,   color: "#d97706" },
  ] : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Company-wide KPIs for the selected month</p>
        <MonthPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner />Loading...</div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-10 text-center text-sm text-gray-400 font-poppins">
          No data for {MONTH_NAMES[month - 1]} {year}
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(({ label, value, Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[10px] font-poppins-semibold uppercase tracking-wider text-gray-400">{label}</span>
                </div>
                <p className="text-3xl font-poppins-extrabold" style={{ color }}>{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Visit split */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-3">
            <p className="text-xs font-poppins-semibold text-gray-600">Visit breakdown</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-poppins text-gray-500 w-28">Doctor visits</span>
                <BarInline value={data.doctor_visits} max={data.total_visits} color="#16a34a" />
                <span className="text-xs font-poppins-bold text-[#1a1a1a] w-10 text-right">{data.doctor_visits}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-poppins text-gray-500 w-28">Pharmacy visits</span>
                <BarInline value={data.pharmacy_visits} max={data.total_visits} color="#7c3aed" />
                <span className="text-xs font-poppins-bold text-[#1a1a1a] w-10 text-right">{data.pharmacy_visits}</span>
              </div>
            </div>
          </div>

          {/* Submission rate */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-poppins-semibold text-gray-600">Report submission rate</p>
              <p className="text-xs font-poppins text-gray-400 mt-0.5">
                {data.reports_submitted} reports submitted across {data.total_reps} reps over {data.working_days} working days
              </p>
            </div>
            <p className={`text-3xl font-poppins-extrabold flex-shrink-0 ${
              submissionRate >= 80 ? "text-[#16a34a]" : submissionRate >= 60 ? "text-amber-600" : "text-red-600"
            }`}>{submissionRate}%</p>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tab: Territory Coverage ──────────────────────────────────────────────────

const TerritoriesTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState<TerritoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTerritoryCoverageApi(month, year)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const maxVisits = data.length > 0 ? Math.max(...data.map((d) => d.doctor_visits + d.pharmacy_visits)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Visit coverage per territory</p>
        <MonthPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner />Loading...</div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-10 text-center text-sm text-gray-400 font-poppins">
          No territories configured for your company
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((t) => {
            const totalVisits = t.doctor_visits + t.pharmacy_visits;
            const covColor = t.doctor_coverage_pct == null ? "#9ca3af"
              : t.doctor_coverage_pct >= 80 ? "#16a34a"
              : t.doctor_coverage_pct >= 50 ? "#d97706"
              : "#dc2626";
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-poppins-semibold text-sm text-[#1a1a1a]">{t.name}</p>
                      <span className={`text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full ${
                        t.territory_type === "TOWN" ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-amber-50 text-amber-700"
                      }`}>{t.territory_type}</span>
                    </div>
                    <p className="text-xs font-poppins text-gray-400 mt-0.5">
                      {t.rep_count} rep{t.rep_count !== 1 ? "s" : ""} · {t.doctor_count} doctors · {t.pharmacy_count} pharmacies
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-poppins-extrabold" style={{ color: covColor }}>
                      {t.doctor_coverage_pct != null ? `${t.doctor_coverage_pct}%` : "—"}
                    </p>
                    <p className="text-[10px] font-poppins text-gray-400">doctor coverage</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-poppins text-gray-400 w-28">Doctor visits</span>
                    <BarInline value={t.doctor_visits} max={maxVisits} color="#16a34a" />
                    <span className="text-xs font-poppins-bold text-[#1a1a1a] w-8 text-right">{t.doctor_visits}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-poppins text-gray-400 w-28">Pharmacy visits</span>
                    <BarInline value={t.pharmacy_visits} max={maxVisits} color="#7c3aed" />
                    <span className="text-xs font-poppins-bold text-[#1a1a1a] w-8 text-right">{t.pharmacy_visits}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-poppins text-gray-400">{totalVisits} total visits</span>
                  <span className="text-xs font-poppins text-[#16a34a]">{t.unique_doctors_visited} unique doctors reached</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Tab: Doctor Tier Coverage ────────────────────────────────────────────────

const TIER_META: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  A: { label: "Tier A",  desc: "High-prescribers / opinion leaders",  color: "#dc2626", bg: "bg-red-50"    },
  B: { label: "Tier B",  desc: "Regular prescribers",                 color: "#d97706", bg: "bg-amber-50"  },
  C: { label: "Tier C",  desc: "Low-volume / emerging contacts",      color: "#0284c7", bg: "bg-sky-50"    },
};

const TiersTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState<TierRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTierCoverageApi(month, year)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Call cycle coverage by doctor tier</p>
        <MonthPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-gray-400 text-sm"><Spinner />Loading...</div>
      ) : data.every((d) => d.planned === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-10 text-center text-sm text-gray-400 font-poppins">
          No call cycle data for {MONTH_NAMES[month - 1]} {year}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((row) => {
            const meta = TIER_META[row.tier];
            const pct  = row.coverage_pct ?? 0;
            const barColor = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
            return (
              <div key={row.tier} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${meta.bg}`}>
                  <div>
                    <p className="font-poppins-bold text-sm" style={{ color: meta.color }}>{meta.label}</p>
                    <p className="text-[11px] font-poppins text-gray-500 mt-0.5">{meta.desc}</p>
                  </div>
                  <p className="text-2xl font-poppins-extrabold" style={{ color: barColor }}>
                    {row.coverage_pct != null ? `${row.coverage_pct}%` : "—"}
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Planned visits", value: row.planned },
                      { label: "Cycle done",     value: row.done    },
                      { label: "Actual visits",  value: row.actual_visits },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl py-2.5">
                        <p className="text-lg font-poppins-bold text-[#1a1a1a]">{value}</p>
                        <p className="text-[10px] font-poppins text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-poppins text-gray-400 mb-0.5">
                      <span>Cycle completion</span>
                      <span>{row.done}/{row.planned}</span>
                    </div>
                    <BarInline value={row.done} max={row.planned} color={barColor} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-[#0f2318] rounded-2xl px-5 py-4">
            <p className="text-white font-poppins-semibold text-xs mb-1">How to read this</p>
            <p className="text-white/60 font-poppins text-xs leading-relaxed">
              "Planned" = total target frequency from active call cycles. "Cycle done" = visits logged against those cycle items.
              "Actual visits" = all visits to tier doctors in the month, including unplanned. Coverage % is based on cycle targets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Visit Trend (reuses same endpoint as Manager) ──────────────────────

const TrendTab = () => {
  type Days = 7 | 30 | 60;
  const [days,    setDays]    = useState<Days>(30);
  const [data,    setData]    = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVisitTrendApi(days)
      .then((r) => setData(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = data.flatMap((d) => [
    { date: FMT_SHORT(d.date), type: "Doctor",   count: d.doctor_visits   },
    { date: FMT_SHORT(d.date), type: "Pharmacy", count: d.pharmacy_visits },
  ]);

  const total   = data.reduce((s, d) => s + d.total, 0);
  const avgDay  = data.length > 0 ? Math.round(total / data.length) : 0;
  const peak    = data.length > 0 ? data.reduce((a, b) => a.total >= b.total ? a : b) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-poppins text-gray-400">Daily visit volume across all reps</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 30, 60] as Days[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-poppins-semibold focus-visible:outline-none ${days === d ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={{ transition: "background-color 0.15s" }}>{d}d</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total visits", value: total },
          { label: "Avg per day",  value: avgDay },
          { label: "Peak day",     value: peak?.total ?? 0, sub: peak ? FMT_SHORT(peak.date) : "—" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xl font-poppins-bold text-[#1a1a1a]">{value}</p>
            <p className="text-[10px] font-poppins text-gray-400">{label}</p>
            {sub && <p className="text-[10px] font-poppins text-[#16a34a]">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center py-14">
            <p className="text-gray-400 font-poppins text-sm">No visit data for this period</p>
          </div>
        ) : (
          <Column
            data={chartData}
            xField="date" yField="count" seriesField="type"
            isStack color={["#16a34a", "#7c3aed"]}
            columnStyle={{ radius: [3, 3, 0, 0] }}
            legend={{ position: "top-right" }}
            xAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af" } } }}
            yAxis={{ label: { style: { fontSize: 10, fill: "#9ca3af" } } }}
            tooltip={{ formatter: (d: any) => ({ name: d.type, value: d.count }) }}
            height={240}
          />
        )}
      </div>
    </div>
  );
};

// ─── Page Shell ───────────────────────────────────────────────────────────────

const MAIN_TABS: { key: MainTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "overview",    label: "Overview",      Icon: LuTrendingUp    },
  { key: "territories", label: "Territories",   Icon: LuMapPin        },
  { key: "tiers",       label: "Tier Coverage", Icon: LuTriangleAlert },
  { key: "trend",       label: "Trend",         Icon: LuActivity      },
  { key: "download",    label: "Download",      Icon: LuDownload      },
];

const CountryReports = () => {
  const [mainTab, setMainTab] = useState<MainTab>("overview");

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Reports</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">National field reports and summaries</p>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {MAIN_TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMainTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-poppins-semibold whitespace-nowrap focus-visible:outline-none flex-shrink-0 ${mainTab === key ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ transition: "background-color 0.15s" }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {mainTab === "overview"    && <OverviewTab />}
      {mainTab === "territories" && <TerritoriesTab />}
      {mainTab === "tiers"       && <TiersTab />}
      {mainTab === "trend"       && <TrendTab />}
      {mainTab === "download"    && <DownloadReportWidget roles={["MedicalRep", "Supervisor", "Manager"]} />}
    </div>
  );
};

export default CountryReports;
