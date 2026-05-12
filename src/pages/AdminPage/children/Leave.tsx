import { LuCalendarClock, LuClipboardList, LuBadgeCheck, LuUsers } from "react-icons/lu";

// Leave Management — Phase 2 module
// Backend endpoints for leave requests are not yet implemented.
// This page shows the planned feature surface so stakeholders can preview the UX.

const FEATURES = [
  {
    icon: LuClipboardList,
    title: "Leave Requests",
    desc: "Reps submit leave requests (annual, sick, compassionate) directly from their portal. Admin sees all pending requests with one-click approve / reject.",
    color: "text-[#16a34a]", bg: "bg-[#f0fdf4]", border: "border-[#dcfce7]",
  },
  {
    icon: LuCalendarClock,
    title: "Leave Calendar",
    desc: "Company-wide calendar view showing who is on leave each day. Avoids scheduling conflicts and helps supervisors plan Joint Field Work.",
    color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100",
  },
  {
    icon: LuBadgeCheck,
    title: "Leave Balances",
    desc: "Per-employee annual leave balance tracking — days accrued, days taken, days remaining. Visible to both the rep and HR admin.",
    color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100",
  },
  {
    icon: LuUsers,
    title: "Welfare Log",
    desc: "HR admin can record welfare incidents (medical, bereavement, disciplinary) against an employee's profile with private notes.",
    color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100",
  },
];

const Leave = () => {
  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Leave Management</h1>
        <p className="text-gray-400 text-sm mt-0.5">Employee leave requests, balances, and welfare tracking</p>
      </div>

      {/* Phase 2 banner */}
      <div className="bg-[#0f2318] rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="w-12 h-12 rounded-xl bg-[#16a34a]/20 flex items-center justify-center shrink-0">
          <LuCalendarClock className="w-6 h-6 text-[#16a34a]" />
        </div>
        <div>
          <p className="font-black text-white text-lg leading-tight">Coming in Phase 2</p>
          <p className="text-white/60 text-sm mt-2 leading-relaxed max-w-lg">
            The Leave Management module is planned for Phase 2. The backend API endpoints
            for leave requests, balances, and approvals will be built and connected here.
            Below is a preview of the features that will be available.
          </p>
        </div>
      </div>

      {/* Feature previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`bg-white rounded-2xl border ${f.border} p-5 flex flex-col gap-3 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]`}
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <p className="font-bold text-[#1a1a1a] text-sm">{f.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
              </div>
              <span className="inline-flex items-center self-start text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 mt-auto">
                Phase 2
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leave;
