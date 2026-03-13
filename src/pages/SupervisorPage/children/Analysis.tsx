import { useEffect, useState, useCallback } from "react";
import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { TbChartBar } from "react-icons/tb";
import { IoWarningOutline } from "react-icons/io5";
import { getTeamPerformanceApi, getTeamTargetsApi, setTargetApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RepPerf {
  user: { id: string; firstname: string; lastname: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_visits_done: number;
  cycle_total_target: number;
  cycle_adherence_pct: number | null;
  last_visit_date: string | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
  pending_expenses: number;
}

interface TargetRow {
  user: { id: string; firstname: string; lastname: string };
  target: { id: string; target_value: number; target_units: number } | null;
  month: number;
  year: number;
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Performance card ─────────────────────────────────────────────────────────
const PerfCard = ({ rep }: { rep: RepPerf }) => {
  const pct = rep.cycle_adherence_pct;
  const adherenceColor =
    pct === null ? "bg-gray-200" :
    pct >= 80 ? "bg-[#16a34a]" :
    pct >= 50 ? "bg-amber-500" : "bg-red-500";

  const overdue = rep.days_since_last_visit !== null && rep.days_since_last_visit > 3;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#f0fdf4] flex items-center justify-center text-xs font-bold text-[#16a34a] shrink-0">
          {rep.user.firstname[0]}{rep.user.lastname[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#1a1a1a] truncate">{rep.user.firstname} {rep.user.lastname}</p>
          <p className="text-xs text-gray-400">Medical Rep</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {rep.gps_anomaly_count_week > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600" title="GPS anomalies this week">
              ⚠ {rep.gps_anomaly_count_week}
            </span>
          )}
          {rep.pending_reports > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700" title="Pending reports">
              {rep.pending_reports} rpt
            </span>
          )}
        </div>
      </div>

      {/* Visit counts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Today", value: rep.visits_today },
          { label: "Week", value: rep.visits_this_week },
          { label: "Month", value: rep.visits_this_month },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 rounded-xl py-2">
            <p className="text-lg font-black text-[#1a1a1a] leading-none">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Cycle adherence */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Cycle adherence</span>
          <span className="font-semibold text-[#1a1a1a]">
            {pct !== null ? `${pct}%` : "—"} ({rep.cycle_visits_done}/{rep.cycle_total_target})
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${adherenceColor}`}
            style={{ width: `${Math.min(pct ?? 0, 100)}%`, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Last visit */}
      <p className={`text-xs ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
        {rep.days_since_last_visit === null
          ? "No visits recorded"
          : rep.days_since_last_visit === 0
          ? "Last visit: today"
          : `Last visit: ${rep.days_since_last_visit}d ago${overdue ? " ⚠" : ""}`}
      </p>
    </div>
  );
};

// ─── Target row ───────────────────────────────────────────────────────────────
const TargetRowEdit = ({
  row, onSave,
}: {
  row: TargetRow;
  onSave: (userId: string, month: number, year: number, value: number, units: number) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.target?.target_value ?? 0);
  const [units, setUnits] = useState(row.target?.target_units ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(row.target?.target_value ?? 0);
    setUnits(row.target?.target_units ?? 0);
  }, [row.target]);

  const save = async () => {
    setSaving(true);
    await onSave(row.user.id, row.month, row.year, value, units);
    setSaving(false);
    setEditing(false);
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[10px] font-bold text-[#16a34a] shrink-0">
            {row.user.firstname[0]}{row.user.lastname[0]}
          </div>
          <span className="text-sm font-medium text-[#1a1a1a]">{row.user.firstname} {row.user.lastname}</span>
        </div>
      </td>
      <td className="py-3 px-2 text-center">
        {editing ? (
          <input type="number" min={0} value={value} onChange={e => setValue(Number(e.target.value))}
            className="w-28 text-center text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]"
            placeholder="e.g. 5000000" />
        ) : (
          <span className="text-sm text-[#1a1a1a] font-semibold">
            {row.target?.target_value ? `UGX ${row.target.target_value.toLocaleString()}` : <span className="text-gray-300">—</span>}
          </span>
        )}
      </td>
      <td className="py-3 px-2 text-center">
        {editing ? (
          <input type="number" min={0} value={units} onChange={e => setUnits(Number(e.target.value))}
            className="w-20 text-center text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]" />
        ) : (
          <span className="text-sm text-[#1a1a1a] font-semibold">
            {row.target?.target_units ?? <span className="text-gray-300">—</span>}
          </span>
        )}
      </td>
      <td className="py-3 pl-2 pr-4 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
              style={{ transition: "background-color 0.15s" }}>
              {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <LuCheck className="w-3.5 h-3.5" />}
              Save
            </button>
            <button onClick={() => setEditing(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              style={{ transition: "background-color 0.15s" }}>
              <LuX className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-[#16a34a] rounded-lg border border-gray-200 hover:border-[#16a34a] hover:bg-[#f0fdf4]"
            style={{ transition: "all 0.15s" }}>
            <LuPencil className="w-3 h-3" /> Set
          </button>
        )}
      </td>
    </tr>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Analysis = () => {
  const [perf, setPerf] = useState<RepPerf[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loadPerf = useCallback(() => {
    setLoadingPerf(true);
    getTeamPerformanceApi()
      .then(r => setPerf(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPerf(false));
  }, []);

  const loadTargets = useCallback(() => {
    setLoadingTargets(true);
    getTeamTargetsApi(month, year)
      .then(r => setTargets(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingTargets(false));
  }, [month, year]);

  useEffect(() => { loadPerf(); loadTargets(); }, [loadPerf, loadTargets]);

  const handleSaveTarget = async (userId: string, m: number, y: number, value: number, units: number) => {
    await setTargetApi({ user_id: userId, month: m, year: y, target_value: value, target_units: units });
    setTargets(prev => prev.map(row =>
      row.user.id === userId
        ? { ...row, target: { ...(row.target ?? { id: "" }), target_value: value, target_units: units } }
        : row
    ));
  };

  const hasAnyTarget = targets.some(t => t.target !== null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <TbChartBar className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Team Analysis</h1>
          <p className="text-sm text-gray-500">Performance metrics and monthly targets for your reps</p>
        </div>
      </div>

      {/* ── Section 1: Performance ── */}
      <section>
        <h2 className="text-base font-bold text-[#1a1a1a] mb-4">Rep Performance</h2>
        {loadingPerf ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
          </div>
        ) : perf.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <TbChartBar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No rep data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perf.map(rep => <PerfCard key={rep.user.id} rep={rep} />)}
          </div>
        )}
      </section>

      {/* ── Section 2: Sales Targets ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1a1a1a]">
            Sales Targets — {MONTHS[month]} {year}
          </h2>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4">
          <IoWarningOutline className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700">
            Targets you set here are visible to the rep in their dashboard. Each rep can track their
            monthly sales value and units progress against these targets.
          </p>
        </div>

        {loadingTargets ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
          </div>
        ) : targets.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm">No reps found in your company</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
            {!hasAnyTarget && (
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <IoWarningOutline className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">No targets set for this month yet. Click "Set" on any row to add one.</p>
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-gray-500">Rep</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-gray-500">Sales Value (UGX)</th>
                  <th className="py-2.5 px-2 text-center text-xs font-semibold text-gray-500">Units Target</th>
                  <th className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(row => (
                  <TargetRowEdit key={row.user.id} row={row} onSave={handleSaveTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analysis;
