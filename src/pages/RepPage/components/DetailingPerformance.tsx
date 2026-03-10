import { useEffect, useState } from "react";
import Bargraph from "../../../componets/Bargraph/Bargraph";
import Dognutpie from "../../../componets/Dognutpie/Dognutpie";
import { getActivityHistoryApi } from "../../../services/api";

interface ChartItem {
  brand: string;
  sales: number;
}

const DetailingPerformance = () => {
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityHistoryApi({ days: 30, limit: 200 })
      .then((res) => {
        const activities: any[] = res.data?.data ?? res.data ?? [];
        // Count detailing visits per focused product (exclude NCAs)
        const counts: Record<string, number> = {};
        activities.forEach((a) => {
          if (a.nca_reason) return; // skip NCAs
          const name = a.focused_product?.product_name;
          if (name) counts[name] = (counts[name] ?? 0) + 1;
        });
        const data = Object.entries(counts)
          .map(([brand, sales]) => ({ brand, sales }))
          .sort((a, b) => b.sales - a.sales);
        setChartData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-xl tracking-tight text-[#222f36]">Detailing performance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Product-level activity this month</p>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          Last 30 days
        </span>
      </div>

      <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.1)] p-5 transition-shadow">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Visit distribution
          </p>
          <div className="h-[280px] flex items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-[#16a34a] animate-spin" />
            ) : (
              <Dognutpie data={chartData} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.1)] p-5 transition-shadow">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Detailing by product
          </p>
          <div className="h-[280px] flex items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-[#16a34a] animate-spin" />
            ) : (
              <Bargraph data={chartData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailingPerformance;
