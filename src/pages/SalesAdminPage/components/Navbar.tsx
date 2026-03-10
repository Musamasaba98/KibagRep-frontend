import { BiBell, BiMenu, BiSearch, BiSolidGrid } from "react-icons/bi";
import { FaRegComment } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

const Navbar = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const avatarLetter = user?.firstname
    ? user.firstname.charAt(0).toUpperCase()
    : "A";

  return (
    <div className="w-full px-6 z-[300] sticky top-0 flex items-center justify-between bg-white h-[60px] border-solid border-b-[1px] border-gray-200">
      {/* nav left */}
      <div className="cursor-pointer hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] rounded-md p-0.5">
        <BiMenu className="w-7 h-7 text-[#4c4c5c]" />
      </div>

      {/* nav right */}
      <div className="flex items-center gap-5">
        <button
          aria-label="Search"
          className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
        >
          <BiSearch className="w-5 h-5 text-[#4c4c5c]" />
        </button>

        <button
          aria-label="Notifications"
          className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
        >
          <BiBell className="w-5 h-5 text-[#4c4c5c]" />
        </button>

        <button
          aria-label="Messages"
          className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
        >
          <FaRegComment className="w-5 h-5 text-[#4c4c5c]" />
        </button>

        <button
          aria-label="Apps"
          className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
        >
          <BiSolidGrid className="w-6 h-6 text-[#4c4c5c]" />
        </button>

        {/* user avatar */}
        <div
          aria-label={`User: ${user?.firstname ?? "Admin"}`}
          className="w-[35px] h-[35px] rounded-full bg-[#16a34a] flex items-center justify-center cursor-pointer select-none"
        >
          <span className="text-white font-bold text-sm leading-none">
            {avatarLetter}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
