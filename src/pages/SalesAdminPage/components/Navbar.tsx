import { useNavigate } from "react-router-dom";
import { FaRegComment } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import NotificationBell from "../../../componets/NotificationBell/NotificationBell";

const Navbar = () => {
  const user     = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Sales Admin";
  const initial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "A";

  return (
    <div className="w-full px-5 flex items-center justify-between bg-white h-[60px] border-b border-gray-200">

      {/* Left — title */}
      <div>
        <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">Sales Admin</p>
        <p className="text-xs font-poppins text-gray-400 leading-tight hidden sm:block">Master data &amp; reporting</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        <button
          onClick={() => navigate("/sales-admin/messaging")}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-[#dcfce7] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, color 0.15s" }}
          aria-label="Messages"
        >
          <FaRegComment className="w-[18px] h-[18px]" />
        </button>

        <NotificationBell />

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-xl bg-[#16a34a] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm leading-none">{initial}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-poppins-bold text-[#222f36] leading-tight">{fullName}</p>
            <p className="text-[10px] font-poppins text-gray-400 leading-tight">Sales Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
