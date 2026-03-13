import { Outlet } from "react-router-dom";
import Navabar from "./components/Navabar";
import Sidebar from "./components/Sidebar";

const AdminPage = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="w-full ml-64">
        <Navabar />
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
