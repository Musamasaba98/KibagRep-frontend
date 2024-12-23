import DatePicker from "../componets/DatePicker/DatePicker";
import Navbar from "../componets/Navbar/Navbar";
import Sidebar from "../componets/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

const CRMPage = () => {
  return (
    <div className="min-h-screen  bg-gray-50">
      <Navbar />
      <div className="w-11/12 mx-auto bg-white flex justify-start shadow rounded-lg ">
        <div className="w-1/2">
          <div className="w-full">
            <DatePicker />
          </div>

          <Sidebar />
        </div>

        <div className="w-full mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
