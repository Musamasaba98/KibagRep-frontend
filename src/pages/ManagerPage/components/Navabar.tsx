import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BiSolidComment, BiChevronDown } from "react-icons/bi";
import { icons } from "../../../assets/assets";
import { toggleShowMenu } from "../../../store/uiStateSlice";
import NotificationBell from "../../../componets/NotificationBell/NotificationBell";

const Navabar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth?.user);

  const fullName  = user?.firstname ? `${user.firstname} ${user.lastname ?? ""}`.trim() : "Manager";
  const roleLabel = user?.role ?? "Field Line Manager";

  return (
    <div className="w-full sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-5">

        {/* Left — title */}
        <div>
          <p className="font-poppins-bold text-[#1a1a1a] text-[15px] leading-tight">Manager Dashboard</p>
          <p className="text-xs font-poppins text-gray-400 leading-tight hidden sm:block">Team performance and approvals</p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">

          {/* Messages */}
          <button
            onClick={() => navigate("/manager/messaging")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-[#dcfce7] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s, color 0.15s" }}
            aria-label="Messages"
          >
            <BiSolidComment className="w-[18px] h-[18px]" />
          </button>

          <NotificationBell />

          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* User chip */}
          <button
            onClick={() => dispatch(toggleShowMenu())}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] group"
            style={{ transition: "background-color 0.15s" }}
          >
            <div className="relative shrink-0">
              <img
                src={icons.test_img}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#16a34a]/20 group-hover:ring-[#16a34a]/40"
                style={{ transition: "box-shadow 0.15s" }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] border-2 border-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-poppins-bold text-[#222f36] leading-tight">{fullName}</p>
              <p className="text-[10px] font-poppins text-gray-400 leading-tight capitalize">{roleLabel}</p>
            </div>
            <BiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#16a34a]" style={{ transition: "color 0.15s" }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navabar;
