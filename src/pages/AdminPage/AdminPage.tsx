import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navabar from "./components/Navabar";
import Sidebar from "./components/Sidebar";

const AdminPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ backdropFilter: "blur(1px)" }}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`fixed top-0 left-0 h-full z-20 transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transition: "transform 0.25s ease" }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="w-full lg:ml-64">
        <Navabar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
