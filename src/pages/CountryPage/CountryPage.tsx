import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { FaXmark } from "react-icons/fa6";

const CountryPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Slide-in drawer (desktop breakpoint fallback) */}
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
      <div className="flex-1 lg:ml-64 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Mobile topbar — logo only, navigation is in the bottom bar */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-10">
          <h1 className="font-poppins-extrabold text-base text-[#1a1a1a]">
            KIBAG<span className="text-[#16a34a]">REP</span>
          </h1>
          <span className="ml-2 text-xs font-poppins-semibold text-gray-400">Country</span>
        </div>

        {/* Desktop navbar */}
        <div className="hidden lg:block sticky top-0 z-30">
          <Navbar />
        </div>

        {/* pb-20 on mobile so content clears the fixed bottom nav */}
        <div className="w-full pb-20 lg:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Bottom tab nav — mobile only */}
      <MobileNav />
    </div>
  );
};

export default CountryPage;
