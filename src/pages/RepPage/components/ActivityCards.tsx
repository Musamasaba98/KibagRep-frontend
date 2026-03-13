import { useEffect, useState } from "react";
import { getTodayActivitiesApi, getSampleBalancesApi } from "../../../services/api";
import { format } from "date-fns";
import { FiActivity, FiPackage, FiMic, FiRefreshCw } from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";


export interface Activity {
  id: string;
  date: string;
  samples_given: number;
  nca_reason?: string | null;
  doctor: { id: string; doctor_name: string; town: string };
  focused_product: { id: string; product_name: string };
}

export interface SampleBalance {
  id: string;
  issued: number;
  given: number;
  product: { id: string; product_name: string };
}

const KPI_DAILY_TARGET = 15; // Uganda pharma field standard: 15 HCPs per day

// ─── Shared data hook (one fetch, shared by both sections) ────────────────────
export function useActivityData(refreshKey: number) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTodayActivitiesApi()
      .then((res) => setActivities(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { activities, loading };
}

// ─── Sample balances hook ─────────────────────────────────────────────────────
export function useSampleBalances() {
  const [balances, setBalances] = useState<SampleBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSampleBalancesApi()
      .then((res) => setBalances(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { balances, loading };
}

// ─── KPI cards section ────────────────────────────────────────────────────────
export const KpiCards = ({
  activities,
  loading,
  onRefresh,
}: {
  activities: Activity[];
  loading: boolean;
  onRefresh?: () => void;
}) => {
  const totalVisits   = activities.filter((a) => !a.nca_reason).length;
  const ncaCount      = activities.filter((a) => !!a.nca_reason).length;
  const samplesGiven  = activities.reduce((s, a) => s + (a.samples_given ?? 0), 0);
  const detailingDone = activities.filter((a) => a.focused_product && !a.nca_reason).length;

  const cards = [
    {
      value: totalVisits,
      target: KPI_DAILY_TARGET,
      label: "Visits Today",
      icon: FiActivity,
      gradient: "from-[#dcfce7] to-white",
      iconBg: "bg-[#16a34a]/10",
      iconColor: "text-[#16a34a]",
      valueColor: "text-[#16a34a]",
      showProgress: true,
      isLoading: loading,
    },
    {
      value: ncaCount,
      target: null,
      label: "NCA Today",
      icon: MdOutlineWarningAmber,
      gradient: "from-amber-50 to-white",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: ncaCount > 0 ? "text-amber-600" : "text-gray-400",
      showProgress: false,
      isLoading: loading,
    },
    {
      value: detailingDone,
      target: KPI_DAILY_TARGET,
      label: "Detailing Done",
      icon: FiMic,
      gradient: "from-violet-50 to-white",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      valueColor: "text-violet-600",
      showProgress: true,
      isLoading: loading,
    },
    {
      value: samplesGiven,
      target: null,
      label: "Samples Given",
      icon: FiPackage,
      gradient: "from-sky-50 to-white",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      valueColor: "text-sky-600",
      showProgress: false,
      isLoading: loading,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl tracking-tight text-gray-800">Today's call activity</h1>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            aria-label="Refresh data"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const pct = card.target
            ? Math.min(100, Math.round((card.value / card.target) * 100))
            : null;
          return (
            <div
              key={card.label}
              className={`flex flex-col justify-between min-h-[110px] sm:min-h-[130px] p-3.5 sm:p-4 rounded-xl bg-gradient-to-br ${card.gradient} shadow-[0_2px_12px_0_rgba(0,0,0,0.07)] hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.12)] cursor-pointer`}
              style={{ transition: "box-shadow 0.2s, opacity 0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                {pct !== null && (
                  <span className="text-[11px] font-semibold text-gray-400 tracking-wide">
                    {pct}% of target
                  </span>
                )}
              </div>

              {card.isLoading ? (
                <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-green-500 animate-spin" />
              ) : (
                <div>
                  <p className={`font-black text-4xl leading-none ${card.valueColor}`}>
                    {card.value}
                  </p>
                  <p className="text-[13px] font-semibold text-gray-500 mt-1">{card.label}</p>
                </div>
              )}

              {card.showProgress && pct !== null && !card.isLoading && (
                <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444",
                      opacity: 0.8,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Today's visit log section ────────────────────────────────────────────────
export const TodayVisitLog = ({
  activities,
  loading,
}: {
  activities: Activity[];
  loading: boolean;
}) => (
  <div>
    <h2 className="font-bold text-xl tracking-tight text-gray-800 mb-3">Today's visits</h2>

    {loading ? (
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-green-500 animate-spin" />
        <span className="text-sm">Loading visits…</span>
      </div>
    ) : activities.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
        <FiActivity className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">No visits logged yet today</p>
        <p className="text-gray-400 text-sm mt-1">Tap the + button to log your first visit</p>
      </div>
    ) : (
      <div className="space-y-2">
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-[0_1px_8px_0_rgba(0,0,0,0.06)] hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.1)]"
            style={{ transition: "box-shadow 0.2s" }}
          >
            <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
              <span className="text-[#16a34a] font-bold text-sm">{idx + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {activity.doctor?.doctor_name ?? "—"}
              </p>
              <p className="text-xs text-gray-400 truncate">{activity.doctor?.town ?? ""}</p>
            </div>
            {activity.focused_product && (
              <span className="shrink-0 text-[11px] font-semibold text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                ★ {activity.focused_product.product_name}
              </span>
            )}
            {activity.samples_given > 0 && (
              <span className="shrink-0 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {activity.samples_given} samples
              </span>
            )}
            <span className="shrink-0 text-[11px] text-gray-400 font-mono">
              {format(new Date(activity.date), "HH:mm")}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Legacy default export (backward compat) ─────────────────────────────────
const ActivityCards = ({ refreshKey }: { refreshKey: number }) => {
  const { activities, loading } = useActivityData(refreshKey);
  return (
    <div className="w-full space-y-6">
      <KpiCards activities={activities} loading={loading} />
      <TodayVisitLog activities={activities} loading={loading} />
    </div>
  );
};

export default ActivityCards;
