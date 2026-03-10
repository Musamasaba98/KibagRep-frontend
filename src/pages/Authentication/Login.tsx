import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { loginApi } from "../../services/api";

const ROLE_HOME: Record<string, string> = {
  MedicalRep: "/rep-page",
  Supervisor: "/supervisor",
  Manager: "/manager",
  COUNTRY_MGR: "/country",
  SALES_ADMIN: "/sales-admin",
  SUPER_ADMIN: "/manager",
  USER: "/rep-page",
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      dispatch(setCredentials({ user: res.data.data, token: res.data.token }));
      const destination = ROLE_HOME[res.data.data.role] || "/rep-page";
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-y-auto pb-6 bg-gray-50 h-screen flex justify-center items-center">
      <form onSubmit={handleSubmit} className="w-[420px] px-5 bg-white shadow-lg py-5 rounded-md">
        <div className="w-full">
          <h1 className="text-center font-bold text-2xl">Login to your account</h1>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex w-full flex-col gap-6 mt-7">
          <div className="w-full">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"
            />
          </div>

          <div className="w-full">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"
            />
          </div>

          <div className="w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white text-lg rounded-md p-3 cursor-pointer bg-[#09be51] hover:bg-[#07a344] active:bg-[#068a39] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login now"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-[#454545] pt-2">
            Don't have an account? <Link to="/signup" className="text-[#09be51] font-medium">Signup</Link>
            <span className="text-sm pl-6 text-blue-500 cursor-pointer">Forgot password?</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
