import { useSelector } from "react-redux";
import { LuLock, LuTriangleAlert, LuPhone, LuMail } from "react-icons/lu";
import { usePlanStatus } from "../hooks/usePlanStatus";

const ADMIN_ROLES = ["COUNTRY_MGR", "SALES_ADMIN", "SUPER_ADMIN"];

interface PlanGateProps {
  children: React.ReactNode;
}

// Wraps an entire dashboard layout. Shows lock screens when the company
// subscription has expired. Trial countdown banner appears for COUNTRY_MGR
// and SALES_ADMIN only — reps and managers see no banner during active trial.
const PlanGate = ({ children }: PlanGateProps) => {
  const role = useSelector((s: any) => s.auth?.role ?? s.auth?.user?.role);
  const { planStatus, loading } = usePlanStatus();

  if (loading) return <>{children}</>;
  if (!planStatus || planStatus.status === "no_company" || planStatus.status === "active") {
    return <>{children}</>;
  }

  const isAdmin = ADMIN_ROLES.includes(role);

  // Hard lock — show full-screen block
  if (planStatus.status === "hard_locked") {
    if (isAdmin) {
      return <AdminHardLockScreen lockReason={planStatus.lock_reason} />;
    }
    return <UserHardLockScreen />;
  }

  // Soft lock (3-day grace after expiry) — let them in but show urgent banner
  if (planStatus.status === "soft_locked") {
    return (
      <div className="flex flex-col h-screen">
        {isAdmin && <SoftLockBanner />}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  // Trial expiring (≤7 days left) — show countdown banner for admins only
  if ((planStatus.status === "trial" || planStatus.status === "trial_expiring") && isAdmin) {
    return (
      <div className="flex flex-col h-screen">
        <TrialBanner daysLeft={planStatus.trial_days_left} expiring={planStatus.status === "trial_expiring"} />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
};

// ─── Trial countdown banner ───────────────────────────────────────────────────
const TrialBanner = ({ daysLeft, expiring }: { daysLeft: number | null; expiring: boolean }) => (
  <div className={`shrink-0 px-4 py-2 flex items-center justify-between gap-4 text-xs font-poppins-semibold ${
    expiring ? "bg-orange-500 text-white" : "bg-amber-50 border-b border-amber-200 text-amber-800"
  }`}>
    <div className="flex items-center gap-2">
      <LuTriangleAlert size={14} className="shrink-0" />
      {daysLeft !== null && daysLeft > 0
        ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Contact KibagRep to activate your plan.`
        : "Your trial has ended — contact KibagRep to continue."}
    </div>
    <a href="mailto:support@kibagrep.com" className="underline whitespace-nowrap">
      support@kibagrep.com
    </a>
  </div>
);

// ─── Soft lock banner ─────────────────────────────────────────────────────────
const SoftLockBanner = () => (
  <div className="shrink-0 bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-4 text-xs font-poppins-semibold">
    <div className="flex items-center gap-2">
      <LuTriangleAlert size={14} className="shrink-0" />
      Your subscription has expired. Access will be fully suspended in 3 days. Please settle your payment immediately.
    </div>
    <a href="mailto:support@kibagrep.com" className="underline whitespace-nowrap">
      support@kibagrep.com
    </a>
  </div>
);

// ─── Hard lock — admin view (Country Manager / Sales Admin) ──────────────────
const AdminHardLockScreen = ({ lockReason }: { lockReason: string | null }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <LuLock className="text-red-600" size={26} />
      </div>
      <h1 className="font-poppins-extrabold text-xl text-gray-900 mb-2">Account Suspended</h1>
      <p className="text-gray-500 font-poppins text-sm leading-relaxed mb-6">
        {lockReason
          ? lockReason
          : "Your KibagRep subscription has expired. Please make your payment to restore access for your entire team."}
      </p>

      <div className="bg-gray-50 rounded-xl p-5 text-left mb-6 space-y-3">
        <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-3">How to pay</p>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-poppins">
          <LuPhone size={15} className="text-[#16a34a] shrink-0" />
          <span>Call or WhatsApp: <span className="font-poppins-semibold">+256 700 000 000</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-poppins">
          <LuMail size={15} className="text-[#16a34a] shrink-0" />
          <a href="mailto:billing@kibagrep.com" className="font-poppins-semibold text-[#16a34a] hover:underline">
            billing@kibagrep.com
          </a>
        </div>
        <p className="text-xs text-gray-400 font-poppins pt-1">
          MTN MoMo · Airtel Money · Bank transfer accepted. Access restored within 2 hours of payment confirmation.
        </p>
      </div>

      <p className="text-xs text-gray-400 font-poppins">
        Once payment is confirmed, your KibagRep account manager will restore access.
      </p>
    </div>
  </div>
);

// ─── Hard lock — rep / supervisor / manager view ──────────────────────────────
const UserHardLockScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-sm w-full p-8 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <LuLock className="text-red-600" size={26} />
      </div>
      <h1 className="font-poppins-extrabold text-xl text-gray-900 mb-2">Access Suspended</h1>
      <p className="text-gray-500 font-poppins text-sm leading-relaxed mb-6">
        Your company's KibagRep subscription has expired. Please contact your Country Manager or Admin to renew access.
      </p>
      <p className="text-xs text-gray-400 font-poppins">
        Your data and reports are safe — access will be restored once your company renews.
      </p>
    </div>
  </div>
);

export default PlanGate;
