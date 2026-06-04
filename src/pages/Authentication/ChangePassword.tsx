import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaKey, FaEye, FaEyeSlash } from "react-icons/fa6";
import { changePasswordApi } from "../../services/api";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN:  "/super-admin",
  COUNTRY_MGR:  "/country",
  SALES_ADMIN:  "/super-admin",
  Manager:      "/manager-page",
  Supervisor:   "/supervisor-page",
  MedicalRep:   "/rep-page",
};

const ChangePassword = () => {
  const navigate  = useNavigate();
  const user: any = useSelector((s: any) => s.auth?.user);

  const [current,    setCurrent]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPass !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await changePasswordApi({ current_password: current, new_password: newPass });
      navigate(ROLE_HOME[user?.role] || "/rep-page", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] w-full max-w-sm p-8">

        {/* Icon */}
        <div className="w-14 h-14 bg-[#16a34a]/10 rounded-2xl flex items-center justify-center mb-6">
          <FaKey className="w-6 h-6 text-[#16a34a]" />
        </div>

        <h1 className="font-poppins-extrabold text-[#1a2530] text-2xl tracking-tight">Set your password</h1>
        <p className="text-sm font-poppins text-gray-400 mt-1.5 mb-6">
          Your account was created by an admin. Choose a strong password to continue.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-poppins px-3 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Current (temp) password */}
          <div>
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">
              Temporary password
            </label>
            <div className="relative">
              <input
                type={showCur ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                placeholder="The password you were given"
                className="w-full font-poppins text-sm px-4 py-2.5 pr-10 border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                {showCur ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">
              New password <span className="font-normal text-gray-400">(min 8 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                placeholder="Choose a strong password"
                className="w-full font-poppins text-sm px-4 py-2.5 pr-10 border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                {showNew ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="w-full font-poppins text-sm px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
            {confirm && newPass !== confirm && (
              <p className="text-xs text-red-500 font-poppins mt-1">Passwords do not match</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-poppins-bold py-3 rounded-xl text-sm mt-2"
            style={{ transition: "background-color 0.15s, opacity 0.15s" }}>
            {loading ? "Saving…" : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
