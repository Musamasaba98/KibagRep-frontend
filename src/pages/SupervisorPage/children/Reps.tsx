import { useEffect, useState } from "react";
import { FaUserGroup } from "react-icons/fa6";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { getCompanyFeedApi } from "../../../services/api";

interface RepRow {
  id: string;
  name: string;
  visits: number;
  samples: number;
}

const Reps = () => {
  const [reps, setReps] = useState<RepRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyFeedApi({ days: 30 })
      .then((res) => {
        const summary: any[] = res.data?.summary ?? [];
        setReps(
          summary
            .filter((s) => s.user?.role === "MedicalRep")
            .map((s) => ({
              id: s.user.id,
              name: `${s.user.firstname} ${s.user.lastname}`,
              visits: s.visits ?? 0,
              samples: s.samples ?? 0,
            }))
            .sort((a, b) => b.visits - a.visits)
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxVisits = Math.max(...reps.map((r) => r.visits), 1);

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">My Reps</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {loading ? "Loading…" : `${reps.length} rep${reps.length !== 1 ? "s" : ""} — last 30 days`}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            <span className="text-sm">Loading reps…</span>
          </div>
        ) : reps.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FaUserGroup className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold">No rep activity in the last 30 days</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reps.map((rep) => {
              const pct = Math.round((rep.visits / maxVisits) * 100);
              const isGood = pct >= 85;
              const isMid = pct >= 60;
              const barColor = isGood ? "#16a34a" : isMid ? "#f59e0b" : "#ef4444";
              const TrendIcon = pct >= 60 ? LuTrendingUp : LuTrendingDown;
              const trendColor = pct >= 60 ? "text-[#16a34a]" : "text-red-500";

              return (
                <div key={rep.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-black text-xs">
                      {rep.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm truncate">{rep.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rep.visits} visits · {rep.samples} samples given
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.4s ease" }}
                      />
                    </div>
                    <div className="flex items-center gap-1 w-14 justify-end">
                      <TrendIcon className={`w-3.5 h-3.5 shrink-0 ${trendColor}`} />
                      <span className="text-sm font-bold text-gray-700">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reps;
