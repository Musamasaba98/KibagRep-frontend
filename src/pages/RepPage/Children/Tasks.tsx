import { useEffect, useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  MdOutlineEventRepeat,
  MdCheckCircleOutline,
  MdRadioButtonUnchecked,
  MdOutlineWarningAmber,
} from "react-icons/md";
import { FiActivity, FiUser } from "react-icons/fi";
import { getCurrentCycleApi, getActivityHistoryApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CycleItem {
  id: string;
  tier: string;
  frequency: number;
  visits_done: number;
  doctor: { id: string; doctor_name: string; town?: string; speciality?: string[] };
}

interface RecentActivity {
  id: string;
  date: string;
  doctor: { id: string; doctor_name: string; town?: string };
  focused_product?: { id: string; product_name: string };
  samples_given?: number;
}

// ─── Priority badge ───────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }: { priority: "HIGH" | "MEDIUM" }) =>
  priority === "HIGH" ? (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-500">
      High
    </span>
  ) : (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
      Medium
    </span>
  );

// ─── Tier badge ───────────────────────────────────────────────────────────────

const TierBadge = ({ tier }: { tier: string }) => {
  const map: Record<string, string> = {
    A: "bg-[#dcfce7] text-[#15803d]",
    B: "bg-amber-50 text-amber-600",
    C: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${map[tier] ?? map.C}`}>
      {tier}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Tasks = () => {
  const [cycleItems, setCycleItems] = useState<CycleItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  useEffect(() => {
    Promise.all([
      getCurrentCycleApi(),
      getActivityHistoryApi({ days: 14, limit: 50 }),
    ])
      .then(([cycleRes, histRes]) => {
        const items: CycleItem[] = cycleRes.data?.data?.items ?? [];
        setCycleItems(items);
        const acts: RecentActivity[] = histRes.data?.data ?? [];
        setRecentActivities(acts.slice(0, 12));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Derived task lists ──────────────────────────────────────────────────────

  const tasks = useMemo(() => {
    return cycleItems
      .map((ci) => ({
        ...ci,
        priority:
          ci.visits_done === 0
            ? ("HIGH" as const)
            : ci.visits_done < ci.frequency
            ? ("MEDIUM" as const)
            : null,
      }))
      .filter((t) => t.priority !== null)
      .sort((a, b) => {
        if (a.priority === "HIGH" && b.priority !== "HIGH") return -1;
        if (a.priority !== "HIGH" && b.priority === "HIGH") return 1;
        return (a.visits_done / a.frequency) - (b.visits_done / b.frequency);
      });
  }, [cycleItems]);

  const highCount = tasks.filter((t) => t.priority === "HIGH").length;
  const mediumCount = tasks.filter((t) => t.priority === "MEDIUM").length;
  const doneCount = cycleItems.filter((ci) => ci.visits_done >= ci.frequency).length;
  const totalDoctors = cycleItems.length;

  const filtered =
    filter === "all"
      ? tasks
      : tasks.filter((t) => t.priority === filter.toUpperCase());

  // ─── Summary cards ──────────────────────────────────────────────────────────

  const summaryCards = [
    {
      label: "Total Doctors",
      value: totalDoctors,
      icon: FiUser,
      gradient: "from-[#dcfce7] to-white",
      iconBg: "bg-[#16a34a]/10",
      iconColor: "text-[#16a34a]",
      valueColor: "text-[#16a34a]",
    },
    {
      label: "Cycle Complete",
      value: doneCount,
      icon: MdCheckCircleOutline,
      gradient: "from-[#dcfce7] to-white",
      iconBg: "bg-[#16a34a]/10",
      iconColor: "text-[#16a34a]",
      valueColor: "text-[#16a34a]",
    },
    {
      label: "Not Yet Visited",
      value: highCount,
      icon: MdRadioButtonUnchecked,
      gradient: "from-red-50 to-white",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      valueColor: "text-red-500",
    },
    {
      label: "Needs Follow-up",
      value: mediumCount,
      icon: MdOutlineWarningAmber,
      gradient: "from-amber-50 to-white",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black text-[#222f36] tracking-tight">Tasks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Derived from your active call cycle</p>
      </div>

      {/* ── Summary KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] hover:shadow-[0_4px_18px_0_rgba(0,0,0,0.10)]`}
              style={{ transition: "box-shadow 0.2s" }}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
              </div>
              {loading ? (
                <div className="w-8 h-8 mt-3 rounded-full border-[3px] border-gray-200 border-t-[#16a34a] animate-spin" />
              ) : (
                <div className="mt-3">
                  <p className={`text-3xl font-black leading-none ${card.valueColor}`}>
                    {card.value}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{card.label}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">

        {/* ── Task list ── */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.07)] overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MdOutlineEventRepeat className="w-4 h-4 text-[#16a34a]" />
              <h2 className="text-sm font-bold text-[#222f36]">Pending visits</h2>
              {!loading && (
                <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {(["all", "high", "medium"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                    filter === f
                      ? "bg-[#16a34a] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* list */}
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-[#16a34a] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <MdCheckCircleOutline className="w-10 h-10 text-[#16a34a] opacity-30 mb-2" />
                <p className="text-sm font-semibold text-gray-400">All caught up!</p>
                <p className="text-xs text-gray-300 mt-1">No pending visits in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((task) => {
                  const pct = Math.round((task.visits_done / task.frequency) * 100);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* status icon */}
                      {task.visits_done === 0 ? (
                        <MdRadioButtonUnchecked className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 shrink-0 rounded-full border-2 border-[#16a34a] flex items-center justify-center">
                          <div
                            className="rounded-full bg-[#16a34a]"
                            style={{ width: `${Math.max(4, (pct / 100) * 8)}px`, height: `${Math.max(4, (pct / 100) * 8)}px` }}
                          />
                        </div>
                      )}

                      {/* doctor info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-[#222f36] truncate">
                            {task.doctor.doctor_name}
                          </p>
                          <TierBadge tier={task.tier} />
                        </div>
                        {task.doctor.town && (
                          <p className="text-[11px] text-gray-400 truncate">{task.doctor.town}</p>
                        )}
                      </div>

                      {/* progress */}
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-semibold text-gray-500">
                          {task.visits_done}/{task.frequency}
                        </p>
                        <div className="w-16 h-1 rounded-full bg-gray-100 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct === 0 ? "#ef4444" : pct >= 50 ? "#16a34a" : "#f59e0b",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>

                      <PriorityBadge priority={task.priority!} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent activities ── */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.07)] overflow-hidden">
          {/* header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <FiActivity className="w-4 h-4 text-[#16a34a]" />
            <h2 className="text-sm font-bold text-[#222f36]">Recent activity</h2>
            <span className="text-[10px] text-gray-400 font-medium ml-auto">Last 14 days</span>
          </div>

          {/* timeline */}
          <div className="overflow-y-auto p-4 space-y-0" style={{ maxHeight: 380 }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-[#16a34a] animate-spin" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FiActivity className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm font-semibold text-gray-400">No recent activity</p>
              </div>
            ) : (
              recentActivities.map((act, i) => (
                <div key={act.id} className="flex gap-3 relative">
                  {/* timeline line */}
                  {i < recentActivities.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-px bg-gray-100 bottom-0" />
                  )}

                  {/* dot */}
                  <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <FiUser className="w-3.5 h-3.5 text-[#16a34a]" />
                  </div>

                  {/* content */}
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-semibold text-[#222f36] leading-tight">
                      {act.doctor?.doctor_name ?? "Unknown"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {act.doctor?.town && `${act.doctor.town} · `}
                      {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {act.focused_product && (
                        <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-md">
                          ★ {act.focused_product.product_name}
                        </span>
                      )}
                      {(act.samples_given ?? 0) > 0 && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          {act.samples_given} samples
                        </span>
                      )}
                      <span className="text-[10px] text-gray-300 font-mono ml-auto">
                        {format(new Date(act.date), "dd MMM HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Tasks;
