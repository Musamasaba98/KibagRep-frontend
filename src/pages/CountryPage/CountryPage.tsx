import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";


const CountryPage = () => {
  return (
    <div className="h-screen pb-24 overflow-y-auto flex bg-gray-50">
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

export default CountryPage;
