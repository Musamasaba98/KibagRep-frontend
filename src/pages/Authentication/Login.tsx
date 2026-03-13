import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { loginApi } from "../../services/api";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { MdOutlineVerified, MdOutlineGpsFixed, MdOutlineBarChart } from "react-icons/md";

const ROLE_HOME: Record<string, string> = {
  MedicalRep:  "/rep-page",
  Supervisor:  "/supervisor",
  Manager:     "/manager",
  COUNTRY_MGR: "/country",
  SALES_ADMIN: "/sales-admin",
  SUPER_ADMIN: "/super-admin",
  USER:        "/rep-page",
};

const FEATURES = [
  { icon: MdOutlineVerified,  text: "Verified HCP database — 1,900+ doctors across Uganda" },
  { icon: MdOutlineGpsFixed,  text: "GPS-validated visits with 500m anomaly detection" },
  { icon: MdOutlineBarChart,  text: "Real-time cycle adherence and detailing performance" },
];

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await loginApi(email, password);
      dispatch(setCredentials({ user: res.data.data, token: res.data.token }));
      navigate(ROLE_HOME[res.data.data.role] || "/rep-page", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand identity ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-[#0f2318] px-12 py-14 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50">
            <span className="text-white font-black text-lg tracking-tight">K</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">KibagRep</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-white text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            Uganda's field force<br />
            <span className="text-[#16a34a]">accountability</span><br />
            platform.
          </h1>
          <p className="text-white/50 text-base mt-5 leading-relaxed max-w-sm">
            Built for pharma reps who visit 10 doctors a day. Every visit logged,
            every sample tracked, every cycle enforced.
          </p>

          {/* Feature list */}
          <ul className="mt-8 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#16a34a]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#16a34a]" />
                </div>
                <p className="text-white/70 text-sm leading-snug">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-white/25 text-xs">© {new Date().getFullYear()} KibagRep · Uganda</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:items-center lg:justify-center lg:px-10">

        {/* Mobile: brand header */}
        <div className="lg:hidden bg-[#0f2318] px-7 pt-12 pb-16 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-[#16a34a] rounded-xl flex items-center justify-center shadow shadow-green-900/60">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="text-white font-black text-lg tracking-tight">KibagRep</span>
          </div>
          <p className="text-white text-2xl font-black leading-tight">Welcome back</p>
          <p className="text-white/50 text-sm">Sign in to your account</p>
        </div>

        {/* Mobile: white card floats over header */}
        <div className="lg:hidden flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-7 pb-8 shadow-[0_-4px_24px_0_rgba(0,0,0,0.07)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Your email address" className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white" /></div>
            <div className="relative"><FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white" /></div>
            <div className="flex justify-end -mt-1"><button type="button" className="text-xs text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">Forgot password?</button></div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]" style={{ transition: "background-color 0.15s" }}>{loading ? "Signing in…" : <><span>Sign in</span><FiArrowRight className="w-4 h-4" /></>}</button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">Don't have an account? <Link to="/signup" className="text-[#16a34a] font-semibold hover:underline">Create one</Link></p>
        </div>

        {/* Desktop: original form */}
        <div className="hidden lg:block w-full max-w-sm">
          <h2 className="text-2xl font-black text-[#1a2530] tracking-tight">Welcome back</h2>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="Your email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white"
              />
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <button type="button" className="text-xs text-[#16a34a] font-semibold hover:underline focus-visible:outline-none">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              {loading ? "Signing in…" : <>Sign in <FiArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#16a34a] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
