import { useEffect, useState, useMemo } from "react";
import { Pie } from "@ant-design/plots";
import { format, subDays } from "date-fns";
import { getActivityHistoryApi, getPharmacyActivityHistoryApi } from "../../../services/api";

// Defaults — supervisor can override these in future
const DR_TARGET  = 15;
const PH_TARGET  = 5;

const BRAND_COLORS = [
  "#16a34a", "#0d9488", "#0284c7", "#7c3aed",
  "#d97706", "#db2777", "#dc2626", "#4f46e5",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayBar {
  label: string;   // "Mon", "Tue" …
  dateStr: string; // "2026-06-06"
  isToday: boolean;
  isSunday: boolean;
  dr: number;      // clinician visits
  ph: number;      // pharmacy visits
}

// ─── Trend sparkline (pure CSS — no chart lib) ───────────────────────────────

const Sparkline = ({ days }: { days: DayBar[] }) => {
  const maxDr = Math.max(...days.map(d => d.dr), DR_TARGET, 1);

  const barColor = (day: DayBar) => {
    if (day.dr === 0) return "#f3f4f6";
    if (day.isToday) return "#16a34a";
    if (day.dr >= DR_TARGET) return "#4ade80";
    if (day.dr >= DR_TARGET * 0.6) return "#fbbf24";
    return "#fca5a5";
  };

  const targetPct = Math.min((DR_TARGET / maxDr) * 100, 100);

  return (
    <div className="flex flex-col gap-0">
      {/* Chart area */}
      <div className="relative h-24">
        {/* Target dashed line */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{ bottom: `${targetPct}%` }}
        >
          <div className="w-full border-t border-dashed border-[#16a34a]/40" />
          <span className="absolute right-0 -top-3.5 text-[9px] font-bold text-[#16a34a]/60 pr-0.5">
            {DR_TARGET}
          </span>
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-[2px] px-0.5">
          {days.map((day, i) => {
            const heightPct = maxDr > 0 ? Math.max((day.dr / maxDr) * 100, day.dr > 0 ? 4 : 2) : 2;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                  {day.dr} visits{day.ph > 0 ? ` · ${day.ph} pharm` : ""}
                </div>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: barColor(day),
                    opacity: day.isSunday ? 0.4 : 1,
                    transition: "height 0.3s ease",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Day labels */}
      <div className="flex gap-[2px] px-0.5 mt-1">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            <span className={`text-[9px] font-bold leading-none ${
              day.isToday ? "text-[#16a34a]" : "text-gray-300"
            }`}>
              {day.label[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const DetailingPerformance = () => {
  const [drActivities,  setDrActivities]  = useState<any[]>([]);
  const [phActivities,  setPhActivities]  = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getActivityHistoryApi({ days: 14, limit: 500 }),
      getPharmacyActivityHistoryApi({ days: 14, limit: 200 }),
    ]).then(([drRes, phRes]) => {
      if (drRes.status === "fulfilled") setDrActivities(drRes.value.data?.data ?? []);
      if (phRes.status === "fulfilled") setPhActivities(phRes.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Build 14-day trend data ──────────────────────────────────────────────────
  const trendDays = useMemo<DayBar[]>(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const date    = subDays(today, 13 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isToday = i === 13;
      const isSunday = date.getDay() === 0;

      const dr = drActivities.filter(a =>
        !a.nca_reason && format(new Date(a.date), "yyyy-MM-dd") === dateStr
      ).length;

      const ph = phActivities.filter(a =>
        format(new Date(a.date), "yyyy-MM-dd") === dateStr
      ).length;

      return {
        label:   format(date, "EEE"),
        dateStr,
        isToday,
        isSunday,
        dr,
        ph,
      };
    });
  }, [drActivities, phActivities]);

  // ── Trend stats ──────────────────────────────────────────────────────────────
  const workDays    = trendDays.filter(d => !d.isSunday);
  const sevenDay    = workDays.slice(-7);
  const avgDr7      = sevenDay.length ? Math.round(sevenDay.reduce((s, d) => s + d.dr, 0) / sevenDay.length) : 0;
  const avgPh7      = sevenDay.length ? Math.round(sevenDay.reduce((s, d) => s + d.ph, 0) / sevenDay.length) : 0;
  const daysOnTarget = workDays.filter(d => d.dr >= DR_TARGET).length;
  const todayDr     = trendDays[13]?.dr ?? 0;
  const todayPh     = trendDays[13]?.ph ?? 0;

  // ── Product mix (last 14 days, doctor visits only) ───────────────────────────
  const productData = useMemo(() => {
    const counts: Record<string, number> = {};
    drActivities.forEach(a => {
      if (a.nca_reason) return;
      const name = a.focused_product?.product_name;
      if (name) counts[name] = (counts[name] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        brand: name,
        sales: count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
  }, [drActivities]);

  const totalVisits = productData.reduce((s, p) => s + p.sales, 0);
  const leadProduct = productData[0];

  // ── Donut config ──────────────────────────────────────────────────────────────
  const pieConfig = {
    data:         productData.map(p => ({ brand: p.brand, sales: p.sales })),
    angleField:   "sales",
    colorField:   "brand",
    innerRadius:  0.72,
    radius:       1,
    legend:       false as const,
    scale:        { color: { range: BRAND_COLORS } },
    annotations: [
      {
        type: "text",
        style: {
          text:       totalVisits > 0 ? String(totalVisits) : "—",
          x:          "50%",
          y:          "44%",
          textAlign:  "center",
          fontSize:   22,
          fontFamily: "poppins",
          fontWeight: "bold",
          fill:       "#1a2530",
        },
      },
      {
        type: "text",
        style: {
          text:       "visits",
          x:          "50%",
          y:          "58%",
          textAlign:  "center",
          fontSize:   10,
          fontFamily: "poppins",
          fill:       "#9ca3af",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-poppins-bold text-lg tracking-tight text-[#1a2530]">Activity Trends</h2>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">Last 14 days</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-poppins-semibold text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] inline-block" /> On target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Below
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Daily Clinician Visits ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest">Daily Clinician Visits</p>
              <p className="text-[10px] font-poppins text-gray-300 mt-0.5">Target: {DR_TARGET} / day</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-poppins-extrabold leading-none ${todayDr >= DR_TARGET ? "text-[#16a34a]" : todayDr >= DR_TARGET * 0.6 ? "text-amber-500" : "text-gray-600"}`}>
                {loading ? "—" : todayDr}
              </p>
              <p className="text-[10px] font-poppins text-gray-400">today</p>
            </div>
          </div>

          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
            </div>
          ) : (
            <Sparkline days={trendDays} />
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-50">
            <div>
              <p className="text-sm font-poppins-bold text-[#1a2530]">{loading ? "—" : avgDr7}</p>
              <p className="text-[10px] font-poppins text-gray-400 leading-tight">7-day avg<br />clinicians</p>
            </div>
            <div>
              <p className={`text-sm font-poppins-bold ${daysOnTarget >= 7 ? "text-[#16a34a]" : daysOnTarget >= 4 ? "text-amber-500" : "text-gray-500"}`}>
                {loading ? "—" : `${daysOnTarget}/${workDays.length}`}
              </p>
              <p className="text-[10px] font-poppins text-gray-400 leading-tight">days<br />on target</p>
            </div>
            <div>
              <p className="text-sm font-poppins-bold text-sky-600">{loading ? "—" : todayPh}</p>
              <p className="text-[10px] font-poppins text-gray-400 leading-tight">pharmacy<br />today <span className="text-gray-300">(tgt {PH_TARGET})</span></p>
            </div>
          </div>

          {/* Progress bar: days on target */}
          {!loading && workDays.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-poppins text-gray-400">
                <span>Days hitting {DR_TARGET}+ visits</span>
                <span className="font-poppins-semibold">{Math.round((daysOnTarget / workDays.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((daysOnTarget / workDays.length) * 100)}%`,
                    backgroundColor: daysOnTarget / workDays.length >= 0.7 ? "#16a34a" : daysOnTarget / workDays.length >= 0.4 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Context sentence */}
          {!loading && (
            <p className="text-[11px] font-poppins text-gray-400 leading-relaxed">
              {avgDr7 >= DR_TARGET
                ? `Averaging ${avgDr7} visits/day over 7 days — above target. Keep it up.`
                : avgDr7 >= DR_TARGET * 0.7
                ? `Averaging ${avgDr7}/day — ${DR_TARGET - avgDr7} short of the ${DR_TARGET}/day target.`
                : `7-day average of ${avgDr7} is well below target. ${DR_TARGET - avgDr7} more visits/day needed.`
              }
              {avgPh7 > 0 && ` Pharmacy avg: ${avgPh7}/day.`}
            </p>
          )}
        </div>

        {/* ── Product Focus ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest">Product Focus</p>
              <p className="text-[10px] font-poppins text-gray-300 mt-0.5">Visits by product, last 14 days</p>
            </div>
            {leadProduct && !loading && (
              <span className="text-[10px] font-poppins-semibold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                #{1} {leadProduct.brand.split(" ")[0]}
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
            </div>
          ) : productData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <p className="text-sm font-poppins-semibold">No detailing data yet</p>
              <p className="text-xs font-poppins mt-1">Log visits with a focused product to see the mix</p>
            </div>
          ) : (
            <>
              {/* Donut */}
              <div className="h-44">
                <Pie {...pieConfig} />
              </div>

              {/* Ranked product legend */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
                {productData.slice(0, 5).map((p, i) => (
                  <div key={p.brand} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-poppins text-gray-600 flex-1 truncate">{p.brand}</span>
                    <span className="text-xs font-poppins-semibold text-gray-500 shrink-0">{p.sales}</span>
                    <span
                      className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color + "18", color: p.color }}>
                      {p.pct}%
                    </span>
                  </div>
                ))}
                {productData.length > 5 && (
                  <p className="text-[10px] font-poppins text-gray-300 text-center">
                    +{productData.length - 5} more products
                  </p>
                )}
              </div>
            </>
          )}

          {/* Context sentence */}
          {!loading && leadProduct && (
            <p className="text-[11px] font-poppins text-gray-400 leading-relaxed">
              {leadProduct.brand} leads with {leadProduct.pct}% of your {totalVisits} visits this period.
              {productData.length > 1 && ` ${productData[1].brand} is second at ${productData[1].pct}%.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailingPerformance;
