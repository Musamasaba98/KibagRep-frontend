import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserDoctor, FaHospital, FaBoxOpen, FaBuildingColumns,
  FaFileArrowUp, FaFileLines, FaCirclePlus, FaUsers,
  FaReceipt,
} from "react-icons/fa6";
import { RiFileExcel2Line } from "react-icons/ri";
import { LuTrendingUp, LuCircleCheck, LuCircleX, LuTriangleAlert } from "react-icons/lu";
import { format, subDays } from "date-fns";
import {
  getDoctorsApi,
  getPharmaciesApi,
  getCompanyProductsApi,
  getFacilitiesApi,
  getCompanyUsersApi,
  getCompanyFeedApi,
  getPendingExpenseClaimsApi,
  getCompanyReportsApi,
} from "../../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface MasterCounts {
  doctors: number | null;
  pharmacies: number | null;
  products: number | null;
  facilities: number | null;
}

interface PeopleKpis {
  totalReps: number | null;
  activeToday: number | null;
  pendingExpenses: number | null;
  compliancePct: number | null;
}

interface RepCompliance {
  id: string;
  name: string;
  submitted: number;   // days submitted out of last 7
  total: number;       // working days = 7
}

// ── Sub-components ─────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
);

const MasterCard = ({
  label, count, subtitle, icon: Icon, iconBg, iconColor, countColor, shadow, loading,
}: {
  label: string; count: number | null; subtitle: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  countColor: string; shadow: string; loading: boolean;
}) => (
  <div className={`bg-white rounded-xl p-5 flex items-start gap-4 flex-1 min-w-[180px] ${shadow}`}>
    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      {loading ? (
        <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className={`text-3xl font-extrabold leading-tight ${countColor}`}>
          {count?.toLocaleString() ?? "—"}
        </p>
      )}
      <p className="text-[#212121] font-semibold text-sm mt-0.5">{label}</p>
      <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const PeopleCard = ({
  label, value, sub, icon: Icon, gradient, shadow, loading,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; gradient: string; shadow: string; loading: boolean;
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} cursor-default`}
    style={{ transition: "transform 0.2s ease" }}
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
    <div className="relative z-10">
      {loading ? (
        <div className="mb-3"><Spinner /></div>
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

// ── Main component ─────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [masterLoading, setMasterLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(true);

  const [counts, setCounts] = useState<MasterCounts>({ doctors: null, pharmacies: null, products: null, facilities: null });
  const [kpis, setKpis] = useState<PeopleKpis>({ totalReps: null, activeToday: null, pendingExpenses: null, compliancePct: null });
  const [repCompliance, setRepCompliance] = useState<RepCompliance[]>([]);

  // ── Load master data counts ──────────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      getDoctorsApi(),
      getPharmaciesApi(),
      getCompanyProductsApi(),
      getFacilitiesApi(),
    ]).then(([doc, pha, pro, fac]) => {
      setCounts({
        doctors:    doc.status === "fulfilled" ? (doc.value.data?.data ?? doc.value.data ?? []).length : null,
        pharmacies: pha.status === "fulfilled" ? (pha.value.data?.data ?? pha.value.data ?? []).length : null,
        products:   pro.status === "fulfilled" ? (pro.value.data?.data ?? pro.value.data ?? []).length : null,
        facilities: fac.status === "fulfilled" ? (fac.value.data?.data ?? fac.value.data ?? []).length : null,
      });
    }).finally(() => setMasterLoading(false));
  }, []);

  // ── Load people KPIs ─────────────────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyFeedApi({ days: 1 }),
      getPendingExpenseClaimsApi(),
    ]).then(([usersRes, feedRes, expRes]) => {
      const users: any[] = usersRes.status === "fulfilled"
        ? (usersRes.value.data?.data ?? usersRes.value.data ?? [])
        : [];

      const reps = users.filter((u) => u.role === "MedicalRep");
      const totalReps = reps.length;

      const activeToday = feedRes.status === "fulfilled"
        ? (feedRes.value.data?.summary ?? []).filter((s: any) => (s.visits ?? 0) > 0).length
        : null;

      const pendingExpenses = expRes.status === "fulfilled"
        ? (expRes.value.data?.data ?? []).length
        : null;

      setKpis((prev) => ({ ...prev, totalReps, activeToday, pendingExpenses }));
    }).finally(() => setPeopleLoading(false));
  }, []);

  // ── Load compliance (reps vs 7-day report submissions) ───────────────────
  useEffect(() => {
    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyReportsApi("days=7"),
    ]).then(([usersRes, reportsRes]) => {
      const users: any[] = usersRes.status === "fulfilled"
        ? (usersRes.value.data?.data ?? usersRes.value.data ?? [])
        : [];
      const reports: any[] = reportsRes.status === "fulfilled"
        ? (reportsRes.value.data?.data ?? [])
        : [];

      const reps = users.filter((u) => u.role === "MedicalRep");

      // Build set of (userId, date) pairs that were submitted
      const submittedSet = new Set<string>();
      reports.forEach((r: any) => {
        if (r.user?.id && r.report_date) {
          try {
            const key = `${r.user.id}__${format(new Date(r.report_date), "yyyy-MM-dd")}`;
            submittedSet.add(key);
          } catch { /* skip */ }
        }
      });

      // For each rep, count submitted days in last 7
      const last7 = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), i + 1), "yyyy-MM-dd")
      );

      const complianceRows: RepCompliance[] = reps.map((u) => ({
        id: u.id,
        name: `${u.firstname} ${u.lastname}`,
        submitted: last7.filter((d) => submittedSet.has(`${u.id}__${d}`)).length,
        total: 7,
      })).sort((a, b) => a.submitted - b.submitted);

      // Avg compliance %
      if (complianceRows.length > 0) {
        const avg = Math.round(
          complianceRows.reduce((s, r) => s + (r.submitted / r.total) * 100, 0) / complianceRows.length
        );
        setKpis((prev) => ({ ...prev, compliancePct: avg }));
      }

      setRepCompliance(complianceRows);
    }).finally(() => setCompLoading(false));
  }, []);

  // ── Quick actions config ─────────────────────────────────────────────────
  const quickActions = [
    { icon: RiFileExcel2Line, iconColor: "text-[#16a34a]", iconBg: "bg-green-50", title: "Upload Doctor List", desc: "Bulk import from Excel", to: "/sales-admin/upload" },
    { icon: FaFileArrowUp, iconColor: "text-teal-600", iconBg: "bg-teal-50", title: "Upload Pharmacy List", desc: "Bulk import from Excel", to: "/sales-admin/upload" },
    { icon: FaCirclePlus, iconColor: "text-purple-600", iconBg: "bg-purple-50", title: "Add Team Member", desc: "Register a new user", to: "/sales-admin/users" },
    { icon: FaFileLines, iconColor: "text-amber-600", iconBg: "bg-amber-50", title: "Generate Report", desc: "Export filtered field data", to: "/sales-admin/reports" },
  ];

  // ── People KPI card config ───────────────────────────────────────────────
  const peopleCards = [
    { label: "Total Reps", value: String(kpis.totalReps ?? "—"), sub: "Enrolled in company", icon: FaUsers, gradient: "from-[#16a34a] to-[#15803d]", shadow: "shadow-green-200" },
    { label: "Active Today", value: String(kpis.activeToday ?? "—"), sub: "Reps with a visit logged", icon: LuTrendingUp, gradient: "from-sky-500 to-sky-600", shadow: "shadow-sky-100" },
    { label: "Pending Expenses", value: String(kpis.pendingExpenses ?? "—"), sub: "Awaiting review", icon: FaReceipt,
      gradient: (kpis.pendingExpenses ?? 0) > 0 ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500",
      shadow: (kpis.pendingExpenses ?? 0) > 0 ? "shadow-orange-100" : "shadow-gray-100",
    },
    { label: "Report Compliance", value: kpis.compliancePct != null ? `${kpis.compliancePct}%` : "—", sub: "Daily reports, last 7 days", icon: LuCircleCheck,
      gradient: (kpis.compliancePct ?? 0) >= 70 ? "from-violet-500 to-violet-600" : (kpis.compliancePct ?? 0) >= 50 ? "from-amber-500 to-amber-600" : "from-gray-400 to-gray-500",
      shadow: (kpis.compliancePct ?? 0) >= 70 ? "shadow-violet-100" : "shadow-gray-100",
    },
  ];

  return (
    <div className="w-full p-6 flex flex-col gap-6">

      {/* ── Section 1: Master Data Summary ── */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Master Data</h2>
        <div className="flex flex-wrap gap-4">
          <MasterCard label="Doctors" count={counts.doctors} subtitle="in master database" icon={FaUserDoctor}
            iconBg="bg-green-100" iconColor="text-[#16a34a]" countColor="text-[#16a34a]"
            shadow="shadow-[0_2px_12px_0_rgba(22,163,74,0.10)]" loading={masterLoading} />
          <MasterCard label="Pharmacies" count={counts.pharmacies} subtitle="registered pharmacies" icon={FaHospital}
            iconBg="bg-teal-100" iconColor="text-teal-600" countColor="text-teal-600"
            shadow="shadow-[0_2px_12px_0_rgba(13,148,136,0.10)]" loading={masterLoading} />
          <MasterCard label="Products" count={counts.products} subtitle="active product SKUs" icon={FaBoxOpen}
            iconBg="bg-purple-100" iconColor="text-purple-600" countColor="text-purple-600"
            shadow="shadow-[0_2px_12px_0_rgba(147,51,234,0.10)]" loading={masterLoading} />
          <MasterCard label="Facilities" count={counts.facilities} subtitle="health facilities" icon={FaBuildingColumns}
            iconBg="bg-amber-100" iconColor="text-amber-600" countColor="text-amber-600"
            shadow="shadow-[0_2px_12px_0_rgba(217,119,6,0.10)]" loading={masterLoading} />
        </div>
      </div>

      {/* ── Section 2: People KPIs ── */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Field Force</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {peopleCards.map((card) => (
            <PeopleCard key={card.label} {...card} loading={peopleLoading || compLoading} />
          ))}
        </div>
      </div>

      {/* ── Section 3: Quick Actions ── */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
        <h2 className="text-[#212121] font-bold text-base mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer bg-white hover:bg-green-50 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-1 text-left"
                style={{ transition: "background-color 0.15s, border-color 0.15s" }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${action.iconBg}`}>
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="text-[#212121] font-semibold text-sm leading-snug">{action.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Field Compliance Table ── */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[#212121] font-bold text-base">Field Compliance</h2>
            <p className="text-xs text-gray-400 mt-0.5">Daily report submissions — last 7 working days</p>
          </div>
          {compLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          )}
        </div>

        {compLoading ? (
          <div className="flex flex-col gap-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : repCompliance.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No medical reps found.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {repCompliance.map((rep) => {
              const pct = Math.round((rep.submitted / rep.total) * 100);
              const isGood = pct >= 80;
              const isMid  = pct >= 50;
              const barColor = isGood ? "#16a34a" : isMid ? "#f59e0b" : "#ef4444";
              const StatusIcon = isGood ? LuCircleCheck : isMid ? LuTriangleAlert : LuCircleX;
              const iconClass  = isGood ? "text-[#16a34a]" : isMid ? "text-amber-500" : "text-red-500";
              return (
                <div key={rep.id} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                    <span className="text-[#16a34a] font-black text-[10px]">
                      {rep.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  {/* Name */}
                  <p className="flex-1 min-w-0 font-semibold text-[#1a1a1a] text-sm truncate">{rep.name}</p>
                  {/* Status icon */}
                  <StatusIcon className={`w-4 h-4 shrink-0 ${iconClass}`} />
                  {/* Bar */}
                  <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.4s ease" }}
                    />
                  </div>
                  {/* Count */}
                  <span className="text-xs font-semibold text-gray-500 w-16 text-right shrink-0">
                    {rep.submitted}/{rep.total} days
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
