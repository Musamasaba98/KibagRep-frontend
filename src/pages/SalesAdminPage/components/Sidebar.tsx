import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../store/authSlice";
import { FaHouse, FaUserDoctor, FaHospital, FaBoxOpen, FaBuildingColumns, FaArrowUpFromBracket, FaRotate, FaFileLines } from "react-icons/fa6";
import { BsBell } from "react-icons/bs";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";

const navLinkBase =
  "flex items-center gap-3 p-2 rounded-lg cursor-pointer text-[#222f36] text-base";
const activeClass = "bg-green-50 text-[#16a34a] font-semibold";
const inactiveClass = "text-[#222f36]";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${navLinkBase} ${isActive ? activeClass : inactiveClass}`;

  return (
    <div className="bg-white border-solid border-r-[1px] flex-none border-gray-200 w-64 h-screen fixed overflow-y-auto">
      {/* brand header */}
      <div className="w-full h-[60px] flex items-center px-6 border-solid border-b-[1px] border-gray-200 flex-shrink-0">
        <div>
          <h1 className="font-black text-2xl text-[#212121]">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <p className="leading-none text-sm text-[#454545]">Sales Admin</p>
        </div>
      </div>

      {/* navigation links */}
      <div className="flex flex-col gap-1 pt-4 px-4 pb-6">
        <NavLink to="/sales-admin" end className={getLinkClass}>
          <FaHouse className="w-5 h-5 flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/sales-admin/doctors" className={getLinkClass}>
          <FaUserDoctor className="w-5 h-5 flex-shrink-0" />
          <span>Doctors</span>
        </NavLink>

        <NavLink to="/sales-admin/pharmacies" className={getLinkClass}>
          <FaHospital className="w-5 h-5 flex-shrink-0" />
          <span>Pharmacies</span>
        </NavLink>

        <NavLink to="/sales-admin/products" className={getLinkClass}>
          <FaBoxOpen className="w-5 h-5 flex-shrink-0" />
          <span>Products</span>
        </NavLink>

        <NavLink to="/sales-admin/facilities" className={getLinkClass}>
          <FaBuildingColumns className="w-5 h-5 flex-shrink-0" />
          <span>Facilities</span>
        </NavLink>

        <NavLink to="/sales-admin/upload" className={getLinkClass}>
          <FaArrowUpFromBracket className="w-5 h-5 flex-shrink-0" />
          <span>Bulk Upload</span>
        </NavLink>

        <NavLink to="/sales-admin/cycles" className={getLinkClass}>
          <FaRotate className="w-5 h-5 flex-shrink-0" />
          <span>Call Cycles</span>
        </NavLink>

        <NavLink to="/sales-admin/reports" className={getLinkClass}>
          <FaFileLines className="w-5 h-5 flex-shrink-0" />
          <span>Reports</span>
        </NavLink>

        <div className={`${navLinkBase} mt-2`}>
          <BsBell className="w-5 h-5 flex-shrink-0" />
          <span>Notifications</span>
        </div>

        <div className={navLinkBase}>
          <GoGear className="w-5 h-5 flex-shrink-0" />
          <span>Settings</span>
        </div>

        <button
          onClick={handleLogout}
          className={`${navLinkBase} w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-1 rounded-lg`}
        >
          <SlLogout className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
