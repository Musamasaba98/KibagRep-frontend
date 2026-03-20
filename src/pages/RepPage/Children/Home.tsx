import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { FiPackage, FiCalendar, FiTrendingUp, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { MdOutlineEventRepeat } from 'react-icons/md';
import { BsPersonX } from 'react-icons/bs';
import { useActivityData, KpiCards } from '../components/ActivityCards';
import DetailingPerformance from '../components/DetailingPerformance';
import SmartOverview from '../components/SmartOverview';
import { getActivityHistoryApi, getCurrentCycleApi, getBacklogApi, getMtdStatsApi } from '../../../services/api';

// ─── Monthly Progress panel ────────────────────────────────────────────────────

const MonthlyProgress = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [cycle, setCycle]           = useState<any>(null);
  const [mtd, setMtd]               = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const now = new Date();

  useEffect(() => {
    Promise.all([
      getActivityHistoryApi('days=31&limit=1000'),
      getCurrentCycleApi(),
      getMtdStatsApi(),
    ])
      .then(([histRes, cycleRes, mtdRes]) => {
        const all = histRes.data?.data ?? [];
        setActivities(all.filter((a: any) => isSameMonth(new Date(a.date), now)));
        setCycle(cycleRes.data?.data ?? null);
        setMtd(mtdRes.data?.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalWorkDays = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(now.getFullYear(), now.getMonth(), d).getDay() !== 0) count++;
    }
    return count;
  }, []);

  const daysWorked = useMemo(() => {
    const uniqueDays = new Set(
      activities
        .filter((a: any) => a.visit_status === 'VISITED' || !a.visit_status)
        .map((a: any) => format(new Date(a.date), 'yyyy-MM-dd'))
    );
    return uniqueDays.size;
  }, [activities]);

  const samplesMtd = activities.reduce((s: number, a: any) => s + (a.samples_given ?? 0), 0);

  const cycleCoverage = useMemo(() => {
    if (!cycle?.items?.length) return null;
    const done     = cycle.items.reduce((s: number, i: any) => s + (i.visits_done ?? 0), 0);
    const required = cycle.items.reduce((s: number, i: any) => s + (i.frequency ?? 0), 0);
    return required > 0 ? Math.round((done / required) * 100) : 0;
  }, [cycle]);

  const dailyCallAvg  = mtd?.daily_call_avg ?? null;
  const drCovPct      = mtd?.doctor_coverage_pct ?? null;
  const daysElapsed   = mtd?.work_days_elapsed ?? 0;

  const STATS = [
    {
      key: 'days',
      label: 'Days Worked',
      value: loading ? '—' : `${daysWorked}/${totalWorkDays}`,
      sub: `${daysElapsed} working days elapsed`,
      icon: FiCalendar,
      color: 'text-[#16a34a]',
      bg: 'bg-[#f0fdf4]',
      pct: totalWorkDays > 0 ? Math.round((daysWorked / totalWorkDays) * 100) : 0,
    },
    {
      key: 'calls',
      label: 'Daily Call Avg',
      value: loading ? '—' : dailyCallAvg !== null ? dailyCallAvg : '—',
      sub: `${mtd?.total_visits_mtd ?? '—'} visits MTD`,
      icon: FiTrendingUp,
      color: 'text-[#16a34a]',
      bg: 'bg-[#f0fdf4]',
      pct: null,
    },
    {
      key: 'drcov',
      label: 'Doctor Coverage',
      value: loading ? '—' : drCovPct !== null ? `${drCovPct}%` : '—',
      sub: drCovPct !== null
        ? `${mtd?.unique_doctors_visited ?? 0} / ${mtd?.total_cycle_doctors ?? 0} doctors seen`
        : 'no cycle yet',
      icon: FiUsers,
      color: drCovPct === null ? 'text-gray-400'
        : drCovPct >= 70 ? 'text-[#16a34a]'
        : drCovPct >= 40 ? 'text-amber-600'
        : 'text-red-500',
      bg: drCovPct === null ? 'bg-gray-50'
        : drCovPct >= 70 ? 'bg-[#f0fdf4]'
        : drCovPct >= 40 ? 'bg-amber-50'
        : 'bg-red-50',
      pct: drCovPct,
    },
    {
      key: 'cycle',
      label: 'Cycle Coverage',
      value: loading ? '—' : cycleCoverage !== null ? `${cycleCoverage}%` : '—',
      sub: cycleCoverage !== null ? 'of committed visits' : 'no cycle yet',
      icon: MdOutlineEventRepeat,
      color: cycleCoverage === null ? 'text-gray-400'
        : cycleCoverage >= 70 ? 'text-[#16a34a]'
        : cycleCoverage >= 40 ? 'text-amber-600'
        : 'text-red-500',
      bg: cycleCoverage === null ? 'bg-gray-50'
        : cycleCoverage >= 70 ? 'bg-[#f0fdf4]'
        : cycleCoverage >= 40 ? 'bg-amber-50'
        : 'bg-red-50',
      pct: cycleCoverage,
    },
    {
      key: 'samples',
      label: 'Samples Given',
      value: loading ? '—' : samplesMtd,
      sub: 'cumulative this month',
      icon: FiPackage,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      pct: null,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Progress</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{format(now, 'MMMM yyyy')} — cumulative</p>
        </div>
        {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-start gap-3 px-4 py-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xl font-black leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.sub}</p>
                {s.pct !== null && (
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, s.pct)}%`,
                        backgroundColor: s.pct >= 70 ? '#16a34a' : s.pct >= 40 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Backlog Panel ─────────────────────────────────────────────────────────────

const BacklogPanel = ({ onLogMissed }: { onLogMissed?: (doctorId: string, doctorName: string) => void }) => {
  const [backlog, setBacklog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBacklogApi()
      .then((r) => setBacklog(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && backlog.length === 0) return null;

  const tierColor = (tier: string) =>
    tier === 'A' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : tier === 'B' ? 'bg-violet-50 text-violet-700 border-violet-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
            <FiAlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Visit Backlog</p>
            <p className="text-[11px] text-gray-400">Doctors behind schedule this month</p>
          </div>
        </div>
        {!loading && (
          <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {backlog.length} behind
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {backlog.slice(0, 5).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <BsPersonX className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.doctor?.doctor_name}</p>
                <p className="text-[11px] text-gray-400">
                  {item.visits_done}/{item.expected_by_today} visits · {item.visits_behind} behind
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tierColor(item.tier)}`}>
                  {item.tier}
                </span>
                {onLogMissed && (
                  <button
                    onClick={() => onLogMissed(item.doctor_id, item.doctor?.doctor_name)}
                    className="text-[11px] text-gray-400 hover:text-amber-600 font-medium px-2 py-1 rounded-md hover:bg-amber-50"
                    style={{ transition: 'color 0.15s, background-color 0.15s' }}
                  >
                    Log miss
                  </button>
                )}
              </div>
            </div>
          ))}
          {backlog.length > 5 && (
            <div className="px-4 py-2.5 text-center text-xs text-gray-400">
              +{backlog.length - 5} more behind schedule
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const Home = () => {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [manualKey, setManualKey] = useState(0);
  const { activities, loading } = useActivityData(refreshKey + manualKey);

  // LogMissed modal trigger — RepPage owns the modal; communicate via callback
  const handleLogMissed = (doctorId: string, _doctorName: string) => {
    // Dispatch to window event so RepPage can open LogMissedModal with pre-filled doctor
    window.dispatchEvent(new CustomEvent('kibag:log-missed', { detail: { doctorId } }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1 — Today's call activity */}
      <KpiCards activities={activities} loading={loading} onRefresh={() => setManualKey((k) => k + 1)} />

      {/* 2 — Visit backlog (only shown when behind) */}
      <BacklogPanel onLogMissed={handleLogMissed} />

      {/* 3 — Monthly progress (pace, cycle adherence, cumulative totals) */}
      <MonthlyProgress />

      {/* 4 — Smart overview: Today's Visits + Tasks + Cycle (tabbed) */}
      <SmartOverview activities={activities} activitiesLoading={loading} />

      {/* 5 — Detailing performance charts */}
      <DetailingPerformance />
    </div>
  );
};

export default Home;
