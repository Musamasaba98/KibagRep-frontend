import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

const SalesAdminPage = () => {
  return (
    <>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />
        {/* the main content container */}
        <div className="w-full ml-64">
          <Navbar />
          {/* the content */}
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesAdminPage;
