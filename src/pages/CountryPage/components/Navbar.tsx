import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaRegComment } from "react-icons/fa6";
import { RootState } from "../../../store/store";
import NotificationBell from "../../../componets/NotificationBell/NotificationBell";

const Navbar = () => {
  const user     = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const fullName = user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : "Country Manager";
  const initial  = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "C";

  return (
    <div className="w-full px-4 sm:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md h-[60px] border-b border-gray-200">

      {/* Left — page title */}
      <div className="hidden sm:block">
        <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">National Dashboard</p>
        <p className="text-xs font-poppins text-gray-400 leading-tight">Country Manager View</p>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-1.5 ml-auto">

        {/* Messaging button hidden — route not yet implemented */}
        {/* <button onClick={() => navigate("/country/messaging")} aria-label="Messages">
          <FaRegComment className="w-[18px] h-[18px]" />
        </button> */}

        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        <button
          onClick={() => navigate("/country")}
          className="flex items-center gap-2.5 pl-1 rounded-xl hover:bg-gray-50 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shadow-sm shadow-green-200 shrink-0">
            <span className="text-white font-poppins-bold text-sm">{initial}</span>
          </div>
          <div className="hidden md:block pr-2 text-left">
            <p className="font-poppins-bold text-[#1a1a1a] text-sm leading-tight group-hover:text-[#16a34a]" style={{ transition: "color 0.15s" }}>
              {fullName}
            </p>
            <p className="text-xs font-poppins text-gray-400 leading-tight">Country Manager</p>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Navbar;
