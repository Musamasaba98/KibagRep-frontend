import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";

const SupervisorPage = () => {
  return (
    <div className="flex overflow-x-hidden h-screen bg-gray-50">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content */}
      <div className="w-full md:ml-64 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom nav — hidden on md+ */}
      <MobileNav />
    </div>
  );
};

export default SupervisorPage;
