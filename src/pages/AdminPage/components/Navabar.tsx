import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BiSearch, BiSolidBell } from "react-icons/bi";
import { GoGear } from "react-icons/go";
import { useState } from "react";

interface NavbarProps {
  onMenuToggle?: () => void;
  pendingCount?: number;
}

const Navabar = ({ onMenuToggle, pendingCount = 0 }: NavbarProps) => {
  const user     = useSelector((state: any) => state.auth?.user);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const initials = user?.firstname
    ? `${user.firstname[0]}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "HR";
  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Admin";

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

        {/* Search */}
        <div className="flex items-center gap-2 px-3 w-[280px] h-9 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20"
          style={{ transition: "border-color 0.15s" }}>
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
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-400 hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s, color 0.15s" }}
            aria-label="Settings"
          >
            <GoGear className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => navigate("/admin/expenses")}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-[#dcfce7] text-gray-400 hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s, color 0.15s" }}
            aria-label={`Notifications${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`}
          >
            <BiSolidBell className="w-[18px] h-[18px]" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
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
