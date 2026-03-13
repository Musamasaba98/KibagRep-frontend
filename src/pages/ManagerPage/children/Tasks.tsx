import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { GrTask } from "react-icons/gr";
import { MdCheckCircleOutline } from "react-icons/md";
import { getPendingReportsApi, getTeamPerformanceApi } from "../../../services/api";

type Priority = "HIGH" | "MEDIUM" | "LOW";
type FilterTab = "ALL" | "HIGH" | "MEDIUM";

interface Task {
  id: string;
  priority: Priority;
  title: string;
  sub: string;
  linkTo: string | null;
}

interface RepPerformance {
  user: { id: string; firstname: string; lastname: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_adherence_pct: number | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
}

interface PendingReport {
  id: string;
  user?: { firstname?: string; lastname?: string };
  rep?: { firstname?: string; lastname?: string };
  firstname?: string;
  lastname?: string;
  report_date?: string;
  date?: string;
  created_at?: string;
}

const priorityDot: Record<Priority, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-gray-300",
};

const priorityLabel: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const priorityLabelColor: Record<Priority, string> = {
  HIGH: "text-red-500",
  MEDIUM: "text-amber-500",
  LOW: "text-gray-400",
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const repName = (rep: RepPerformance) =>
  `${rep.user.firstname} ${rep.user.lastname}`;

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("ALL");

  useEffect(() => {
    Promise.allSettled([getPendingReportsApi(), getTeamPerformanceApi()]).then(
      ([reportsRes, perfRes]) => {
        const derived: Task[] = [];

        // ── 1. Pending report tasks ──────────────────────────────────────────
        if (reportsRes.status === "fulfilled") {
          const raw = reportsRes.value.data?.data ?? reportsRes.value.data;
          const reports: PendingReport[] = Array.isArray(raw) ? raw : [];
          reports.forEach((report) => {
            const userObj = report.user ?? report.rep;
            const fn = userObj?.firstname ?? report.firstname ?? "Rep";
            const ln = userObj?.lastname ?? report.lastname ?? "";
            const name = `${fn} ${ln}`.trim();
            const dateVal =
              report.report_date ?? report.date ?? report.created_at;
            derived.push({
              id: `report-${report.id}`,
              priority: "HIGH",
              title: `${name} — daily report pending approval`,
              sub: dateVal ? `Report date: ${formatDate(dateVal)}` : "Pending review",
              linkTo: "/manager/reports",
            });
          });
        }

        // ── 2. Rep performance tasks ─────────────────────────────────────────
        if (perfRes.status === "fulfilled") {
          const raw = perfRes.value.data?.data ?? perfRes.value.data;
          const reps: RepPerformance[] = Array.isArray(raw) ? raw : [];

          reps.forEach((rep) => {
            const name = repName(rep);

            // GPS anomaly spike
            if ((rep.gps_anomaly_count_week ?? 0) > 2) {
              derived.push({
                id: `gps-${rep.user.id}`,
                priority: "HIGH",
                title: `GPS anomaly spike — ${name}: ${rep.gps_anomaly_count_week} flags this week`,
                sub: "Unusual location patterns detected",
                linkTo: null,
              });
            }

            // Inactive rep
            if (
              rep.days_since_last_visit != null &&
              rep.days_since_last_visit > 5
            ) {
              derived.push({
                id: `inactive-${rep.user.id}`,
                priority: "MEDIUM",
                title: `${name} hasn't logged a visit in ${rep.days_since_last_visit} days`,
                sub: "Field activity gap detected",
                linkTo: null,
              });
            }

            // Many pending reports
            if ((rep.pending_reports ?? 0) > 3) {
              derived.push({
                id: `pending-${rep.user.id}`,
                priority: "MEDIUM",
                title: `${name} has ${rep.pending_reports} unreviewed reports`,
                sub: "Reports backlog requires attention",
                linkTo: "/manager/reports",
              });
            }
          });
        }

        // Sort: HIGH first, then MEDIUM
        derived.sort((a, b) => {
          const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return order[a.priority] - order[b.priority];
        });

        setTasks(derived);
      }
    ).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const FILTER_TABS: FilterTab[] = ["ALL", "HIGH", "MEDIUM"];

  const filtered =
    filter === "ALL" ? tasks : tasks.filter((t) => t.priority === filter);

  const highCount = tasks.filter((t) => t.priority === "HIGH").length;
  const medCount = tasks.filter((t) => t.priority === "MEDIUM").length;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <GrTask className="w-5 h-5 text-[#16a34a] shrink-0" />
          <div>
            <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Tasks</h1>
            <p className="text-gray-400 text-sm mt-0.5">Action items needing your attention</p>
          </div>
        </div>
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-gray-400">Loading tasks…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <GrTask className="w-5 h-5 text-[#16a34a] shrink-0" />
          <div>
            <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Tasks</h1>
            <p className="text-gray-400 text-sm mt-0.5">Action items needing your attention</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-red-400 text-sm">Failed to load tasks. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <GrTask className="w-5 h-5 text-[#16a34a] shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Tasks</h1>
              {tasks.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold px-1.5">
                  {tasks.length}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Action items needing your attention</p>
          </div>
        </div>

        {/* Summary chips */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {highCount} High
              </span>
            )}
            {medCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {medCount} Medium
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter pills */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const count =
              tab === "ALL"
                ? tasks.length
                : tasks.filter((t) => t.priority === tab).length;
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                  isActive
                    ? "bg-[#16a34a] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#16a34a] hover:text-[#16a34a]"
                }`}
                style={{ transition: "background-color 0.15s, color 0.15s, border-color 0.15s" }}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs ${
                      isActive ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 && tasks.length === 0 ? (
        // All clear empty state
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
            <MdCheckCircleOutline className="w-7 h-7 text-[#16a34a]" />
          </div>
          <p className="font-semibold text-gray-700">All clear — no urgent items</p>
          <p className="text-sm text-gray-400">Everything is up to date. Check back later.</p>
        </div>
      ) : filtered.length === 0 ? (
        // Filtered empty state
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-12">
          <p className="text-gray-400 text-sm">
            No {filter.charAt(0) + filter.slice(1).toLowerCase()} priority tasks.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60"
                style={{ transition: "background-color 0.15s" }}
              >
                {/* Priority dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority]}`}
                  title={priorityLabel[task.priority]}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-bold ${priorityLabelColor[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                    {task.sub && (
                      <>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400 truncate">{task.sub}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Review button */}
                {task.linkTo && (
                  <NavLink
                    to={task.linkTo}
                    className="shrink-0 rounded-full border border-[#16a34a] px-3 py-1 text-xs font-semibold text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                    style={{ transition: "background-color 0.15s" }}
                  >
                    Review
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
