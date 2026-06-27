import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";

const SupervisorPage = () => {
  const role = useSelector((s: any) => s.auth?.role);
  const navigate = useNavigate();

  // Show a banner when a Manager or CM is viewing supervisor routes
  const isSwitched = role === "Manager" || role === "COUNTRY_MGR";
  const backLabel = role === "COUNTRY_MGR" ? "Country Manager" : "Manager";
  const backPath  = role === "COUNTRY_MGR" ? "/country" : "/manager";

  return (
    <div className="flex overflow-x-hidden h-screen bg-gray-50">
      <Sidebar />

      <div className="w-full md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* View-switch banner */}
        {isSwitched && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs font-poppins-semibold text-amber-700">
              Acting as Supervisor — your company has no supervisor assigned
            </p>
            <button
              onClick={() => navigate(backPath)}
              className="text-xs font-poppins-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 shrink-0"
            >
              ← Back to {backLabel}
            </button>
          </div>
        )}

        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <Outlet />
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default SupervisorPage;
