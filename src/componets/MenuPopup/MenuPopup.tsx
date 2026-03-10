import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleShowMenu, toggleShowUnplanned, toggleShowNca } from "../../store/uiStateSlice";
import { logout } from "../../store/authSlice";
import { icons } from "../../assets/assets";
import {
  MdAddCircleOutline,
  MdOutlineBarChart,
  MdOutlineCalendarToday,
  MdOutlineAssignment,
  MdManageSearch,
  MdOutlineAssessment,
  MdOutlineChecklist,
  MdOutlineLock,
  MdLogout,
  MdChevronRight,
  MdOutlineWarningAmber,
  MdClose,
} from "react-icons/md";
import { FiPackage } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItemDef {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

interface MenuSectionDef {
  heading: string;
  items: MenuItemDef[];
}

// ─── Menu item ────────────────────────────────────────────────────────────────

const MenuItem = ({ item }: { item: MenuItemDef }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.iconBg} group-hover:opacity-90`}
      >
        <Icon className={`w-4 h-4 ${item.iconColor}`} />
      </div>
      <span className="flex-1 text-sm font-medium text-[#222f36]">{item.label}</span>
      <MdChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
    </button>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const MenuSection = ({ section }: { section: MenuSectionDef }) => (
  <div className="px-3 pb-2">
    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-4 pt-3 pb-1">
      {section.heading}
    </p>
    {section.items.map((item) => (
      <MenuItem key={item.label} item={item} />
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const MenuPopup = ({ showMenu }: { showMenu: boolean }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth?.user);

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showMenu) {
      setIsAnimating(true);
    } else {
      const t = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(t);
    }
  }, [showMenu]);

  const close = () => dispatch(toggleShowMenu());

  const fullName = user?.firstname
    ? `${user.firstname} ${user.lastname ?? ""}`.trim()
    : "Medical Rep";

  const go = (path: string) => { close(); navigate(path); };

  const sections: MenuSectionDef[] = [
    {
      heading: "Field Actions",
      items: [
        {
          icon: MdAddCircleOutline,
          label: "Add Unplanned Visit",
          iconBg: "bg-[#dcfce7]",
          iconColor: "text-[#16a34a]",
          onClick: () => { dispatch(toggleShowUnplanned()); close(); },
        },
        {
          icon: MdOutlineWarningAmber,
          label: "Log NCA",
          iconBg: "bg-amber-50",
          iconColor: "text-amber-500",
          onClick: () => { dispatch(toggleShowNca()); close(); },
        },
        {
          icon: MdOutlineBarChart,
          label: "Competitor Intelligence",
          iconBg: "bg-sky-50",
          iconColor: "text-sky-500",
          onClick: () => { go("/rep-page/visits"); },
        },
      ],
    },
    {
      heading: "Data Capture",
      items: [
        {
          icon: FiPackage,
          label: "Stock Capture",
          iconBg: "bg-orange-50",
          iconColor: "text-orange-500",
          onClick: () => { go("/rep-page/visits"); },
        },
        {
          icon: MdManageSearch,
          label: "Profiler",
          iconBg: "bg-violet-50",
          iconColor: "text-violet-500",
          onClick: () => { go("/rep-page/doctors"); },
        },
      ],
    },
    {
      heading: "Planning",
      items: [
        {
          icon: MdOutlineCalendarToday,
          label: "Plan",
          iconBg: "bg-teal-50",
          iconColor: "text-teal-500",
          onClick: () => { go("/rep-page/call-cycle"); },
        },
        {
          icon: MdOutlineAssignment,
          label: "Survey",
          iconBg: "bg-purple-50",
          iconColor: "text-purple-500",
          onClick: () => { go("/rep-page/calendar"); },
        },
      ],
    },
    {
      heading: "Reports",
      items: [
        {
          icon: MdOutlineAssessment,
          label: "Reporting",
          iconBg: "bg-[#dcfce7]",
          iconColor: "text-[#16a34a]",
          onClick: () => { go("/rep-page/reports"); },
        },
        {
          icon: MdOutlineChecklist,
          label: "View Action Points",
          iconBg: "bg-indigo-50",
          iconColor: "text-indigo-500",
          onClick: () => { go("/rep-page/tasks"); },
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        showMenu || isAnimating ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 w-[320px] h-screen bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          showMenu ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 h-[64px] border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-bold text-[#222f36] tracking-tight">Quick Actions</h2>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* ── User profile card ── */}
        <div className="px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]">
            <div className="relative">
              <img
                src={icons.test_img}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-[#16a34a]/30"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#16a34a] border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#222f36] truncate">{fullName}</p>
              <p className="text-[11px] text-[#16a34a] font-medium capitalize truncate">
                {user?.role ?? "Medical Rep"}
              </p>
              {user?.email && (
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable menu sections ── */}
        <div className="flex-1 overflow-y-auto py-1">
          {sections.map((section, i) => (
            <div key={section.heading}>
              <MenuSection section={section} />
              {i < sections.length - 1 && (
                <div className="mx-7 h-px bg-gray-100" />
              )}
            </div>
          ))}
        </div>

        {/* ── Footer: account actions ── */}
        <div className="px-3 py-3 border-t border-gray-100 shrink-0 space-y-0.5">
          <MenuItem
            item={{
              icon: MdOutlineLock,
              label: "Change Password",
              iconBg: "bg-gray-100",
              iconColor: "text-gray-500",
              onClick: () => { close(); },
            }}
          />
          <MenuItem
            item={{
              icon: MdLogout,
              label: "Sign Out",
              iconBg: "bg-red-50",
              iconColor: "text-red-500",
              onClick: () => {
                dispatch(logout());
                close();
                window.location.href = "/login";
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MenuPopup;
