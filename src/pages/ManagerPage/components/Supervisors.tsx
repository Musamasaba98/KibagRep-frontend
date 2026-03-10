import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { getCompanyFeedApi } from "../../../services/api";

interface SupervisorRow {
  id: string;
  name: string;
  visits: number;
  samples: number;
}

const Supervisors = () => {
  const [supervisors, setSupervisors] = useState<SupervisorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getCompanyFeedApi({ days: 30 })
      .then((res) => {
        const summary: any[] = res.data?.summary ?? [];
        const sups: SupervisorRow[] = summary
          .filter((s) => s.user?.role === "Supervisor")
          .map((s) => ({
            id: s.user.id,
            name: `${s.user.firstname} ${s.user.lastname}`,
            visits: s.visits ?? 0,
            samples: s.samples ?? 0,
          }))
          .sort((a, b) => b.visits - a.visits);
        setSupervisors(sups);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = supervisors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Compute a relative performance score (% of top performer's visits, floored at 1)
  const maxVisits = Math.max(...supervisors.map((s) => s.visits), 1);
  const perfPct = (visits: number) => Math.round((visits / maxVisits) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-gray-100 border border-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Supervisor Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${supervisors.length} supervisor${supervisors.length !== 1 ? "s" : ""} — last 30 days`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20 transition-colors">
          <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-40"
            placeholder="Find supervisor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            <span className="text-sm">Loading supervisors…</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            {supervisors.length === 0 ? "No supervisor activity in the last 30 days." : "No supervisors found."}
          </p>
        ) : (
          filtered.map((sup) => {
            const pct = perfPct(sup.visits);
            const isGood = pct >= 85;
            const isMid  = pct >= 60;
            const barColor = isGood ? "#16a34a" : isMid ? "#f59e0b" : "#ef4444";
            const TrendIcon = pct >= 60 ? LuTrendingUp : LuTrendingDown;
            const trendColor = pct >= 60 ? "text-[#16a34a]" : "text-red-500";

            return (
              <div
                key={sup.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                  <span className="text-[#16a34a] font-black text-xs">
                    {sup.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a1a1a] text-sm truncate">{sup.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sup.visits} visits · {sup.samples} samples given
                  </p>
                </div>

                {/* Performance bar */}
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
          })
        )}
      </div>
    </div>
  );
};

export default Supervisors;
