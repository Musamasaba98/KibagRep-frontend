import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { FaBars, FaXmark } from "react-icons/fa6";

const SalesAdminPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-50 shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 z-50 focus-visible:outline-none"
            >
              <FaXmark className="w-4 h-4" />
            </button>
            <Sidebar onNav={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none"
          >
            <FaBars className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-black text-base text-[#212121]">
              KIBAG<span className="text-[#16a34a]">REP</span>
            </h1>
          </div>
        </div>

        {/* Desktop navbar */}
        <div className="hidden lg:block">
          <Navbar />
        </div>

        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SalesAdminPage;
