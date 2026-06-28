import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { BsBell } from "react-icons/bs";
import { SlLogout } from "react-icons/sl";
import { TbReport } from "react-icons/tb";
import { LuChartNoAxesCombined, LuMap, LuStethoscope, LuArrowRightLeft, LuBookOpen } from "react-icons/lu";
import { IoMegaphoneOutline } from "react-icons/io5";
import { logout } from "../../../store/authSlice";

const NAV_LINKS = [
  { to: "/country",             end: true, icon: FaHouse,               label: "Dashboard"     },
  { to: "/country/managers",               icon: FaUserGroup,           label: "Managers"      },
  { to: "/country/coverage",               icon: LuMap,                 label: "Coverage Map"  },
  { to: "/country/campaigns",              icon: IoMegaphoneOutline,    label: "Campaigns"     },
  { to: "/country/doctors",                icon: LuStethoscope,         label: "HCP Directory" },
  { to: "/country/analytics",              icon: LuChartNoAxesCombined, label: "Analytics"     },
  { to: "/country/reports",                icon: TbReport,              label: "Reports"       },
  { to: "/country/library",               icon: LuBookOpen,            label: "Library"       },
];

const Sidebar = ({ onNav }: { onNav?: () => void }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
      isActive
        ? "bg-[#f0fdf4] text-[#16a34a] font-poppins"
        : "text-[#444] hover:bg-gray-50 hover:text-[#16a34a]"
    }`;

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col">
      <div className="h-[60px] flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-poppins-extrabold text-xl text-[#1a1a1a] tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </h1>
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-poppins">Country Manager</p>
        </div>
      </div>
      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => onNav?.()}>
            <Icon className="w-[19px] h-[19px] shrink-0" />
            <span className="text-[15px] font-poppins">{label}</span>
          </NavLink>
        ))}
      </nav>
      {/* View switching — CM can act as Manager or Supervisor */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <p className="text-[10px] font-poppins-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Switch View</p>
        <button
          onClick={() => navigate("/manager")}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[#444] hover:bg-amber-50 hover:text-amber-700 text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <LuArrowRightLeft className="w-[17px] h-[17px] shrink-0" />
          <span className="text-[13px] font-poppins">Manager View</span>
        </button>
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
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <BsBell className="w-[19px] h-[19px] shrink-0" />
          <span className="text-[15px] font-poppins">Notifications</span>
        </button>
        <button
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] w-full text-left"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
        >
          <GoGear className="w-[19px] h-[19px] shrink-0" />
          <span className="text-[15px] font-poppins">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 w-full text-left"
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
