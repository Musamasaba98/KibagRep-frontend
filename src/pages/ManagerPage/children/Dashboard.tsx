import { useEffect, useState } from "react";
import { MdCampaign } from "react-icons/md";
import IndicatorCards from "../components/IndicatorCards";
import RecentReports from "../components/RecentReports";
import Supervisors from "../components/Supervisors";
import VisitsTrendCont from "../components/VisitsTrendCont";
import { getCompanyFeedApi } from "../../../services/api";

// ─── Campaign Detailing Coverage ──────────────────────────────────────────────

interface ProductRow {
  product_name: string;
  rep_count: number;
  detail_count: number;
}

interface RepIdSet {
  product_name: string;
  rep_ids: Set<string>;
  detail_count: number;
}

const CampaignDetailingSection = ({ totalReps }: { totalReps: number }) => {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyFeedApi({ days: 7 })
      .then((res) => {
        const summary: any[] = res.data?.summary ?? [];
        const map = new Map<string, RepIdSet>();

        summary.forEach((s) => {
          const userId: string = s.user?.id;
          const activities: any[] = s.activities ?? [];
          activities.forEach((a) => {
            const name: string = a.focused_product?.product_name ?? "Unknown";
            if (name === "Unknown") return;
            if (!map.has(name)) {
              map.set(name, { product_name: name, rep_ids: new Set(), detail_count: 0 });
            }
            const row = map.get(name)!;
            row.rep_ids.add(userId);
            row.detail_count += 1;
          });
        });

        const sorted = Array.from(map.values())
          .sort((a, b) => b.rep_ids.size - a.rep_ids.size)
          .map((r) => ({ product_name: r.product_name, rep_count: r.rep_ids.size, detail_count: r.detail_count }));

        setRows(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = Math.max(totalReps, 1);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Campaign Detailing Coverage</h2>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">Which reps pushed each product this week</p>
        </div>
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Campaign Detailing Coverage</h2>
          <p className="text-xs font-poppins text-gray-400 mt-0.5">Which reps pushed each product this week</p>
        </div>
        <span className="text-xs font-poppins-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">Last 7 days</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400">
          <MdCampaign className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm font-poppins">No detailing activity recorded this week</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {rows.map(({ product_name, rep_count, detail_count }) => {
            const pct = Math.round((rep_count / total) * 100);
            const barColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div key={product_name} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-poppins-semibold text-[#1a1a1a] truncate flex-1 mr-4">{product_name}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-poppins text-gray-400">{detail_count} detailing{detail_count !== 1 ? "s" : ""}</span>
                    <span className="text-sm font-poppins-bold" style={{ color: barColor }}>
                      {rep_count}/{total} reps
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.4s ease" }}
                    />
                  </div>
                  <span className="text-xs font-poppins-semibold text-gray-500 w-9 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  // We share the rep count from the feed so CampaignDetailingSection knows the denominator
  const [repCount, setRepCount] = useState(0);

  useEffect(() => {
    getCompanyFeedApi({ days: 30 })
      .then((res) => {
        const summary: any[] = res.data?.summary ?? [];
        setRepCount(summary.filter((s) => s.user?.role === "MedicalRep").length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full p-6 space-y-6">
      <div>
        <h1 className="font-poppins-extrabold text-2xl text-[#1a1a1a] tracking-tight">Manager Dashboard</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Team performance overview and pending approvals</p>
      </div>
      <IndicatorCards />
      <VisitsTrendCont />
      <CampaignDetailingSection totalReps={repCount} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Supervisors />
      <RecentReports />
      </div>
    </div>
  );
};

export default Dashboard;
