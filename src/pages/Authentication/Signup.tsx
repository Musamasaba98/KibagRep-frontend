import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] p-8">
        {/* Header */}
        <div className="mb-7">
          <div className="w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center mb-4">
            <span className="text-white font-black text-base">K</span>
          </div>
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
            className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] mt-1"
          >
            {loading ? "Creating account…" : "Create account"}
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
  );
};

export default Signup;
