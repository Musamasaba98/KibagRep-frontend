import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { BsBell } from "react-icons/bs";
import { IoCalendarOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { TbReport } from "react-icons/tb";
import { LuClipboardCheck } from "react-icons/lu";
import { GrTask } from "react-icons/gr";
import { logout } from "../../../store/authSlice";


const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex cursor-pointer mx-6 py-1 px-2 rounded-lg items-center gap-3 transition-colors ${
      isActive
        ? "bg-[#f0fdf4] text-[#16a34a] font-semibold"
        : "text-[#222f36] hover:bg-gray-50"
    }`;

  return (
    <div className="bg-white border-solid border-r-[1px] flex-none border-gray-200 w-64 h-screen fixed overflow-y-auto">
      {/* header / brand */}
      <div className="w-full h-[60px] flex items-center px-6 border-solid border-b-[1px] border-gray-200">
        <div>
          <h1 className="font-black text-2xl text-[#212121]">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <p className="leading-none text-sm text-[#454545]">Supervisor dashboard</p>
        </div>
      </div>

      {/* nav links */}
      <div className="flex flex-col gap-5 pt-6">

        <NavLink to="/supervisor" end className={navLinkClass}>
          <FaHouse className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Dashboard</p>
        </NavLink>

        <NavLink to="/supervisor/reps" className={navLinkClass}>
          <FaUserGroup className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">My Reps</p>
        </NavLink>

        <NavLink to="/supervisor/approvals" className={navLinkClass}>
          <LuClipboardCheck className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Approvals</p>
          {/* static pending badge */}
          <span className="ml-auto mr-1 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
            !
          </span>
        </NavLink>

        <NavLink to="/supervisor/cycles" className={navLinkClass}>
          <IoCalendarOutline className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Call Cycles</p>
        </NavLink>

        <NavLink to="/supervisor/jfw" className={navLinkClass}>
          <GrTask className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">JFW</p>
        </NavLink>

        <NavLink to="/supervisor/reports" className={navLinkClass}>
          <TbReport className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Reports</p>
        </NavLink>

        {/* non-link items */}
        <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3 text-[#222f36] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
          <BsBell className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Notifications</p>
        </div>

        <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3 text-[#222f36] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]">
          <GoGear className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg">Settings</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3 text-[#222f36] hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <SlLogout className="w-5 h-5 flex-shrink-0" />
          <p className="text-lg">Logout</p>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;
