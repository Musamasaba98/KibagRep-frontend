import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  MdOutlinePerson, MdOutlineNotifications, MdOutlineLock,
  MdOutlineMap, MdOutlineDevices, MdChevronRight, MdClose, MdCheck,
} from "react-icons/md";
import { updateMyProfileApi, changePasswordApi } from "../../../services/api";
import { updateUser } from "../../../store/authSlice";

// ─── Profile panel ────────────────────────────────────────────────────────────

const ProfilePanel = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const user = useSelector((s: any) => s.auth?.user);
  const [firstname, setFirstname] = useState(user?.firstname ?? "");
  const [lastname,  setLastname]  = useState(user?.lastname  ?? "");
  const [contact,   setContact]   = useState(user?.contact   ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    setError(""); setSuccess(false); setSaving(true);
    try {
      const res = await updateMyProfileApi({ firstname, lastname, contact });
      dispatch(updateUser(res.data.data));
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
          <input value={firstname} onChange={(e) => setFirstname(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
            placeholder="First name" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
          <input value={lastname} onChange={(e) => setLastname(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
            placeholder="Last name" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
        <input value={user?.email ?? ""} disabled
          className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
        <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Contact / Phone</label>
        <input value={contact} onChange={(e) => setContact(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          placeholder="07xx xxx xxx" />
      </div>
      {error   && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-xs text-[#16a34a] bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1"><MdCheck className="w-4 h-4" /> Profile updated</p>}
      <button onClick={handleSave} disabled={saving}
        className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        style={{ transition: "opacity 0.15s" }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
};

// ─── Security panel ───────────────────────────────────────────────────────────

const SecurityPanel = ({ onClose }: { onClose: () => void }) => {
  const [current,  setCurrent]  = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = async () => {
    setError(""); setSuccess(false);
    if (newPwd !== confirm) { setError("New passwords don't match"); return; }
    if (newPwd.length < 8)  { setError("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await changePasswordApi({ current_password: current, new_password: newPwd });
      setSuccess(true);
      setCurrent(""); setNewPwd(""); setConfirm("");
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Current password</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          placeholder="Enter current password" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">New password</label>
        <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          placeholder="Min 8 characters" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          placeholder="Repeat new password" />
      </div>
      {error   && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-xs text-[#16a34a] bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1"><MdCheck className="w-4 h-4" /> Password changed successfully</p>}
      <button onClick={handleChange} disabled={saving || !current || !newPwd || !confirm}
        className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        style={{ transition: "opacity 0.15s" }}>
        {saving ? "Changing…" : "Change Password"}
      </button>
    </div>
  );
};

// ─── Settings modal wrapper ───────────────────────────────────────────────────

const SettingsModal = ({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-[#222f36] text-base">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 focus-visible:outline-none">
          <MdClose className="w-5 h-5" />
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  </div>
);

// ─── Main Settings page ────────────────────────────────────────────────────────

type Panel = "profile" | "security" | null;

const groups = [
  { key: "profile",  icon: MdOutlinePerson,        label: "Profile & Account",  description: "Name, contact details, and role",                   iconBg: "bg-[#dcfce7]", iconColor: "text-[#16a34a]" },
  { key: null,       icon: MdOutlineNotifications,  label: "Notifications",      description: "Visit reminders, report alerts, and approvals",      iconBg: "bg-amber-50",  iconColor: "text-amber-500",  badge: "Soon" },
  { key: "security", icon: MdOutlineLock,           label: "Security",           description: "Change password and manage sessions",                iconBg: "bg-red-50",    iconColor: "text-red-500"  },
  { key: null,       icon: MdOutlineMap,            label: "Field Preferences",  description: "GPS accuracy, territory defaults, and cycle settings", iconBg: "bg-sky-50",    iconColor: "text-sky-500",    badge: "Soon" },
  { key: null,       icon: MdOutlineDevices,        label: "App Preferences",    description: "Theme, language, offline sync, and display",          iconBg: "bg-violet-50", iconColor: "text-violet-500",  badge: "Soon" },
] as const;

const Settings = () => {
  const [activePanel, setActivePanel] = useState<Panel>(null);

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-[#222f36] tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and field preferences</p>
      </div>

      <div className="space-y-2">
        {groups.map((g) => {
          const Icon = g.icon;
          const clickable = g.key !== null;
          return (
            <button
              key={g.label}
              onClick={() => clickable && setActivePanel(g.key as Panel)}
              disabled={!clickable}
              className={`w-full flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-[0_1px_8px_0_rgba(0,0,0,0.05)] text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${
                clickable ? "hover:shadow-[0_3px_16px_0_rgba(0,0,0,0.09)] cursor-pointer" : "cursor-default opacity-70"
              }`}
              style={{ transition: "box-shadow 0.15s" }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.iconBg}`}>
                <Icon className={`w-5 h-5 ${g.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#222f36]">{g.label}</p>
                  {"badge" in g && g.badge && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{g.badge}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>
              </div>
              {clickable && <MdChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 shrink-0" style={{ transition: "color 0.15s" }} />}
            </button>
          );
        })}
      </div>

      {/* Profile modal */}
      {activePanel === "profile" && (
        <SettingsModal title="Profile & Account" onClose={() => setActivePanel(null)}>
          <ProfilePanel onClose={() => setActivePanel(null)} />
        </SettingsModal>
      )}

      {/* Security modal */}
      {activePanel === "security" && (
        <SettingsModal title="Change Password" onClose={() => setActivePanel(null)}>
          <SecurityPanel onClose={() => setActivePanel(null)} />
        </SettingsModal>
      )}
    </div>
  );
};

export default Settings;
