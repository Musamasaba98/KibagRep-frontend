import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHouse, FaUserGroup, FaMugHot } from "react-icons/fa6";
import { MdMoreHoriz, MdOutlineEventRepeat } from "react-icons/md";
import { LuClipboardCheck, LuStethoscope, LuMap } from "react-icons/lu";
import { TbReport, TbChartBar } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { IoCalendarOutline } from "react-icons/io5";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";
import { RootState } from "../../../store/store";

// ─── Primary tabs (always visible) ───────────────────────────────────────────

const PRIMARY = [
  { to: "/supervisor",           label: "Home",      icon: FaHouse,         end: true  },
  { to: "/supervisor/approvals", label: "Approvals", icon: LuClipboardCheck, end: false, badge: true },
  { to: "/supervisor/reps",      label: "Reps",      icon: FaUserGroup,     end: false },
  { to: "/supervisor/reports",   label: "Reports",   icon: TbReport,        end: false },
];

// ─── More drawer items ────────────────────────────────────────────────────────

const MORE = [
  { to: "/supervisor/cycles",    label: "Call Cycles",   icon: IoCalendarOutline },
  { to: "/supervisor/jfw",       label: "JFW",           icon: GrTask            },
  { to: "/supervisor/map",       label: "Team Map",      icon: LuMap             },
  { to: "/supervisor/analysis",  label: "Analysis",      icon: TbChartBar        },
  { to: "/supervisor/doctors",   label: "HCP Directory", icon: LuStethoscope     },
  { to: "/supervisor/events",    label: "Field Events",  icon: FaMugHot          },
  { to: "/supervisor/cycles",    label: "Cycles",        icon: MdOutlineEventRepeat },
];

// ─── Component ────────────────────────────────────────────────────────────────

const MobileNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  // Pending count for Approvals badge
  const pendingCount = useSelector((state: RootState) => {
    // We read it from the sidebar's computed value via redux if stored,
    // otherwise we just show a dot. For now read from uiState if available.
    return (state as any).uiState?.supervisorPendingCount ?? 0;
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setShowMore(false);
  };

  return (
    <>
      {/* ── Fixed bottom bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white"
        style={{
          borderTop: "1px solid #f3f4f6",
          boxShadow: "0 -4px 24px 0 rgba(0,0,0,0.07)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center h-[60px]">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="flex-1 h-full">
                {({ isActive }) => (
                  <div className="flex flex-col items-center justify-center h-full gap-[3px] relative">
                    <div className={`flex items-center justify-center w-12 h-7 rounded-full relative ${isActive ? "bg-[#dcfce7]" : ""}`}
                      style={{ transition: "background-color 150ms ease" }}>
                      <Icon className={`w-[22px] h-[22px] ${isActive ? "text-[#16a34a]" : "text-gray-500"}`} />
                      {/* Approvals badge */}
                      {item.badge && !isActive && pendingCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-white text-white text-[8px] font-bold flex items-center justify-center">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-[#16a34a]" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-[3px] focus-visible:outline-none"
          >
            <div className="flex items-center justify-center w-12 h-7">
              <MdMoreHoriz className="w-[22px] h-[22px] text-gray-500" />
            </div>
            <span className="text-[10px] font-semibold text-gray-500 leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ── More bottom sheet ── */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMore(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: "blur(2px)" }} />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              boxShadow: "0 -8px 40px 0 rgba(0,0,0,0.18)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-6 pt-3">
              <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-4">
                More
              </p>

              {/* Grid of nav items */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.to + item.label} to={item.to} onClick={() => setShowMore(false)}>
                      {({ isActive }) => (
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? "bg-[#16a34a]" : "bg-gray-100"}`}>
                            <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-[#222f36]"}`} />
                          </div>
                          <span className={`text-xs font-poppins-semibold text-center leading-tight ${isActive ? "text-[#16a34a]" : "text-gray-600"}`}>
                            {item.label}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-1">
                <button
                  onClick={() => { navigate("/supervisor/approvals"); setShowMore(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 w-full text-left"
                >
                  <GoGear className="w-5 h-5 shrink-0 text-gray-400" />
                  <span className="text-sm font-poppins">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <SlLogout className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-poppins">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
