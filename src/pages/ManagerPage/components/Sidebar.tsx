import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { BsBell } from "react-icons/bs";
import { IoCalendarOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { TbReport } from "react-icons/tb";
import { LuChartNoAxesCombined, LuStethoscope, LuClipboardCheck, LuCalendarDays, LuArrowRightLeft } from "react-icons/lu";
import { GrTask } from "react-icons/gr";
import { FiMapPin } from "react-icons/fi";
import { logout } from "../../../store/authSlice";
import {
  getPendingReportsApi, getPendingExpenseClaimsApi,
  getPendingCyclesApi, getPendingTourPlansApi,
} from "../../../services/api";

const Sidebar = ({ onNav }: { onNav?: () => void }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.allSettled([
      getPendingReportsApi(),
      getPendingExpenseClaimsApi(),
      getPendingCyclesApi(),
      getPendingTourPlansApi(),
    ]).then(([reports, expenses, cycles, tourplans]) => {
      let total = 0;
      if (reports.status === "fulfilled") total += (reports.value.data?.data ?? []).length;
      if (expenses.status === "fulfilled") total += (expenses.value.data?.data ?? []).length;
      if (cycles.status === "fulfilled") total += (cycles.value.data?.data ?? []).length;
      if (tourplans.status === "fulfilled") total += (tourplans.value.data?.data ?? []).length;
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
    { to: "/manager",             end: true,  icon: FaHouse,                     label: "Dashboard"     },
    { to: "/manager/teams",                   icon: FaUserGroup,                 label: "My Teams"      },
    { to: "/manager/tasks",                   icon: GrTask,                      label: "Tasks"         },
    { to: "/manager/doctors",                 icon: LuStethoscope,               label: "HCP Directory" },
    { to: "/manager/approvals",               icon: LuClipboardCheck,            label: "Approvals",    showBadge: true },
    { to: "/manager/cycles",                  icon: LuCalendarDays,              label: "Call Cycles"   },
    { to: "/manager/reports",                 icon: TbReport,                    label: "Reports"       },
    { to: "/manager/analytics",               icon: LuChartNoAxesCombined,       label: "Analytics"     },
    { to: "/manager/messaging",               icon: IoChatbubbleEllipsesOutline, label: "Messaging"     },
    { to: "/manager/calendar",                icon: IoCalendarOutline,           label: "Calendar"      },
    { to: "/manager/territories",             icon: FiMapPin,                    label: "Territories"   },
  ];

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)]">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-poppins-extrabold text-xl text-[#1a1a1a] tracking-tight">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <p className="text-xs text-gray-400 font-poppins leading-none mt-0.5 font-medium">MANAGER DASHBOARD</p>
        </div>
      </div>

      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {navLinks.map(({ to, end, icon: Icon, label, showBadge }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => onNav?.()}>
            {({ isActive }) => (
              <>
                <Icon className="w-[19px] h-[19px] shrink-0" />
                <span className="text-[15px] font-poppins flex-1">{label}</span>
                {showBadge && !isActive && pendingCount !== null && pendingCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* View switching — Manager can act as Supervisor */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <p className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Switch View</p>
        <button
          onClick={() => navigate("/supervisor")}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[#444] hover:bg-amber-50 hover:text-amber-700 text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <LuArrowRightLeft className="w-[17px] h-[17px] shrink-0" />
          <span className="text-[13px] font-poppins">Supervisor View</span>
        </button>
      </div>

      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
        <button
          onClick={() => navigate("/manager/reports")}
          className="flex items-center font-poppins gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <div className="relative flex-shrink-0">
            <BsBell className="w-[19px] h-[19px]" />
            {pendingCount !== null && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
            )}
          </div>
          <span className="text-[15px] flex-1">Notifications</span>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="text-xs font-poppins-semibold text-orange-500">{pendingCount}</span>
          )}
        </button>
        <button
          className="flex items-center font-poppins gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <GoGear className="w-[19px] font-poppins h-[19px] shrink-0" />
          <span className="text-[15px]">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center font-poppins gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <SlLogout className="w-[19px] h-[19px] shrink-0" />
          <span className="text-[15px] font-poppins">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
