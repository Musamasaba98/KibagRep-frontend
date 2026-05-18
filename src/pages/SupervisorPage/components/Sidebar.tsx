import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { BsBell } from "react-icons/bs";
import { IoCalendarOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { TbReport } from "react-icons/tb";
import { LuClipboardCheck, LuStethoscope, LuMap } from "react-icons/lu";
import { TbChartBar } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { logout } from "../../../store/authSlice";
import {
  getPendingReportsApi,
  getPendingCyclesApi,
  getPendingExpenseClaimsApi,
  getRecommendationsApi,
} from "../../../services/api";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.allSettled([
      getPendingReportsApi(),
      getPendingCyclesApi(),
      getPendingExpenseClaimsApi(),
      getRecommendationsApi(),
    ]).then(([reports, cycles, expenses, recs]) => {
      let total = 0;
      if (reports.status === "fulfilled") total += (reports.value.data?.data ?? []).length;
      if (cycles.status === "fulfilled") total += (cycles.value.data?.data ?? []).length;
      if (expenses.status === "fulfilled") total += (expenses.value.data?.data ?? []).length;
      if (recs.status === "fulfilled") {
        const pending = (recs.value.data?.data ?? []).filter((r: { status: string }) => r.status === "PENDING");
        total += pending.length;
      }
      setPendingCount(total);
    });
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
      isActive
        ? "bg-[#f0fdf4] text-[#16a34a] font-poppins-semibold"
        : "text-[#444] hover:bg-gray-50 hover:text-[#16a34a]"
    }`;

  const navLinks = [
    { to: "/supervisor",           end: true,  icon: FaHouse,          label: "Dashboard"     },
    { to: "/supervisor/reps",                  icon: FaUserGroup,      label: "My Reps"       },
    { to: "/supervisor/approvals",             icon: LuClipboardCheck, label: "Approvals",    showBadge: true },
    { to: "/supervisor/cycles",                icon: IoCalendarOutline,label: "Call Cycles"   },
    { to: "/supervisor/map",                   icon: LuMap,            label: "Team Map"      },
    { to: "/supervisor/analysis",              icon: TbChartBar,       label: "Analysis"      },
    { to: "/supervisor/doctors",               icon: LuStethoscope,    label: "HCP Directory" },
    { to: "/supervisor/jfw",                   icon: GrTask,           label: "JFW"           },
    { to: "/supervisor/reports",               icon: TbReport,         label: "Reports"       },
  ];

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)]">
      <div className="h-[60px] flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-poppins-extrabold text-xl text-[#1a1a1a] tracking-tight">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <p className="text-xs text-[#454545] leading-none mt-0.5 font-poppins">SUPERVISOR DASHBOARD</p>
        </div>
      </div>

      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {navLinks.map(({ to, end, icon: Icon, label, showBadge }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            {({ isActive }) => (
              <>
                <Icon className="w-[19px] h-[19px] shrink-0" />
                <span className="text-[15px] font-poppins flex-1">{label}</span>
                {showBadge && !isActive && pendingCount !== null && pendingCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-poppins flex items-center justify-center shrink-0">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
        <button
          onClick={() => navigate("/supervisor/approvals")}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <div className="relative flex-shrink-0">
            <BsBell className="w-[19px] h-[19px]" />
            {pendingCount !== null && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
            )}
          </div>
          <span className="text-[15px] font-poppins flex-1">Notifications</span>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="text-xs font-semibold text-orange-500">{pendingCount}</span>
          )}
        </button>
        <button
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <GoGear className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px] font-poppins">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <SlLogout className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px] font-poppins">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
