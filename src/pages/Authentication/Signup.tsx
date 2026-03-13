import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { signupApi } from "../../services/api";

const ROLES = [
  { value: "MedicalRep", label: "Medical Rep" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Manager", label: "Manager" },
  { value: "COUNTRY_MGR", label: "Country Manager" },
];

const INPUT =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors bg-white";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    contact: "",
    gender: "MALE",
    role: "MedicalRep",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signupApi({
        firstname: form.firstname,
        lastname: form.lastname,
        username: form.username,
        email: form.email,
        password: form.password,
        contact: form.contact || undefined,
        gender: form.gender,
        role: form.role,
      });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-[#0f2318] px-12 py-14 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50"><span className="text-white font-black text-lg">K</span></div>
          <span className="text-white font-black text-xl tracking-tight">KibagRep</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight">Start tracking.<br/><span className="text-[#16a34a]">Start winning.</span></h1>
          <p className="text-white/50 text-base mt-5 leading-relaxed max-w-sm">Create your account and join your field team on Uganda's most accountable SFA platform.</p>
          <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white text-3xl font-black">1,900<span className="text-[#16a34a]">+</span></p>
            <p className="text-white/50 text-sm mt-0.5">Verified HCPs in Uganda</p>
          </div>
        </div>
        <p className="text-white/25 text-xs">© 2026 KibagRep · Uganda</p>
      </div>
      {/* Form panel */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:overflow-y-auto lg:custom-scrollbar lg:items-start lg:justify-center lg:px-10 lg:py-10">

        {/* Mobile: brand header */}
        <div className="lg:hidden bg-[#0f2318] px-7 pt-12 pb-16 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-[#16a34a] rounded-xl flex items-center justify-center shadow shadow-green-900/60"><span className="text-white font-black text-sm">K</span></div>
            <span className="text-white font-black text-lg tracking-tight">KibagRep</span>
          </div>
          <p className="text-white text-2xl font-black leading-tight">Create your account</p>
          <p className="text-white/50 text-sm">Join your team on KibagRep</p>
        </div>

        {/* Mobile: white scrollable card */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white lg:bg-transparent rounded-t-3xl lg:rounded-none -mt-6 lg:mt-0 px-6 lg:px-0 pt-7 pb-10 shadow-[0_-4px_24px_0_rgba(0,0,0,0.07)] lg:shadow-none">
        <div className="w-full max-w-md mx-auto lg:mx-0">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-black text-[#222f36] tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-400 mt-1">Join your team on KibagRep</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                First name
              </label>
              <input
                type="text"
                required
                value={form.firstname}
                onChange={set("firstname")}
                placeholder="John"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Last name
              </label>
              <input
                type="text"
                required
                value={form.lastname}
                onChange={set("lastname")}
                placeholder="Doe"
                className={INPUT}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={set("username")}
              placeholder="johndoe"
              className={INPUT}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Work email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="john@company.com"
              className={INPUT}
            />
          </div>

          {/* Phone + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.contact}
                onChange={set("contact")}
                placeholder="07XXXXXXXX"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Gender
              </label>
              <select value={form.gender} onChange={set("gender")} className={INPUT}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Your role
            </label>
            <select value={form.role} onChange={set("role")} className={INPUT}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={set("password")}
              placeholder="At least 6 characters"
              className={INPUT}
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="Repeat your password"
              className={INPUT}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] mt-1"
          >
            {loading ? "Creating account…" : <><span>Create account</span><FiArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#16a34a] font-semibold hover:text-[#15803d] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
      </div>
      </div>
    </div>
  );
};

export default Signup;
