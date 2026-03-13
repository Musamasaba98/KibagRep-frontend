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

const NAV_LINKS: Array<{ to: string; end?: boolean; icon: React.ElementType; label: string; badge?: string }> = [
  { to: "/supervisor",          end: true,  icon: FaHouse,          label: "Dashboard"     },
  { to: "/supervisor/reps",                 icon: FaUserGroup,      label: "My Reps"       },
  { to: "/supervisor/approvals",            icon: LuClipboardCheck, label: "Approvals",    badge: "!" },
  { to: "/supervisor/cycles",               icon: IoCalendarOutline,label: "Call Cycles"   },
  { to: "/supervisor/map",                  icon: LuMap,            label: "Team Map"      },
  { to: "/supervisor/analysis",             icon: TbChartBar,       label: "Analysis"      },
  { to: "/supervisor/doctors",              icon: LuStethoscope,    label: "HCP Directory" },
  { to: "/supervisor/jfw",                  icon: GrTask,           label: "JFW"           },
  { to: "/supervisor/reports",              icon: TbReport,         label: "Reports"       },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
      isActive
        ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
        : "text-[#444] hover:bg-gray-50 hover:text-[#16a34a]"
    }`;

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)]">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-black text-xl text-[#1a1a1a] tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </h1>
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-medium">Supervisor Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, end, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            {({ isActive }) => (
              <>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[15px] flex-1">{label}</span>
                {badge && !isActive && (
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
        <button
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <BsBell className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Notifications</span>
        </button>
        <button
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <GoGear className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 w-full text-left"
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
