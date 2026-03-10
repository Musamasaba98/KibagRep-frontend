import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useActivityData, KpiCards } from '../components/ActivityCards';
import DetailingPerformance from '../components/DetailingPerformance';
import SmartOverview from '../components/SmartOverview';

const Home = () => {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [manualKey, setManualKey] = useState(0);
  const { activities, loading } = useActivityData(refreshKey + manualKey);

  return (
    <div className="space-y-8">
      {/* 1 — KPI stat cards */}
      <KpiCards activities={activities} loading={loading} onRefresh={() => setManualKey((k) => k + 1)} />

      {/* 2 — Smart overview: Today's Visits + Tasks + Cycle (tabbed, role-aware) */}
      <SmartOverview activities={activities} activitiesLoading={loading} />

      {/* 3 — Detailing performance charts */}
      <DetailingPerformance />
    </div>
  );
};

export default Home;
