import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { LuClipboardCheck, LuWallet, LuStethoscope, LuCalendarClock, LuBell } from "react-icons/lu";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";
import { getPendingReportsApi, getPendingExpenseClaimsApi } from "../../../services/api";

interface NavItem {
  to: string; end?: boolean;
  icon: React.ElementType; label: string;
  showBadge?: boolean;
}

const NAV_LINKS: NavItem[] = [
  { to: "/admin",            end: true, icon: FaHouse,           label: "Dashboard"     },
  { to: "/admin/compliance",            icon: LuClipboardCheck,  label: "Compliance",    showBadge: true },
  { to: "/admin/teams",                 icon: FaUserGroup,       label: "Teams"         },
  { to: "/admin/expenses",              icon: LuWallet,          label: "Expenses",      showBadge: true },
  { to: "/admin/leave",                 icon: LuCalendarClock,   label: "Leave"         },
  { to: "/admin/doctors",               icon: LuStethoscope,     label: "HCP Directory" },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([getPendingReportsApi(), getPendingExpenseClaimsApi()]).then(([rRes, eRes]) => {
      let total = 0;
      if (rRes.status === "fulfilled") total += (rRes.value.data?.data ?? []).length;
      if (eRes.status === "fulfilled") total += (eRes.value.data?.data ?? []).length;
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

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)] z-20">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-black text-xl text-[#1a1a1a] tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </h1>
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-medium">Admin / HR Panel</p>
        </div>
        {/* Notifications */}
        <button
          onClick={() => navigate("/admin/expenses")}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-[#f0fdf4] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
          aria-label="Notifications"
        >
          <LuBell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, end, icon: Icon, label, showBadge }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            {({ isActive }) => (
              <>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[15px] flex-1">{label}</span>
                {showBadge && pendingCount > 0 && !isActive && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
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
