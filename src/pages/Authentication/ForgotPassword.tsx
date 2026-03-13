import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../services/api";

const ForgotPassword = () => {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [devToken, setDevToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    setLoading(true);
    try {
      const res = await forgotPasswordApi(email);
      setSent(true);
      if (res.data._dev_token) setDevToken(res.data._dev_token);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="font-black text-xl text-[#1a2530]">Check your email</h2>
        <p className="text-sm text-gray-400 mt-2">
          If <span className="font-semibold text-[#1a2530]">{email}</span> is registered, you'll receive a reset link shortly.
        </p>
        {devToken && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xs font-bold text-amber-700 mb-1">Dev mode — reset token:</p>
            <Link to={`/reset-password?token=${devToken}`}
              className="text-xs text-[#16a34a] font-semibold break-all hover:underline focus-visible:outline-none">
              /reset-password?token={devToken}
            </Link>
          </div>
        )}
        <Link to="/login" className="mt-6 block text-sm text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">
          Back to sign in
        </Link>
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
          <h1 className="text-2xl font-black text-[#1a2530] tracking-tight">Forgot password?</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your email and we'll send a reset link</p>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              autoFocus />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold rounded-xl disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
            style={{ transition: "background-color 0.15s" }}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Remember your password?{" "}
          <Link to="/login" className="text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
