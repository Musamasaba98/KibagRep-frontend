import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { format } from "date-fns";
import { FaFlag } from "react-icons/fa";
import {
  MdOutlineEventRepeat,
  MdOutlineAssessment,
  MdOutlineFilePresent,
  MdArrowForwardIos,
  MdCheckCircleOutline,
} from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { getCurrentCycleApi, getMyTargetApi } from "../../../services/api";
import type { Activity } from "./ActivityCards";
import { useSampleBalances, type SampleBalance } from "./ActivityCards";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CycleItem {
  id: string;
  tier: string;
  frequency: number;
  visits_done: number;
  doctor: { id: string; doctor_name: string; town?: string };
}

interface CycleData {
  id: string;
  status: string;
  month: number;
  year: number;
  items: CycleItem[];
}

type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  priority: Priority;
  description: string;
  status: string;
  date: string;
}

interface CatchupEntry {
  id: string;
  name: string;
  hint: string;
  visits_done: number;
  frequency: number;
  tier: string;
}

type TabId = "today" | "tasks" | "cycle" | "performance" | "reports" | "samples";

interface TabDef {
  id: TabId;
  label: string;
}

// ─── Role → tab map ───────────────────────────────────────────────────────────

const ROLE_TABS: Record<string, TabDef[]> = {
  MedicalRep: [
    { id: "today", label: "Today's Visits" },
    { id: "tasks", label: "Tasks" },
    { id: "cycle", label: "Call Cycle" },
    { id: "samples", label: "Samples" },
    { id: "performance", label: "Performance" },
    { id: "reports", label: "Reports" },
  ],
  Supervisor: [
    { id: "today", label: "Today" },
    { id: "tasks", label: "Approvals" },
    { id: "cycle", label: "Cycles" },
    { id: "performance", label: "Team" },
  ],
  Manager: [
    { id: "today", label: "Today" },
    { id: "tasks", label: "Alerts" },
    { id: "performance", label: "Performance" },
    { id: "reports", label: "Reports" },
  ],
  SUPER_ADMIN: [
    { id: "today", label: "Today's Visits" },
    { id: "tasks", label: "Tasks" },
    { id: "cycle", label: "Call Cycle" },
    { id: "performance", label: "Performance" },
    { id: "reports", label: "Reports" },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriorityFlag = ({ level }: { level: Priority }) => {
  const color =
    level === "high" ? "text-red-500" : level === "medium" ? "text-amber-400" : "text-gray-300";
  const label = level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
  return (
    <div className="flex flex-col items-center shrink-0 gap-0.5">
      <FaFlag className={`w-3 h-3 ${color}`} />
      <p className={`text-[9px] font-semibold leading-none ${color}`}>{label}</p>
    </div>
  );
};

const TaskRow = ({ task }: { task: Task }) => (
  <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white transition-colors">
    <PriorityFlag level={task.priority} />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-[#222f36] leading-snug truncate">{task.description}</p>
      <div className="flex items-center justify-between mt-0.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wide">Status</span>
          <span className="text-[10px] text-gray-500">{task.status}</span>
        </div>
        <span className="text-[10px] text-gray-300 shrink-0">{task.date}</span>
      </div>
    </div>
  </div>
);

const CatchupRow = ({ entry }: { entry: CatchupEntry }) => {
  const pct = Math.round((entry.visits_done / entry.frequency) * 100);
  return (
    <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white transition-colors">
      <FaFlag className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 leading-snug truncate">{entry.hint}</p>
        <div className="flex items-center justify-between mt-0.5 gap-2 flex-wrap">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wide shrink-0">Name</span>
            <span className="text-[10px] text-gray-600 font-semibold truncate max-w-[110px]">{entry.name}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                entry.tier === "A"
                  ? "bg-[#dcfce7] text-[#16a34a]"
                  : entry.tier === "B"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              Tier {entry.tier}
            </span>
          </div>
          <span className="text-[10px] text-gray-300 shrink-0">{pct}% done</span>
        </div>
        <div className="w-full h-0.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#16a34a]"
            style={{ width: `${pct}%`, opacity: 0.7, transition: "width 0.3s ease" }}
          />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="flex flex-col items-center py-8 text-gray-300">
    <MdCheckCircleOutline className="w-8 h-8 mb-1.5" />
    <p className="text-xs font-semibold text-gray-400">{label}</p>
    {sub && <p className="text-[11px] text-gray-300 mt-0.5 text-center max-w-[200px]">{sub}</p>}
  </div>
);

const ShortcutCard = ({
  icon: Icon,
  label,
  description,
  to,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  to: string;
  color: string;
  bgColor: string;
}) => (
  <NavLink
    to={to}
    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-white hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] transition-shadow group"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-[#222f36]">{label}</p>
      <p className="text-[10px] text-gray-400 truncate">{description}</p>
    </div>
    <MdArrowForwardIos className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
  </NavLink>
);

// ─── Today's Visits tab ───────────────────────────────────────────────────────

const TodayTab = ({
  activities,
  loading,
}: {
  activities: Activity[];
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-6 px-2 text-gray-400">
        <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
        <span className="text-sm">Loading visits…</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        label="No visits logged yet today"
        sub="Tap the + button to log your first visit"
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {activities.map((activity, idx) => (
        <div
          key={activity.id}
          className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-[0_1px_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.09)]"
          style={{ transition: "box-shadow 0.2s" }}
        >
          <div className="w-6 h-6 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
            <span className="text-[#16a34a] font-bold text-[10px]">{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {activity.doctor?.doctor_name ?? "—"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{activity.doctor?.town ?? ""}</p>
          </div>
          {activity.focused_product && (
            <span className="shrink-0 text-[10px] font-semibold text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded-full">
              ★ {activity.focused_product.product_name}
            </span>
          )}
          {activity.samples_given > 0 && (
            <span className="shrink-0 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {activity.samples_given} samples
            </span>
          )}
          <span className="shrink-0 text-[10px] text-gray-300 font-mono">
            {format(new Date(activity.date), "HH:mm")}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Cycle tab ────────────────────────────────────────────────────────────────

const CycleTab = ({ cycle, loading }: { cycle: CycleData | null; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
      </div>
    );
  }
  if (!cycle) return <EmptyState label="No cycle data" />;

  const total = cycle.items.length;
  const done = cycle.items.filter((i) => i.visits_done >= i.frequency).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#222f36]">
            {format(new Date(cycle.year, cycle.month - 1), "MMMM yyyy")} Cycle
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {done} / {total} doctors fully visited
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            cycle.status === "LOCKED"
              ? "bg-[#dcfce7] text-[#16a34a]"
              : cycle.status === "SUBMITTED"
              ? "bg-amber-50 text-amber-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {cycle.status}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["A", "B", "C"].map((tier) => {
          const items = cycle.items.filter((i) => i.tier === tier);
          const tierDone = items.filter((i) => i.visits_done >= i.frequency).length;
          return (
            <div key={tier} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-[#222f36]">
                {tierDone}/{items.length}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold">Tier {tier}</p>
            </div>
          );
        })}
      </div>
      <NavLink
        to="/rep-page/call-cycle"
        className="flex items-center justify-between w-full text-xs font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors"
      >
        View full cycle <MdArrowForwardIos className="w-3 h-3" />
      </NavLink>
    </div>
  );
};

// ─── Samples tab ─────────────────────────────────────────────────────────────

const PRODUCT_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"];

const SamplesTab = ({ balances, loading }: { balances: SampleBalance[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-6 px-2 text-gray-400">
        <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
        <span className="text-sm">Loading sample balances…</span>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <EmptyState
        label="No sample stock assigned"
        sub="Contact your supervisor to get samples issued"
      />
    );
  }

  const totalRemaining = balances.reduce((s, b) => s + Math.max(0, b.issued - b.given), 0);
  const totalIssued = balances.reduce((s, b) => s + b.issued, 0);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-sky-50 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-sky-600">{totalRemaining}</p>
          <p className="text-[10px] font-semibold text-sky-400 uppercase tracking-wide mt-0.5">Remaining</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-gray-600">{totalIssued}</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Issued Total</p>
        </div>
        <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-amber-600">
            {totalIssued > 0 ? Math.round(((totalIssued - totalRemaining) / totalIssued) * 100) : 0}%
          </p>
          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mt-0.5">Distributed</p>
        </div>
      </div>

      {/* Per-product breakdown */}
      <div className="space-y-3">
        {balances.map((b, i) => {
          const remaining = Math.max(0, b.issued - b.given);
          const pct = b.issued > 0 ? Math.round((b.given / b.issued) * 100) : 0;
          const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p className="text-xs font-semibold text-[#222f36] truncate max-w-[150px]">
                    {b.product.product_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-400">{b.given}/{b.issued} given</span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {remaining} left
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.4s ease" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface SmartOverviewProps {
  activities: Activity[];
  activitiesLoading: boolean;
}

const SmartOverview = ({ activities, activitiesLoading }: SmartOverviewProps) => {
  const user = useSelector((state: any) => state.auth?.user);
  const role: string = user?.role ?? "MedicalRep";

  const tabs = ROLE_TABS[role] ?? ROLE_TABS.MedicalRep;
  const [activeTab, setActiveTab] = useState<TabId>("today");

  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const { balances, loading: balancesLoading } = useSampleBalances();
  const [target, setTarget] = useState<{ target_value: number; target_units: number } | null>(null);

  useEffect(() => {
    getCurrentCycleApi()
      .then((res) => setCycle(res.data?.data ?? null))
      .catch(() => {})
      .finally(() => setCycleLoading(false));
    getMyTargetApi()
      .then((res) => setTarget(res.data?.data ?? null))
      .catch(() => {});
  }, []);

  // Derive tasks from cycle data
  const tasks: Task[] = cycle
    ? [
        ...cycle.items
          .filter((i) => i.visits_done === 0)
          .slice(0, 5)
          .map((i) => ({
            id: `start-${i.id}`,
            priority: "high" as Priority,
            description: `Visit ${i.doctor.doctor_name} — not started`,
            status: "Not Started",
            date: format(new Date(cycle.year, cycle.month - 1), "yyyy-MM"),
          })),
        ...cycle.items
          .filter((i) => i.visits_done > 0 && i.visits_done < i.frequency)
          .slice(0, 4)
          .map((i) => ({
            id: `behind-${i.id}`,
            priority: "medium" as Priority,
            description: `${i.doctor.doctor_name} — ${i.visits_done}/${i.frequency} visits`,
            status: "In Progress",
            date: format(new Date(cycle.year, cycle.month - 1), "yyyy-MM"),
          })),
      ]
    : [];

  // Catching up: least visited relative to target
  const catchup: CatchupEntry[] = cycle
    ? cycle.items
        .filter((i) => i.visits_done < i.frequency)
        .sort((a, b) => a.visits_done / a.frequency - b.visits_done / b.frequency)
        .slice(0, 8)
        .map((i) => ({
          id: i.id,
          name: i.doctor.doctor_name,
          hint:
            i.visits_done === 0
              ? "No visits logged yet this month"
              : `${i.frequency - i.visits_done} more visit${i.frequency - i.visits_done > 1 ? "s" : ""} needed`,
          visits_done: i.visits_done,
          frequency: i.frequency,
          tier: i.tier,
        }))
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden">

      {/* ── Tab nav ── */}
      <div className="flex items-center border-b border-gray-100 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap focus-visible:outline-none transition-colors ${
              activeTab === tab.id
                ? "text-[#16a34a] border-b-[3px] border-[#16a34a]"
                : "text-gray-400 hover:text-gray-600 border-b-[3px] border-transparent"
            }`}
          >
            {tab.label}
            {/* Badge for today's visit count on the Today tab */}
            {tab.id === "today" && activities.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-white bg-[#16a34a] px-1.5 py-0.5 rounded-full">
                {activities.length}
              </span>
            )}
            {/* Badge for total samples remaining on the Samples tab */}
            {tab.id === "samples" && !balancesLoading && balances.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-white bg-sky-500 px-1.5 py-0.5 rounded-full">
                {balances.reduce((s, b) => s + Math.max(0, b.issued - b.given), 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="bg-gray-50/40 p-4">

        {/* Today's Visits */}
        {activeTab === "today" && (
          <TodayTab activities={activities} loading={activitiesLoading} />
        )}

        {/* Tasks + Catching Up — stacks on mobile, two-col on desktop */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pb-4 md:pb-0 md:pr-4 md:border-r border-gray-200">
              <h3 className="text-[11px] font-bold text-[#222f36] uppercase tracking-widest mb-2 px-2">
                My Tasks
              </h3>
              {cycleLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState label="All tasks complete!" />
              ) : (
                <div className="space-y-0.5">
                  {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
                </div>
              )}
            </div>
            <div className="pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 border-gray-200">
              <h3 className="text-[11px] font-bold text-[#222f36] uppercase tracking-widest mb-2 px-2">
                Catching Up
              </h3>
              {cycleLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
                </div>
              ) : catchup.length === 0 ? (
                <EmptyState label="All doctors on track!" />
              ) : (
                <div className="space-y-0.5">
                  {catchup.map((e) => <CatchupRow key={e.id} entry={e} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cycle */}
        {activeTab === "cycle" && <CycleTab cycle={cycle} loading={cycleLoading} />}

        {/* Samples */}
        {activeTab === "samples" && <SamplesTab balances={balances} loading={balancesLoading} />}

        {/* Performance */}
        {activeTab === "performance" && (
          <div className="space-y-3">
            {/* Monthly target card */}
            {target ? (
              <div className="bg-white rounded-xl p-3.5 shadow-[0_1px_6px_0_rgba(0,0,0,0.05)]">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Monthly Target</p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Sales Value",
                      target: target.target_value,
                      actual: 0,
                      format: (v: number) => `UGX ${v.toLocaleString()}`,
                      color: "#16a34a",
                      bg: "#dcfce7",
                    },
                    {
                      label: "Units Sold",
                      target: target.target_units,
                      actual: balances.reduce((s, b) => s + b.given, 0),
                      format: (v: number) => v.toString(),
                      color: "#0891b2",
                      bg: "#e0f2fe",
                    },
                  ].map(({ label, target: t, actual, format, color, bg }) => {
                    const pct = t > 0 ? Math.min(Math.round((actual / t) * 100), 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-[#1a1a1a]">{label}</span>
                          <span className="text-gray-400">{format(actual)} / {format(t)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.4s" }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
                          <span className="text-[10px] rounded-full px-1.5 font-semibold" style={{ background: bg, color }}>target {format(t)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl px-3.5 py-3 text-xs text-gray-400 text-center">
                No target set for this month yet
              </div>
            )}
            <ShortcutCard
              icon={MdOutlineAssessment}
              label="Detailing Performance"
              description="Product-level detailing activity this month"
              to="/rep-page"
              color="text-[#16a34a]"
              bgColor="bg-[#dcfce7]"
            />
            <ShortcutCard
              icon={FiActivity}
              label="Visit History"
              description="Browse all logged visits and outcomes"
              to="/rep-page/visits"
              color="text-violet-500"
              bgColor="bg-violet-50"
            />
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="space-y-2">
            <ShortcutCard
              icon={MdOutlineFilePresent}
              label="Daily Reports"
              description="Submit and track your daily field reports"
              to="/rep-page/reports"
              color="text-amber-500"
              bgColor="bg-amber-50"
            />
            <ShortcutCard
              icon={MdOutlineEventRepeat}
              label="Call Cycle"
              description="Review and submit your monthly call cycle"
              to="/rep-page/call-cycle"
              color="text-sky-500"
              bgColor="bg-sky-50"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartOverview;
