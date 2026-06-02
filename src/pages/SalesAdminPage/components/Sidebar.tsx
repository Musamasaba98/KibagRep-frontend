import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../store/authSlice";
import {
  FaHouse, FaUserDoctor, FaHospital, FaBoxOpen, FaBuildingColumns,
  FaArrowUpFromBracket, FaRotate, FaFileLines, FaUsers, FaPills, FaWarehouse, FaMap,
} from "react-icons/fa6";
import { LuClipboardCheck, LuWallet, LuCalendarClock } from "react-icons/lu";
import { BsBell } from "react-icons/bs";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { getPendingExpenseClaimsApi, getPendingReportsApi } from "../../../services/api";

const Sidebar = ({ onNav }: { onNav?: () => void }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.allSettled([
      getPendingReportsApi(),
      getPendingExpenseClaimsApi(),
    ]).then(([reports, expenses]) => {
      let total = 0;
      if (reports.status === "fulfilled") total += (reports.value.data?.data ?? []).length;
      if (expenses.status === "fulfilled") total += (expenses.value.data?.data ?? []).length;
      setPendingCount(total);
    });
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
      isActive
        ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
        : "text-[#444] hover:bg-gray-50 hover:text-[#16a34a]"
    }`;

  const masterDataLinks = [
    { to: "/admin",            end: true,  icon: FaHouse,              label: "Dashboard",    showBadge: false },
    { to: "/admin/doctors",               icon: FaUserDoctor,         label: "HCP Directory",showBadge: false },
    { to: "/admin/pharmacies",            icon: FaHospital,           label: "Pharmacies",   showBadge: false },
    { to: "/admin/products",              icon: FaBoxOpen,            label: "Products",     showBadge: false },
    { to: "/admin/samples",               icon: FaPills,              label: "Samples",      showBadge: false },
    { to: "/admin/facilities",            icon: FaBuildingColumns,    label: "Facilities",   showBadge: false },
    { to: "/admin/upload",                icon: FaArrowUpFromBracket, label: "Bulk Upload",  showBadge: false },
    { to: "/admin/cycles",                icon: FaRotate,             label: "Call Cycles",  showBadge: false },
    { to: "/admin/placement",             icon: FaWarehouse,          label: "Stock Targets", showBadge: false },
    { to: "/admin/reports",               icon: FaFileLines,          label: "Reports",      showBadge: false },
  ];

  const peopleLinks = [
    { to: "/admin/users",                 icon: FaUsers,              label: "Team Members", showBadge: false },
    { to: "/admin/territories",           icon: FaMap,                label: "Territories",  showBadge: false },
    { to: "/admin/compliance",            icon: LuClipboardCheck,     label: "Compliance",   showBadge: true  },
    { to: "/admin/expenses",              icon: LuWallet,             label: "Expenses",     showBadge: true  },
    { to: "/admin/leave",                 icon: LuCalendarClock,      label: "Leave",        showBadge: false },
  ];

  const renderLinks = (links: typeof masterDataLinks) =>
    links.map(({ to, end, icon: Icon, label, showBadge }) => (
      <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={onNav}
        style={{ transition: "background-color 0.15s, color 0.15s" }}>
        {({ isActive }) => (
          <>
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="text-[15px] flex-1">{label}</span>
            {showBadge && !isActive && pendingCount !== null && pendingCount > 0 && (
              <span className="min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </>
        )}
      </NavLink>
    ));

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)] overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-black text-xl text-[#1a1a1a] tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </h1>
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-medium">Admin</p>
        </div>
      </div>

      <nav className="flex-1 py-4 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-1">
          {renderLinks(masterDataLinks)}
        </div>
        <div className="mx-6 my-3 border-t border-gray-100" />
        <p className="mx-6 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">People</p>
        <div className="flex flex-col gap-1">
          {renderLinks(peopleLinks)}
        </div>
      </nav>

      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
        <button
          onClick={() => { navigate("/admin/expenses"); onNav?.(); }}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <div className="relative flex-shrink-0">
            <BsBell className="w-[18px] h-[18px]" />
            {pendingCount !== null && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
            )}
          </div>
          <span className="text-[15px] flex-1">Notifications</span>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="text-xs font-semibold text-orange-500">{pendingCount}</span>
          )}
        </button>
        <button
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <GoGear className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <SlLogout className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
