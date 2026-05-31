import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { MdOutlineGpsOff } from "react-icons/md";
import { getTeamPerformanceApi } from "../../../services/api";

interface RepRow {
  id: string;
  name: string;
  visits_this_month: number;
  cycle_adherence_pct: number | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
}

const Reps = () => {
  const navigate = useNavigate();
  const [reps, setReps] = useState<RepRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamPerformanceApi()
      .then((res) => {
        const data: any[] = res.data?.data ?? [];
        setReps(
          data
            .map((r) => ({
              id: r.user.id,
              name: `${r.user.firstname} ${r.user.lastname}`,
              visits_this_month: r.visits_this_month ?? 0,
              cycle_adherence_pct: r.cycle_adherence_pct ?? null,
              days_since_last_visit: r.days_since_last_visit ?? null,
              gps_anomaly_count_week: r.gps_anomaly_count_week ?? 0,
            }))
            .sort((a, b) => (b.cycle_adherence_pct ?? -1) - (a.cycle_adherence_pct ?? -1))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl tracking-tight">My Reps</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">
          {loading ? "Loading…" : `${reps.length} rep${reps.length !== 1 ? "s" : ""} — current month`}
        </p>
      </div>

      <div className="bg-white rounded-md border border-gray-100">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            <span className="text-sm font-poppins">Loading reps…</span>
          </div>
        ) : reps.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FaUserGroup className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-poppins-semibold">No reps found in your company</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reps.map((rep) => {
              const pct = rep.cycle_adherence_pct ?? 0;
              const hasNoCycle = rep.cycle_adherence_pct === null;
              const isGood = pct >= 70;
              const isMid  = pct >= 40;
              const barColor = hasNoCycle ? "#d1d5db" : isGood ? "#16a34a" : isMid ? "#f59e0b" : "#ef4444";
              const TrendIcon = isGood ? LuTrendingUp : LuTrendingDown;
              const trendColor = isGood ? "text-[#16a34a]" : isMid ? "text-amber-500" : "text-red-500";

              const lastSeenLabel =
                rep.days_since_last_visit === null ? "Never"
                : rep.days_since_last_visit === 0   ? "Today"
                : rep.days_since_last_visit === 1   ? "Yesterday"
                : `${rep.days_since_last_visit}d ago`;

              const lastSeenColor =
                rep.days_since_last_visit === null ? "text-red-400"
                : rep.days_since_last_visit === 0   ? "text-[#16a34a]"
                : rep.days_since_last_visit <= 2    ? "text-gray-500"
                : "text-red-400";

              return (
                <div
                  key={rep.id}
                  onClick={() => navigate(`/supervisor/reps/${rep.id}`)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 cursor-pointer"
                  style={{ transition: "background-color 0.15s" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-poppins-bold text-xs">
                      {rep.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-poppins-semibold text-[#1a1a1a] text-sm truncate">{rep.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-poppins text-gray-400">
                        {rep.visits_this_month} visits MTD
                      </span>
                      <span className={`text-xs font-poppins-semibold ${lastSeenColor}`}>
                        · {lastSeenLabel}
                      </span>
                      {rep.gps_anomaly_count_week > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                          <MdOutlineGpsOff className="w-3 h-3" />
                          {rep.gps_anomaly_count_week}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor, transition: "width 0.4s ease" }}
                      />
                    </div>
                    <div className="flex items-center gap-1 w-16 justify-end">
                      {!hasNoCycle && <TrendIcon className={`w-3.5 h-3.5 shrink-0 ${trendColor}`} />}
                      <span className={`text-sm font-poppins-bold ${hasNoCycle ? "text-gray-300" : "text-gray-700"}`}>
                        {hasNoCycle ? "—" : `${pct}%`}
                      </span>
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
