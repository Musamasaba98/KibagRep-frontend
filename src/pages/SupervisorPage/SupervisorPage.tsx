import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";


const SupervisorPage = () => {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      {/* main content container */}
      <div className="w-full ml-64">
        <Navbar />
        {/* page content */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SupervisorPage;
