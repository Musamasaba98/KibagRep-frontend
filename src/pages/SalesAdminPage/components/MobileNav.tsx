import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaHouse, FaUsers, FaUserGroup, FaMap,
  FaBoxOpen, FaHospital, FaBuildingColumns, FaPills,
  FaArrowUpFromBracket, FaRotate, FaFileLines, FaWarehouse,
} from "react-icons/fa6";
import { MdMoreHoriz } from "react-icons/md";
import { LuClipboardCheck, LuWallet, LuCalendarClock, LuBookOpen, LuStethoscope } from "react-icons/lu";
import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { logout } from "../../../store/authSlice";

const PRIMARY = [
  { to: "/admin",            label: "Home",       icon: FaHouse,          end: true  },
  { to: "/admin/users",      label: "Team",        icon: FaUsers,          end: false },
  { to: "/admin/compliance", label: "Compliance",  icon: LuClipboardCheck, end: false },
  { to: "/admin/reports",    label: "Reports",     icon: FaFileLines,      end: false },
];

const MORE = [
  { to: "/admin/doctors",       label: "HCP Directory", icon: LuStethoscope        },
  { to: "/admin/products",      label: "Products",      icon: FaBoxOpen             },
  { to: "/admin/pharmacies",    label: "Pharmacies",    icon: FaHospital            },
  { to: "/admin/samples",       label: "Samples",       icon: FaPills               },
  { to: "/admin/facilities",    label: "Facilities",    icon: FaBuildingColumns     },
  { to: "/admin/cycles",        label: "Call Cycles",   icon: FaRotate              },
  { to: "/admin/library",       label: "Library",       icon: LuBookOpen            },
  { to: "/admin/upload",        label: "Bulk Upload",   icon: FaArrowUpFromBracket  },
  { to: "/admin/teams",         label: "Teams",         icon: FaUserGroup           },
  { to: "/admin/territories",   label: "Territories",   icon: FaMap                 },
  { to: "/admin/placement",     label: "Stock Targets", icon: FaWarehouse           },
  { to: "/admin/expenses",      label: "Expenses",      icon: LuWallet              },
  { to: "/admin/leave",         label: "Leave",         icon: LuCalendarClock       },
];

const MobileNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const pendingCount = useSelector((s: any) => s.ui?.pendingCount ?? null);

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
            const hasBadge = item.to === "/admin/compliance" && pendingCount !== null && pendingCount > 0;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="flex-1 h-full">
                {({ isActive }) => (
                  <div className="flex flex-col items-center justify-center h-full gap-[3px]">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`flex items-center justify-center w-12 h-7 rounded-full ${isActive ? "bg-[#dcfce7]" : ""}`}
                        style={{ transition: "background-color 150ms ease" }}
                      >
                        <Icon className={`w-[22px] h-[22px] ${isActive ? "text-[#16a34a]" : "text-gray-500"}`} />
                      </div>
                      {hasBadge && !isActive && (
                        <span className="absolute -top-0.5 right-0.5 w-2 h-2 rounded-full bg-orange-500 border border-white" />
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

            <div className="px-6 pt-3 overflow-y-auto" style={{ maxHeight: "72vh" }}>
              <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest mb-4">More</p>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.to} to={item.to} onClick={() => setShowMore(false)}>
                      {({ isActive }) => (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? "bg-[#16a34a]" : "bg-gray-100"}`}>
                            <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-[#222f36]"}`} />
                          </div>
                          <span className={`text-[10px] font-poppins-semibold text-center leading-tight ${isActive ? "text-[#16a34a]" : "text-gray-600"}`}>
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
                  onClick={() => { navigate("/admin/expenses"); setShowMore(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 w-full text-left"
                  style={{ transition: "background-color 0.15s" }}
                >
                  <GoGear className="w-5 h-5 shrink-0 text-gray-400" />
                  <span className="text-sm font-poppins">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 w-full text-left"
                  style={{ transition: "background-color 0.15s" }}
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
