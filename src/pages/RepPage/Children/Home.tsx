import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format, isSameMonth, isWeekend } from 'date-fns';
import { FiActivity, FiMic, FiPackage, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { MdOutlineEventRepeat } from 'react-icons/md';
import { useActivityData, KpiCards } from '../components/ActivityCards';
import DetailingPerformance from '../components/DetailingPerformance';
import SmartOverview from '../components/SmartOverview';
import { getActivityHistoryApi, getCurrentCycleApi } from '../../../services/api';

// ─── Monthly Progress panel ───────────────────────────────────────────────────
// Shows MONTH-LEVEL metrics that today's cards don't show:
//   Days Worked | Total Visits MTD | Cycle Coverage % | MTD Samples

const MonthlyProgress = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [cycle, setCycle]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const now = new Date();

  useEffect(() => {
    Promise.all([
      getActivityHistoryApi({ days: 31, limit: 1000 }),
      getCurrentCycleApi(),
    ])
      .then(([histRes, cycleRes]) => {
        const all = histRes.data?.data ?? [];
        setActivities(all.filter((a: any) => isSameMonth(new Date(a.date), now)));
        setCycle(cycleRes.data?.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Working days = distinct calendar dates with at least one logged activity
  const daysWorked = useMemo(() => {
    const uniqueDays = new Set(activities.map((a: any) => format(new Date(a.date), 'yyyy-MM-dd')));
    return uniqueDays.size;
  }, [activities]);

  // Total working days in the month (Mon–Sat, excluding Sun)
  const totalWorkDays = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), d);
      if (day.getDay() !== 0) count++; // exclude Sundays
    }
    return count;
  }, []);

  const totalVisitsMtd = activities.filter((a: any) => !a.nca_reason).length;
  const samplesMtd     = activities.reduce((s: number, a: any) => s + (a.samples_given ?? 0), 0);

  // Cycle coverage: total visits_done / total required across all cycle items
  const cycleCoverage = useMemo(() => {
    if (!cycle?.items?.length) return null;
    const done     = cycle.items.reduce((s: number, i: any) => s + (i.visits_done ?? 0), 0);
    const required = cycle.items.reduce((s: number, i: any) => s + (i.frequency ?? 0), 0);
    return required > 0 ? Math.round((done / required) * 100) : 0;
  }, [cycle]);

  const STATS = [
    {
      key: 'days',
      label: 'Days Worked',
      value: loading ? '—' : `${daysWorked}/${totalWorkDays}`,
      sub: 'this month',
      icon: FiCalendar,
      color: 'text-[#16a34a]',
      bg: 'bg-[#f0fdf4]',
      pct: totalWorkDays > 0 ? Math.round((daysWorked / totalWorkDays) * 100) : 0,
    },
    {
      key: 'visits',
      label: 'Visits MTD',
      value: loading ? '—' : totalVisitsMtd,
      sub: 'doctor contacts',
      icon: FiTrendingUp,
      color: 'text-[#16a34a]',
      bg: 'bg-[#f0fdf4]',
      pct: null,
    },
    {
      key: 'cycle',
      label: 'Cycle Coverage',
      value: loading ? '—' : cycleCoverage !== null ? `${cycleCoverage}%` : '—',
      sub: cycleCoverage !== null ? 'of committed visits' : 'no cycle yet',
      icon: MdOutlineEventRepeat,
      color: cycleCoverage !== null && cycleCoverage >= 70
        ? 'text-[#16a34a]'
        : cycleCoverage !== null && cycleCoverage >= 40
        ? 'text-amber-600'
        : 'text-red-500',
      bg: cycleCoverage !== null && cycleCoverage >= 70
        ? 'bg-[#f0fdf4]'
        : cycleCoverage !== null && cycleCoverage >= 40
        ? 'bg-amber-50'
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Progress</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{format(now, 'MMMM yyyy')} — cumulative</p>
        </div>
        {loading && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
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
                        backgroundColor:
                          s.pct >= 70 ? '#16a34a' : s.pct >= 40 ? '#f59e0b' : '#ef4444',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const Home = () => {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [manualKey, setManualKey] = useState(0);
  const { activities, loading } = useActivityData(refreshKey + manualKey);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1 — Today's call activity (live, refreshes on every visit log) */}
      <KpiCards activities={activities} loading={loading} onRefresh={() => setManualKey((k) => k + 1)} />

      {/* 2 — Monthly progress (pace, cycle adherence, cumulative totals) */}
      <MonthlyProgress />

      {/* 3 — Smart overview: Today's Visits + Tasks + Cycle (tabbed) */}
      <SmartOverview activities={activities} activitiesLoading={loading} />

      {/* 4 — Detailing performance charts */}
      <DetailingPerformance />
    </div>
  );
};

export default Home;
