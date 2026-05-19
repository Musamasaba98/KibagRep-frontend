import { Outlet } from "react-router-dom";
import Navabar from "./components/Navabar";
import Sidebar from "./components/Sidebar";


const ManagerPage = () => {
  return (
    <>
    <div className="h-screen overflow-y-auto flex bg-gray-50">
   <Sidebar/>
   {/* the main content container */}
   <div className="w-full ml-64">
   <Navabar/>
   {/* the content */}
   <div className="w-full">
   <Outlet/>
   </div>
   </div>
    </div>
    </>
  );
};

export default ManagerPage;
