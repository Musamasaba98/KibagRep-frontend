import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { LuClipboardCheck, LuWallet } from "react-icons/lu";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";

const NAV = [
  { label: "Dashboard",  icon: FaHouse         },
  { label: "Compliance", icon: LuClipboardCheck },
  { label: "Teams",      icon: FaUserGroup      },
  { label: "Expenses",   icon: LuWallet         },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="bg-white border-r border-gray-100 flex-none w-64 h-screen fixed flex flex-col shadow-[1px_0_12px_0_rgba(0,0,0,0.04)]">

      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="font-black text-xl text-[#1a1a1a] tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </h1>
          <p className="text-xs text-gray-400 leading-none mt-0.5 font-medium">Admin / HR Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ label, icon: Icon }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
              i === 0
                ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
                : "text-[#444] hover:bg-gray-50 hover:text-[#16a34a]"
            }`}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="text-[15px]">{label}</span>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 py-4 flex flex-col gap-1 shrink-0">
        <button className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-gray-50 hover:text-[#16a34a] cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] w-full text-left">
          <GoGear className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-[#444] hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 w-full text-left"
        >
          <SlLogout className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[15px]">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
