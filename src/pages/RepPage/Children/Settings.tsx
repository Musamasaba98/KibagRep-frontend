import {
  MdOutlinePerson,
  MdOutlineNotifications,
  MdOutlineLock,
  MdOutlineMap,
  MdOutlineDevices,
  MdChevronRight,
} from "react-icons/md";

interface SettingGroup {
  icon: React.ElementType;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

const groups: SettingGroup[] = [
  {
    icon: MdOutlinePerson,
    label: "Profile & Account",
    description: "Name, photo, contact details, and role",
    iconBg: "bg-[#dcfce7]",
    iconColor: "text-[#16a34a]",
  },
  {
    icon: MdOutlineNotifications,
    label: "Notifications",
    description: "Visit reminders, report alerts, and approvals",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    badge: "3 active",
  },
  {
    icon: MdOutlineLock,
    label: "Security",
    description: "Change password and manage sessions",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    icon: MdOutlineMap,
    label: "Field Preferences",
    description: "GPS accuracy, territory defaults, and call cycle settings",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
  },
  {
    icon: MdOutlineDevices,
    label: "App Preferences",
    description: "Theme, language, offline sync, and display options",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
  },
];

const Settings = () => (
  <div className="max-w-2xl">
    <div className="mb-7">
      <h1 className="text-2xl font-black text-[#222f36] tracking-tight">Settings</h1>
      <p className="text-sm text-gray-400 mt-1">Manage your account and field preferences</p>
    </div>

    <div className="space-y-2">
      {groups.map((g) => {
        const Icon = g.icon;
        return (
          <button
            key={g.label}
            className="w-full flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-[0_1px_8px_0_rgba(0,0,0,0.05)] hover:shadow-[0_3px_16px_0_rgba(0,0,0,0.09)] text-left transition-shadow group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.iconBg}`}
            >
              <Icon className={`w-5 h-5 ${g.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#222f36]">{g.label}</p>
                {g.badge && (
                  <span className="text-[10px] font-bold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-full">
                    {g.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>
            </div>
            <MdChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
          </button>
        );
      })}
    </div>

    <p className="text-center text-xs text-gray-300 mt-10">
      Individual settings panels coming soon
    </p>
  </div>
);

export default Settings;
