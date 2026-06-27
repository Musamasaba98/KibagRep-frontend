import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GoGear } from "react-icons/go";
import NotificationBell from "../../../componets/NotificationBell/NotificationBell";

interface NavbarProps {
  onMenuToggle?: () => void;
}

const Navabar = ({ onMenuToggle }: NavbarProps) => {
  const user     = useSelector((state: any) => state.auth?.user);
  const navigate = useNavigate();

  const initials = user?.firstname
    ? `${user.firstname[0]}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "SA";
  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Sales Admin";

  return (
    <div className="w-full sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-[60px] px-5">

        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden mr-3 w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}
            aria-label="Toggle menu"
          >
            <span className="flex flex-col gap-1.5">
              <span className="w-4 h-0.5 bg-gray-500 rounded-full" />
              <span className="w-4 h-0.5 bg-gray-500 rounded-full" />
              <span className="w-4 h-0.5 bg-gray-500 rounded-full" />
            </span>
          </button>
        )}

        {/* Left — title */}
        <div>
          <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">Admin Panel</p>
          <p className="text-xs font-poppins text-gray-400 leading-tight hidden sm:block">HR &amp; compliance overview</p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 ml-auto">

          <button
            onClick={() => navigate("/admin")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-[#dcfce7] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s, color 0.15s" }}
            aria-label="Settings"
          >
            <GoGear className="w-[18px] h-[18px]" />
          </button>

          <NotificationBell />

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <div className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center shrink-0">
              <span className="text-[#16a34a] font-black text-xs">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#222f36] leading-tight">{fullName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">Sales Admin</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Navabar;
