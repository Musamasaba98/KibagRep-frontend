import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, isWeekend } from "date-fns";
import { FaUserGroup } from "react-icons/fa6";
import { LuClipboardCheck, LuWallet, LuShieldCheck, LuCircleCheck, LuCircleX, LuTriangleAlert } from "react-icons/lu";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import {
  getPendingReportsApi,
  getPendingExpenseClaimsApi,
  approveExpenseClaimApi,
  rejectExpenseClaimApi,
  getCompanyUsersApi,
  getCompanyTeamsApi,
  getCompanyReportsApi,
} from "../../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExpenseClaim {
  id: string; period: string; total_amount: number; status: string; created_at: string;
  user?: { id: string; firstname: string; lastname: string };
}
interface RepRow {
  id: string; name: string; submitted: number; total: number;
}
interface RoleCount { role: string; count: number; color: string; bg: string; }

// ── Helpers ────────────────────────────────────────────────────────────────

const Avatar = ({ first, last }: { first?: string; last?: string }) => (
  <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
    <span className="text-[#16a34a] font-black text-xs">
      {first ? `${first[0]}${last?.[0] ?? ""}`.toUpperCase() : "?"}
    </span>
  </div>
);

const KpiCard = ({ label, value, sub, icon: Icon, gradient, shadow, loading }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; gradient: string; shadow: string; loading: boolean;
}) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow}`}>
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
    <div className="relative z-10">
      {loading ? (
        <div className="w-7 h-7 rounded-full border-[3px] border-white/30 border-t-white animate-spin mb-3" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <p className="font-black text-white text-3xl leading-none">{loading ? "—" : value}</p>
      <p className="text-white/90 font-bold text-[13px] mt-2 leading-tight">{label}</p>
      <p className="text-white/60 text-xs mt-0.5">{sub}</p>
    </div>
  </div>
);

// ── Reject modal ───────────────────────────────────────────────────────────

const RejectModal = ({ claimId, repName, onConfirm, onCancel, loading }: {
  claimId: string; repName: string;
  onConfirm: (id: string, reason: string) => void;
  onCancel: () => void; loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <LuTriangleAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-[#1a1a1a] text-base leading-tight">Reject Expense Claim</p>
            <p className="text-xs text-gray-400 mt-0.5">{repName}</p>
          </div>
        </div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Missing receipts for accommodation items"
          rows={3}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-none"
          autoFocus
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none"
            style={{ transition: "background-color 0.15s" }}>
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(claimId, reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            style={{ transition: "background-color 0.15s" }}>
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses]     = useState<ExpenseClaim[]>([]);
  const [repRows, setRepRows]       = useState<RepRow[]>([]);
  const [roleCounts, setRoleCounts] = useState<RoleCount[]>([]);
  const [teamCount, setTeamCount]   = useState<number | null>(null);

  const [kpiPending, setKpiPending]     = useState<number | null>(null);
  const [kpiExpenses, setKpiExpenses]   = useState<number | null>(null);
  const [kpiCompliance, setKpiCompliance] = useState<number | null>(null);
  const [kpiNonCompliant, setKpiNonCompliant] = useState<number | null>(null);

  const [loading, setLoading]       = useState(true);
  const [actioning, setActioning]   = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ExpenseClaim | null>(null);

  const load = () => {
    setLoading(true);
    const last7 = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), i + 1), "yyyy-MM-dd")
    );
    const weekdays = last7.filter((d) => !isWeekend(new Date(d)));

    Promise.allSettled([
      getPendingReportsApi(),
      getPendingExpenseClaimsApi(),
      getCompanyUsersApi(),
      getCompanyTeamsApi(),
      getCompanyReportsApi("days=7"),
    ]).then(([rRes, eRes, uRes, tRes, compRes]) => {

      if (rRes.status === "fulfilled") setKpiPending((rRes.value.data?.data ?? []).length);
      if (eRes.status === "fulfilled") {
        const data = eRes.value.data?.data ?? [];
        setExpenses(data.slice(0, 5)); // show top 5 on dashboard
        setKpiExpenses(data.length);
      }
      if (tRes.status === "fulfilled") setTeamCount((tRes.value.data?.data ?? []).length);

      if (uRes.status === "fulfilled" && compRes.status === "fulfilled") {
        const users: any[] = uRes.value.data?.data ?? uRes.value.data ?? [];
        const reports: any[] = compRes.value.data?.data ?? [];

        const reps = users.filter((u) => u.role === "MedicalRep");

        // Build submitted set
        const submittedSet = new Set<string>();
        reports.forEach((r: any) => {
          if (r.user?.id && r.report_date) {
            try { submittedSet.add(`${r.user.id}__${format(new Date(r.report_date), "yyyy-MM-dd")}`); } catch { }
          }
        });

        // Per-rep compliance
        const rows: RepRow[] = reps.map((u) => ({
          id: u.id,
          name: `${u.firstname} ${u.lastname}`,
          submitted: weekdays.filter((d) => submittedSet.has(`${u.id}__${d}`)).length,
          total: weekdays.length,
        })).sort((a, b) => a.submitted - b.submitted).slice(0, 8);

        setRepRows(rows);

        const avgPct = reps.length > 0
          ? Math.round(rows.reduce((s, r) => s + (r.submitted / Math.max(r.total, 1)) * 100, 0) / reps.length)
          : 0;
        const nonCompliant = rows.filter((r) => r.submitted < Math.ceil(r.total * 0.6)).length;

        setKpiCompliance(avgPct);
        setKpiNonCompliant(nonCompliant);

        // Role distribution
        const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
          MedicalRep: { color: "text-[#16a34a]", bg: "bg-green-100" },
          Supervisor:  { color: "text-teal-600",  bg: "bg-teal-100" },
          Manager:     { color: "text-amber-600", bg: "bg-amber-100" },
          COUNTRY_MGR: { color: "text-sky-600",   bg: "bg-sky-100"  },
          SALES_ADMIN: { color: "text-purple-600", bg: "bg-purple-100" },
        };
        const ROLE_LABEL: Record<string, string> = {
          MedicalRep: "Medical Reps", Supervisor: "Supervisors",
          Manager: "Managers", COUNTRY_MGR: "Country Mgrs", SALES_ADMIN: "Admins",
        };
        const counts: Record<string, number> = {};
        users.forEach((u) => { counts[u.role] = (counts[u.role] ?? 0) + 1; });
        setRoleCounts(
          Object.entries(counts)
            .filter(([role]) => ROLE_CONFIG[role])
            .map(([role, count]) => ({
              role: ROLE_LABEL[role] ?? role,
              count,
              ...ROLE_CONFIG[role]!,
            }))
            .sort((a, b) => b.count - a.count)
        );
      }

      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleApproveExpense = async (id: string) => {
    setActioning(id);
    try { await approveExpenseClaimApi(id); load(); } catch { } finally { setActioning(null); }
  };
  const handleRejectExpense = async (id: string, reason: string) => {
    setActioning(id);
    try { await rejectExpenseClaimApi(id, { note: reason }); setRejectTarget(null); load(); }
    catch { } finally { setActioning(null); }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Compliance, teams, and expense approvals</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pending Reports" value={kpiPending ?? 0} sub="Awaiting approval"
          icon={LuClipboardCheck}
          gradient={kpiPending ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500"}
          shadow={kpiPending ? "shadow-orange-100" : "shadow-gray-100"} loading={loading} />
        <KpiCard label="Expense Claims" value={kpiExpenses ?? 0} sub="Submitted, awaiting review"
          icon={LuWallet}
          gradient={kpiExpenses ? "from-violet-500 to-violet-600" : "from-gray-400 to-gray-500"}
          shadow="shadow-violet-100" loading={loading} />
        <KpiCard label="Teams" value={teamCount ?? 0} sub="Active sales teams"
          icon={FaUserGroup}
          gradient="from-[#16a34a] to-[#15803d]"
          shadow="shadow-green-200" loading={loading} />
        <KpiCard label="Non-Compliant" value={kpiNonCompliant ?? 0} sub="< 60% reports this week"
          icon={LuShieldCheck}
          gradient={kpiNonCompliant ? "from-amber-400 to-amber-500" : "from-gray-400 to-gray-500"}
          shadow="shadow-amber-100" loading={loading} />
      </div>

      {/* Two-column grid: Compliance + Team Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Compliance snapshot */}
        <div className="bg-white rounded-2xl border border-gray-50 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Compliance Snapshot</h2>
              <p className="text-xs text-gray-400 mt-0.5">Reps missing daily reports — last 7 days</p>
            </div>
            <button
              onClick={() => navigate("/admin/compliance")}
              className="text-xs font-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3].map((i) => <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />)}
            </div>
          ) : repRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <LuCircleCheck className="w-8 h-8 text-[#16a34a] mb-2" />
              <p className="text-gray-600 font-semibold text-sm">All reps compliant</p>
              <p className="text-gray-400 text-xs mt-0.5">No missing reports this week.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {repRows.map((rep) => {
                const pct = Math.round((rep.submitted / Math.max(rep.total, 1)) * 100);
                const barColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
                const StatusIcon = pct >= 80 ? LuCircleCheck : pct >= 50 ? LuTriangleAlert : LuCircleX;
                const iconClass  = pct >= 80 ? "text-[#16a34a]" : pct >= 50 ? "text-amber-500" : "text-red-500";
                return (
                  <div key={rep.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                      <span className="text-[#16a34a] font-black text-[9px]">
                        {rep.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <p className="flex-1 min-w-0 text-sm font-semibold text-[#1a1a1a] truncate">{rep.name}</p>
                    <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.4s ease" }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 w-10 text-right shrink-0">{rep.submitted}/{rep.total}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Avg compliance footer */}
          {!loading && kpiCompliance != null && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Team avg compliance</span>
              <span className={`text-sm font-black ${kpiCompliance >= 70 ? "text-[#16a34a]" : kpiCompliance >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {kpiCompliance}%
              </span>
            </div>
          )}
        </div>

        {/* Team distribution */}
        <div className="bg-white rounded-2xl border border-gray-50 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Team Distribution</h2>
              <p className="text-xs text-gray-400 mt-0.5">Staff breakdown by role</p>
            </div>
            <button
              onClick={() => navigate("/admin/teams")}
              className="text-xs font-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View teams →
            </button>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3].map((i) => <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />)}
            </div>
          ) : roleCounts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No users found.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {roleCounts.map((rc) => {
                const total = roleCounts.reduce((s, r) => s + r.count, 0);
                const pct   = Math.round((rc.count / Math.max(total, 1)) * 100);
                return (
                  <div key={rc.role} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${rc.bg} ${rc.color}`}>
                      {rc.role}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
                    </div>
                    <span className="text-sm font-black text-gray-700 w-6 text-right shrink-0">{rc.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense Claims */}
      <div className="bg-white rounded-2xl border border-gray-50 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Expense Claims</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest pending claims — approve or reject</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && kpiExpenses != null && kpiExpenses > 0 && (
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {kpiExpenses} pending
              </span>
            )}
            <button
              onClick={() => navigate("/admin/expenses")}
              className="text-xs font-semibold text-[#16a34a] hover:underline focus-visible:outline-none"
            >
              View all →
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-gray-400 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            Loading…
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LuCircleCheck className="w-8 h-8 text-[#16a34a] mb-2" />
            <p className="text-gray-600 font-semibold text-sm">No pending claims</p>
            <p className="text-gray-400 text-xs mt-1">All expense claims have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount (UGX)</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar first={e.user?.firstname} last={e.user?.lastname} />
                        <span className="font-semibold text-[#1a1a1a]">
                          {e.user ? `${e.user.firstname} ${e.user.lastname}` : "Unknown Rep"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.period}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{e.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveExpense(e.id)} disabled={actioning === e.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                          style={{ transition: "background-color 0.15s" }}>
                          <FiCheckCircle className="w-3 h-3" />
                          {actioning === e.id ? "…" : "Approve"}
                        </button>
                        <button onClick={() => setRejectTarget(e)} disabled={actioning === e.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                          style={{ transition: "background-color 0.15s" }}>
                          <FiXCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          claimId={rejectTarget.id}
          repName={rejectTarget.user ? `${rejectTarget.user.firstname} ${rejectTarget.user.lastname}` : "Unknown"}
          onConfirm={handleRejectExpense}
          onCancel={() => setRejectTarget(null)}
          loading={actioning === rejectTarget.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
