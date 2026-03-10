import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BiHome, BiCalendar, BiFileBlank, BiReceipt } from "react-icons/bi";
import { BsCardChecklist } from "react-icons/bs";
import { FaUserMd, FaHistory } from "react-icons/fa";
import { MdOutlineEventRepeat, MdMoreHoriz } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";

// ─── Nav item definitions ─────────────────────────────────────────────────────

const PRIMARY = [
  { to: "/rep-page", label: "Home", icon: BiHome, end: true },
  { to: "/rep-page/tasks", label: "Tasks", icon: BsCardChecklist, end: false },
  { to: "/rep-page/doctors", label: "Doctors", icon: FaUserMd, end: false },
  { to: "/rep-page/calendar", label: "Calendar", icon: BiCalendar, end: false },
];

const MORE = [
  { to: "/rep-page/visits", label: "Visits", icon: FaHistory },
  { to: "/rep-page/call-cycle", label: "Cycle", icon: MdOutlineEventRepeat },
  { to: "/rep-page/reports", label: "Reports", icon: BiFileBlank },
  { to: "/rep-page/expenses", label: "Expenses", icon: BiReceipt },
  { to: "/rep-page/settings", label: "Settings", icon: IoSettingsOutline },
];

// ─── Component ────────────────────────────────────────────────────────────────

const MobileNav = () => {
  const [showMore, setShowMore] = useState(false);

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
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex-1 h-full"
              >
                {({ isActive }) => (
                  <div className="flex flex-col items-center justify-center h-full gap-[3px]">
                    {/* Indicator pill */}
                    <div
                      className={`flex items-center justify-center w-12 h-7 rounded-full ${
                        isActive ? "bg-[#dcfce7]" : ""
                      }`}
                      style={{ transition: "background-color 150ms ease" }}
                    >
                      <Icon
                        className={`w-[22px] h-[22px] ${
                          isActive ? "text-[#16a34a]" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-none ${
                        isActive ? "text-[#16a34a]" : "text-gray-500"
                      }`}
                    >
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
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowMore(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            style={{ backdropFilter: "blur(2px)" }}
          />

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

            <div className="px-6 pt-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                More
              </p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMore(false)}
                    >
                      {({ isActive }) => (
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                              isActive ? "bg-[#16a34a]" : "bg-gray-100"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isActive ? "text-white" : "text-[#222f36]"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold text-center ${
                              isActive ? "text-[#16a34a]" : "text-gray-600"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
