import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FaUserGroup } from "react-icons/fa6";
import {
  LuClipboardCheck,
  LuWallet,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuUsers,
} from "react-icons/lu";
import { MdOutlineWarningAmber } from "react-icons/md";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import {
  getPendingReportsApi,
  getPendingExpenseClaimsApi,
  approveExpenseClaimApi,
  rejectExpenseClaimApi,
  getTeamsApi,
} from "../../services/api";
import Navabar from "./components/Navabar";
import Sidebar from "./components/Sidebar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PendingReport {
  id: string;
  report_date: string;
  visits_count: number;
  samples_count: number;
  status: string;
  user?: { id: string; firstname: string; lastname: string; role: string };
}

interface ExpenseClaim {
  id: string;
  period: string;
  total_amount: number;
  status: string;
  created_at: string;
  user?: { id: string; firstname: string; lastname: string };
  items?: Array<{ id: string; category: string; description: string; amount: number }>;
}

interface Team {
  id: string;
  team_name: string;
  date_of_creation: string;
}

// ─── KPI card ────────────────────────────────────────────────────────────────

const KpiCard = ({
  label, value, sub, icon: Icon, gradient, shadow, loading,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; gradient: string; shadow: string; loading: boolean;
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow}`}
  >
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

// ─── Initials avatar ─────────────────────────────────────────────────────────

const Avatar = ({ first, last }: { first?: string; last?: string }) => (
  <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
    <span className="text-[#16a34a] font-black text-xs">
      {first ? `${first[0]}${last?.[0] ?? ""}`.toUpperCase() : "?"}
    </span>
  </div>
);

// ─── Main page ───────────────────────────────────────────────────────────────

const AdminPage = () => {
  const [reports, setReports]     = useState<PendingReport[]>([]);
  const [expenses, setExpenses]   = useState<ExpenseClaim[]>([]);
  const [teams, setTeams]         = useState<Team[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      getPendingReportsApi(),
      getPendingExpenseClaimsApi(),
      getTeamsApi(),
    ]).then(([rRes, eRes, tRes]) => {
      if (rRes.status === "fulfilled") setReports(rRes.value.data?.data ?? []);
      if (eRes.status === "fulfilled") setExpenses(eRes.value.data?.data ?? []);
      if (tRes.status === "fulfilled") setTeams(tRes.value.data?.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleApproveExpense = async (id: string) => {
    setActioning(id);
    try { await approveExpenseClaimApi(id); load(); } catch { } finally { setActioning(null); }
  };

  const handleRejectExpense = async (id: string) => {
    setActioning(id);
    try { await rejectExpenseClaimApi(id); load(); } catch { } finally { setActioning(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Navabar />

        <div className="p-6 flex flex-col gap-6">

          {/* ── Page title ── */}
          <div>
            <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">Compliance, team oversight, and expense approvals</p>
          </div>

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Pending Reports"
              value={reports.length}
              sub="Reps awaiting approval"
              icon={LuClipboardCheck}
              gradient={reports.length > 0 ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500"}
              shadow={reports.length > 0 ? "shadow-orange-100" : "shadow-gray-100"}
              loading={loading}
            />
            <KpiCard
              label="Expense Claims"
              value={expenses.length}
              sub="Submitted, awaiting review"
              icon={LuWallet}
              gradient={expenses.length > 0 ? "from-violet-500 to-violet-600" : "from-gray-400 to-gray-500"}
              shadow="shadow-violet-100"
              loading={loading}
            />
            <KpiCard
              label="Teams"
              value={teams.length}
              sub="Active sales teams"
              icon={FaUserGroup}
              gradient="from-[#16a34a] to-[#15803d]"
              shadow="shadow-green-200"
              loading={loading}
            />
            <KpiCard
              label="Non-Compliant"
              value={reports.length}
              sub="Reports not yet submitted"
              icon={MdOutlineWarningAmber}
              gradient={reports.length > 0 ? "from-amber-400 to-amber-500" : "from-gray-400 to-gray-500"}
              shadow="shadow-amber-100"
              loading={loading}
            />
          </div>

          {/* ── Rep compliance ── */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm shadow-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-[15px]">Rep Compliance</h2>
                <p className="text-xs text-gray-400 mt-0.5">Reps with pending daily reports</p>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                {reports.length} pending
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 px-6 py-8 text-gray-400 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
                Loading…
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FiCheckCircle className="w-10 h-10 text-[#16a34a] mb-3" />
                <p className="text-gray-600 font-semibold">All reps compliant!</p>
                <p className="text-gray-400 text-sm mt-1">No pending reports at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Report Date</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Visits</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar first={r.user?.firstname} last={r.user?.lastname} />
                            <span className="font-semibold text-[#1a1a1a]">
                              {r.user ? `${r.user.firstname} ${r.user.lastname}` : "Unknown Rep"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {format(new Date(r.report_date), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{r.visits_count}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                            <LuClock className="w-3 h-3" />
                            Submitted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Expense claims ── */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm shadow-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-[15px]">Expense Claims</h2>
                <p className="text-xs text-gray-400 mt-0.5">Submitted claims awaiting approval</p>
              </div>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {expenses.length} pending
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 px-6 py-8 text-gray-400 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
                Loading…
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LuCircleCheck className="w-10 h-10 text-[#16a34a] mb-3" />
                <p className="text-gray-600 font-semibold">No pending claims</p>
                <p className="text-gray-400 text-sm mt-1">All expense claims have been reviewed.</p>
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
                      <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar first={e.user?.firstname} last={e.user?.lastname} />
                            <span className="font-semibold text-[#1a1a1a]">
                              {e.user ? `${e.user.firstname} ${e.user.lastname}` : "Unknown Rep"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.period}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {e.total_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveExpense(e.id)}
                              disabled={actioning === e.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
                            >
                              <FiCheckCircle className="w-3 h-3" />
                              {actioning === e.id ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectExpense(e.id)}
                              disabled={actioning === e.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 transition-colors"
                            >
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

          {/* ── Teams ── */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm shadow-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-[15px]">Sales Teams</h2>
                <p className="text-xs text-gray-400 mt-0.5">All registered teams in the company</p>
              </div>
              <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-full border border-[#dcfce7]">
                {teams.length} teams
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 px-6 py-8 text-gray-400 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
                Loading…
              </div>
            ) : teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LuUsers className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-semibold">No teams yet</p>
                <p className="text-gray-400 text-sm mt-1">Teams will appear here once created.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {teams.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                      <FaUserGroup className="w-4 h-4 text-[#16a34a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1a1a] text-sm">{t.team_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Created {format(new Date(t.date_of_creation), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Coming soon placeholders ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["Leave Management", "Training & Compliance"].map((label) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-8 flex flex-col items-center justify-center text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                  <LuClock className="w-5 h-5 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500 text-sm">{label}</p>
                <p className="text-xs text-gray-300 mt-1">Backend module coming in Phase 2</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPage;
