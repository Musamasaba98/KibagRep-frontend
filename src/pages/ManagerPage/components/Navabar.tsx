import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BiMenu, BiSearch, BiSolidBell, BiSolidComment } from "react-icons/bi";
import { FaChartPie } from "react-icons/fa";
import { BiChevronDown } from "react-icons/bi";
import { icons } from "../../../assets/assets";
import { toggleShowMenu } from "../../../store/uiStateSlice";

const NavIconBtn = ({
  icon: Icon,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  badge?: number;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-400 hover:text-[#16a34a] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
  >
    <Icon className="w-[18px] h-[18px]" />
    {badge != null && badge > 0 && (
      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#16a34a] text-white text-[9px] font-bold flex items-center justify-center leading-none pointer-events-none">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

const Navabar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);
  const [searchQuery, setSearchQuery] = useState("");

  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Manager";
  const roleLabel = user?.role ?? "Field Line Manager";

  return (
    <div className="w-full sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between h-16 px-5">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-500 hover:text-[#16a34a] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            aria-label="Toggle menu"
          >
            <BiMenu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 w-[260px] h-9 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20 transition-colors">
            <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              placeholder="Search reps, supervisors…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <NavIconBtn icon={FaChartPie} />
          <NavIconBtn icon={BiSolidComment} badge={2} />
          <NavIconBtn icon={BiSolidBell} badge={4} />

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <button
            onClick={() => dispatch(toggleShowMenu())}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] group"
          >
            <div className="relative">
              <img
                src={icons.test_img}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#16a34a]/20 group-hover:ring-[#16a34a]/40 transition-shadow shrink-0"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] border-2 border-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#222f36] leading-tight">{fullName}</p>
              <p className="text-[10px] text-gray-400 leading-tight capitalize">{roleLabel}</p>
            </div>
            <BiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#16a34a] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navabar;
