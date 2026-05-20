import { useDispatch, useSelector } from "react-redux";
import { BiBell, BiSearch } from "react-icons/bi";
import { FaRegComment } from "react-icons/fa6";
import { RootState } from "../../../store/store";
import { Link } from "react-router-dom";
import { LuMenu } from "react-icons/lu";
import { toggleSupervisorPannel } from "../../../store/uiStateSlice";

const Navbar = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fullName = user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : "Supervisor";
  const initial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "S";
  const dispatch = useDispatch();

  return (
    <div className="w-full px-6 z-[2000] sticky top-0 flex items-center justify-between bg-white/80 backdrop-blur-md h-[60px] border-b border-gray-100">

      {/* Left — page title */}
      <div className="hidden sm:block">
        <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">Supervisor Dashboard</p>
        <p className="text-xs text-[#454545] font-poppins leading-tight">Team activity and approvals</p>
      </div>

      <div onClick={()=>dispatch(toggleSupervisorPannel())} className="block sm:hidden">
      <LuMenu className="w-6 h-6"/>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-2 ml-auto">

        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
          aria-label="Search"
        >
          <BiSearch className="w-5 h-5" />
        </button>

        <Link to={"/supervisor/messages"}>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
          aria-label="Messages">
          <FaRegComment className="w-[18px] h-[18px]" />
        </button>
        </Link>

        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
          aria-label="Notifications"
        >
          <BiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shadow-sm shadow-green-200 flex-shrink-0">
            <span className="text-white font-poppins-semibold text-sm">{initial}</span>
          </div>
          <div className="hidden md:block">
            <p className="font-poppins-bold text-[#1a1a1a] text-sm leading-tight group-hover:text-[#16a34a]" style={{ transition: "color 0.15s" }}>
              {fullName}
            </p>
            <p className="text-xs font-poppins text-gray-400 leading-tight">Supervisor</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Navbar;
