import { useSelector } from "react-redux";
import { BiSearch, BiSolidBell } from "react-icons/bi";
import { GoGear } from "react-icons/go";
import { useState } from "react";

const Navabar = () => {
  const user = useSelector((state: any) => state.auth?.user);
  const [search, setSearch] = useState("");

  const initials = user?.firstname
    ? `${user.firstname[0]}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "HR";

  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Admin";

  return (
    <div className="w-full sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between h-16 px-5">

        {/* Search */}
        <div className="flex items-center gap-2 px-3 w-[280px] h-9 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20 transition-colors">
          <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Search reps, teams, reports…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-400 hover:text-[#16a34a] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]">
            <GoGear className="w-[18px] h-[18px]" />
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-400 hover:text-[#16a34a] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]">
            <BiSolidBell className="w-[18px] h-[18px]" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center shrink-0">
              <span className="text-[#16a34a] font-black text-xs">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#222f36] leading-tight">{fullName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">HR / Admin</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Navabar;
