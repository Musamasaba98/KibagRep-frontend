import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { icons } from '../../../assets/assets';
import {
  BiMenu, BiSearch, BiSolidBell, BiSolidComment, BiChevronDown,
} from "react-icons/bi";
import { MdArrowBack, MdLocationOn } from "react-icons/md";
import { FaChartPie } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowMenu, toggleSidebarPanel } from '../../../store/uiStateSlice';

// ─── GPS location hook ────────────────────────────────────────────────────────

const useLocationName = () => {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address;
          setLocationName(
            addr.city || addr.town || addr.village || addr.suburb || addr.county || null
          );
        } catch {
          // silently fail
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 300_000 }
    );
  }, []);

  return { locationName, locating };
};

// ─── Shared icon button ───────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth?.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { locationName, locating } = useLocationName();

  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Rep";
  const roleLabel = user?.role ?? "Medical Rep";

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/rep-page/doctors?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <div className="w-full sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.05)]">

      {/* ── Mobile header (< md) ── */}
      <div className="flex md:hidden items-center h-14 px-4">
        {mobileSearchOpen ? (
          /* Search mode */
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              aria-label="Close search"
            >
              <MdArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20 transition-colors">
              <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                placeholder="Search doctors, activities…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          </div>
        ) : (
          /* Normal mode */
          <>
            {/* Brand mark */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-sm shadow-green-700/25">
                <span className="text-white font-black text-sm tracking-tight">K</span>
              </div>
            </div>

            {/* Center: location only */}
            <div className="flex-1 flex flex-col items-center">
              {!locating && locationName && (
                <span className="flex items-center gap-0.5 text-[11px] text-[#16a34a] font-semibold">
                  <MdLocationOn className="w-3 h-3 shrink-0" />
                  {locationName}
                </span>
              )}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                aria-label="Search"
              >
                <BiSearch className="w-[18px] h-[18px]" />
              </button>

              <NavIconBtn icon={BiSolidBell} badge={2} />

              <button
                onClick={() => dispatch(toggleShowMenu())}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                aria-label="Open menu"
              >
                <div className="relative">
                  <img
                    src={icons.test_img}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-[#16a34a]/20"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#16a34a] border-[1.5px] border-white" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Desktop header (≥ md) ── */}
      <div className="hidden md:flex items-center justify-between h-16 px-5">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebarPanel())}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#16a34a] hover:bg-[#15803d] shadow-sm shadow-green-700/25 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            aria-label="Toggle activity panel"
          >
            <BiMenu className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2 px-3 w-[300px] h-9 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20 transition-colors">
            <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              placeholder="Search doctors, activities…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>

        {/* Center: location only */}
        <div className="flex flex-col items-center">
          {!locating && locationName && (
            <div className="flex items-center gap-1 text-xs text-[#16a34a] font-semibold">
              <MdLocationOn className="w-3.5 h-3.5 shrink-0" />
              <span>{locationName}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <NavIconBtn icon={FaChartPie} />
          <NavIconBtn icon={BiSolidComment} badge={3} />
          <NavIconBtn icon={BiSolidBell} badge={2} />

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

export default Navbar;
