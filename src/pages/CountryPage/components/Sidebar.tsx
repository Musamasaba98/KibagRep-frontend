import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { BsBell } from "react-icons/bs";
import { SlLogout } from "react-icons/sl";
import { TbReport } from "react-icons/tb";
import { LuChartNoAxesCombined, LuMap } from "react-icons/lu";
import { IoMegaphoneOutline } from "react-icons/io5";
import { logout } from "../../../store/authSlice";


const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex cursor-pointer mx-6 py-1 px-2 rounded-lg items-center gap-3 ${
      isActive
        ? "bg-green-50 text-[#16a34a] font-semibold"
        : "text-[#222f36]"
    }`;

  return (
    <div className="bg-white border-solid border-r-[1px] flex-none border-gray-200 w-64 h-screen fixed overflow-y-auto">
      {/* brand header */}
      <div className="w-full h-[60px] flex items-center px-6 border-solid border-b-[1px] border-gray-200">
        <div>
          <h1 className="font-black text-2xl text-[#212121]">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <p className="leading-none text-sm text-[#454545]">Country Manager</p>
        </div>
      </div>

      {/* nav links */}
      <div className="flex flex-col gap-5 pt-6 pb-6">

        <NavLink to="/country" end className={navLinkClass}>
          <FaHouse className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Dashboard</p>
        </NavLink>

        <NavLink to="/country/managers" className={navLinkClass}>
          <FaUserGroup className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Managers</p>
        </NavLink>

        <NavLink to="/country/coverage" className={navLinkClass}>
          <LuMap className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Coverage Map</p>
          {/* Phase 1 — Leaflet heatmap */}
        </NavLink>

        <NavLink to="/country/campaigns" className={navLinkClass}>
          <IoMegaphoneOutline className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Campaigns</p>
        </NavLink>

        <NavLink to="/country/analytics" className={navLinkClass}>
          <LuChartNoAxesCombined className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Analytics</p>
        </NavLink>

        <NavLink to="/country/reports" className={navLinkClass}>
          <TbReport className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Reports</p>
        </NavLink>

        {/* non-routed items */}
        <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-lg items-center gap-3 text-[#222f36] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
          <BsBell className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Notifications</p>
        </div>

        <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-lg items-center gap-3 text-[#222f36] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
          <GoGear className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Settings</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex cursor-pointer mx-6 py-1 px-2 rounded-lg items-center gap-3 text-[#222f36] hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <SlLogout className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Logout</p>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;
