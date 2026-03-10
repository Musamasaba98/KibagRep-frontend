import { useEffect, useState } from "react";
import { Line } from "@ant-design/plots";
import { getCompanyFeedApi } from "../../../services/api";
import { format, subDays, startOfDay } from "date-fns";

interface TrendPoint { date: string; value: number; type: string; }
interface ProductStat { name: string; count: number; pct: number; }

const PRODUCT_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444"];

const VisitsTrendCont = () => {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyFeedApi({ days: 14 })
      .then((res) => {
        const activities: any[] = res.data?.data ?? [];

        // Build a 14-day count map
        const counts: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
          const d = format(subDays(new Date(), i), "MMM d");
          counts[d] = 0;
        }
        activities.forEach((a) => {
          const d = format(startOfDay(new Date(a.date)), "MMM d");
          if (d in counts) counts[d]++;
        });
        const points: TrendPoint[] = Object.entries(counts).map(([date, value]) => ({
          date,
          value,
          type: "Team Visits",
        }));
        setTrendData(points);

        // Derive product performance from activities
        const productCounts: Record<string, number> = {};
        activities.forEach((a: any) => {
          const name = a.focused_product?.product_name;
          if (name) productCounts[name] = (productCounts[name] ?? 0) + 1;
        });
        const totalActivities = activities.length;
        const computed = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            pct: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0,
          }));
        setTopProducts(computed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const config = {
    data: trendData,
    xField: "date",
    yField: "value",
    seriesField: "type",
    smooth: true,
    height: 260,
    color: ["#16a34a"],
    point: { size: 4, shape: "circle", style: { fill: "#16a34a", stroke: "#fff", lineWidth: 2 } },
    line: { style: { lineWidth: 2.5 } },
    area: { style: { fill: "l(270) 0:rgba(22,163,74,0) 1:rgba(22,163,74,0.12)" } },
    legend: false,
    yAxis: { grid: { line: { style: { stroke: "#f3f4f6", lineWidth: 1 } } }, label: { style: { fill: "#9ca3af", fontSize: 11 } } },
    xAxis: { label: { style: { fill: "#9ca3af", fontSize: 11 } } },
    tooltip: { showMarkers: true },
    padding: [16, 24, 32, 40],
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-gray-50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Team Visit Trend</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 14 days across all reps</p>
        </div>
        <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-full border border-[#dcfce7]">
          Live data
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[260px]">
          <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-green-500 animate-spin" />
        </div>
      ) : (
        <Line {...config} />
      )}

      {/* ── Product Detailing Mix ── */}
      {!loading && topProducts.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-[#1a1a1a] text-[13px]">Product Detailing Mix</p>
            <p className="text-xs text-gray-400 mt-0.5">Top products detailed — last 14 days</p>
          </div>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-[#1a1a1a] truncate max-w-[55%]">{p.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{p.count} visits</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: PRODUCT_COLORS[i] }}
                    >
                      {p.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${p.pct}%`,
                      backgroundColor: PRODUCT_COLORS[i],
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsTrendCont;
