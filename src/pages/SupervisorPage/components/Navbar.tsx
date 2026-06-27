import { useSelector } from "react-redux";
import { FaRegComment } from "react-icons/fa6";
import { RootState } from "../../../store/store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../../componets/NotificationBell/NotificationBell";

const PAGE_LABELS: Record<string, string> = {
  "/supervisor":           "Dashboard",
  "/supervisor/reps":      "My Reps",
  "/supervisor/approvals": "Approvals",
  "/supervisor/reports":   "Reports",
  "/supervisor/cycles":    "Call Cycles",
  "/supervisor/jfw":       "JFW",
  "/supervisor/map":       "Team Map",
  "/supervisor/analysis":  "Analysis",
  "/supervisor/doctors":   "HCP Directory",
  "/supervisor/events":    "Field Events",
};

const Navbar = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const fullName = user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : "Supervisor";
  const initial  = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "S";
  const { pathname } = useLocation();
  const pageLabel = PAGE_LABELS[pathname] ?? "Supervisor";

  return (
    <div className="w-full px-4 md:px-6 z-[2000] sticky top-0 flex items-center justify-between bg-white/90 backdrop-blur-md h-[56px] md:h-[60px] border-b border-gray-100">

      {/* Left — page label */}
      <div>
        <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">{pageLabel}</p>
        <p className="text-xs text-[#454545] font-poppins leading-tight hidden md:block">Team activity and approvals</p>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-2 ml-auto">

        <Link to="/supervisor/messages">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-[#dcfce7] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s, color 0.15s" }}
            aria-label="Messages"
          >
            <FaRegComment className="w-[18px] h-[18px]" />
          </button>
        </Link>

        <NotificationBell />

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        <button
          onClick={() => navigate("/supervisor")}
          className="flex items-center gap-2.5 pl-1 rounded-xl hover:bg-gray-50 cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shadow-sm shadow-green-200 shrink-0">
            <span className="text-white font-poppins-semibold text-sm">{initial}</span>
          </div>
          <div className="hidden md:block pr-2 text-left">
            <p className="font-poppins-bold text-[#1a1a1a] text-sm leading-tight group-hover:text-[#16a34a]" style={{ transition: "color 0.15s" }}>
              {fullName}
            </p>
            <p className="text-xs font-poppins text-gray-400 leading-tight">Supervisor</p>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Navbar;
