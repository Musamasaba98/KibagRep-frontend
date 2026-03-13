import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { LuClipboardCheck, LuWallet, LuStethoscope } from "react-icons/lu";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";

const NAV_LINKS = [
  { to: "/admin",            end: true, icon: FaHouse,           label: "Dashboard"     },
  { to: "/admin/compliance",            icon: LuClipboardCheck,  label: "Compliance"    },
  { to: "/admin/teams",                 icon: FaUserGroup,       label: "Teams"         },
  { to: "/admin/expenses",              icon: LuWallet,          label: "Expenses"      },
  { to: "/admin/doctors",               icon: LuStethoscope,     label: "HCP Directory" },
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
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-medium">Admin / HR Panel</p>
        </div>
      </div>
      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="text-[15px]">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
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
