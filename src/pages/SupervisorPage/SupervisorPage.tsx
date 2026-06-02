import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";


const SupervisorPage = () => {
  return (
    <div className="flex overflow-y-auto h-screen pb-11 bg-gray-50">
      <Sidebar/>
      {/* main content container */}
      <div className="w-full sm:ml-64">
        <Navbar />
        {/* page content */}
        <div className="w-full pb-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SupervisorPage;
