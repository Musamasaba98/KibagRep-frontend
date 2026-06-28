import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaHouse, FaUserGroup } from "react-icons/fa6";
import { MdMoreHoriz } from "react-icons/md";
import { LuClipboardCheck, LuStethoscope, LuCalendarDays, LuChartNoAxesCombined, LuArrowRightLeft, LuBookOpen } from "react-icons/lu";
import { TbReport } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { IoCalendarOutline } from "react-icons/io5";
import { FiMapPin } from "react-icons/fi";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";

const PRIMARY = [
  { to: "/manager",            label: "Home",      icon: FaHouse,         end: true  },
  { to: "/manager/approvals",  label: "Approvals", icon: LuClipboardCheck, end: false },
  { to: "/manager/teams",      label: "Teams",     icon: FaUserGroup,     end: false },
  { to: "/manager/reports",    label: "Reports",   icon: TbReport,        end: false },
];

const MORE = [
  { to: "/manager/tasks",       label: "Tasks",         icon: GrTask               },
  { to: "/manager/doctors",     label: "HCP Directory", icon: LuStethoscope        },
  { to: "/manager/analytics",   label: "Analytics",     icon: LuChartNoAxesCombined },
  { to: "/manager/library",     label: "Library",       icon: LuBookOpen            },
  { to: "/manager/calendar",    label: "Calendar",      icon: IoCalendarOutline     },
  { to: "/manager/cycles",      label: "Call Cycles",   icon: LuCalendarDays        },
  { to: "/manager/territories", label: "Territories",   icon: FiMapPin              },
];

const MobileNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setShowMore(false);
  };

  return (
    <>
      {/* ── Fixed bottom bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white"
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
                  <div className="flex flex-col items-center justify-center h-full gap-[3px]">
                    <div
                      className={`flex items-center justify-center w-12 h-7 rounded-full ${isActive ? "bg-[#dcfce7]" : ""}`}
                      style={{ transition: "background-color 150ms ease" }}
                    >
                      <Icon className={`w-[22px] h-[22px] ${isActive ? "text-[#16a34a]" : "text-gray-500"}`} />
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
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: "blur(2px)" }} />

          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              boxShadow: "0 -8px 40px 0 rgba(0,0,0,0.18)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-6 pt-3">
              <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-4">More</p>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.to} to={item.to} onClick={() => setShowMore(false)}>
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

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                <button
                  onClick={() => { navigate("/supervisor"); setShowMore(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-700 hover:bg-amber-50 w-full text-left"
                  style={{ transition: "background-color 0.15s" }}
                >
                  <LuArrowRightLeft className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-poppins">Supervisor View</span>
                </button>
                <button
                  onClick={() => { navigate("/manager/reports"); setShowMore(false); }}
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
