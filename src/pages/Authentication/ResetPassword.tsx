import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiArrowRight } from "react-icons/fi";
import { resetPasswordApi } from "../../services/api";

const ResetPassword = () => {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get("token") ?? "";
  const navigate                = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!token) { setError("Invalid reset link — no token found"); return; }
    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Reset failed. The link may have expired.");
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="font-black text-xl text-[#1a2530]">Password reset!</h2>
        <p className="text-sm text-gray-400 mt-2">Redirecting you to sign in…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] p-8 w-full max-w-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-[#16a34a] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="font-black text-[#1a2530] tracking-tight">KibagRep</span>
          </div>
          <h1 className="text-2xl font-black text-[#1a2530] tracking-tight">Set new password</h1>
          <p className="text-sm text-gray-400 mt-1">Choose a password at least 6 characters long</p>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

        {!token ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-500 font-semibold">Invalid reset link</p>
            <Link to="/forgot-password" className="mt-3 block text-sm text-[#16a34a] font-semibold hover:underline">Request a new one</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold rounded-xl disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}>
              {loading ? "Resetting…" : <><span>Reset Password</span><FiArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-5">
          <Link to="/login" className="text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
