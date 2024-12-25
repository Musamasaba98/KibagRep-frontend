import DatePicker from "../componets/DatePicker/DatePicker";
import Navbar from "../componets/Navbar/Navbar";
import Sidebar from "../componets/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

const CRMPage = () => {
  return (
    <div className="min-h-screen  bg-gray-50">
      <Navbar />
      <div className="lg:w-[96%] xl:w-[93%] w-11/12 mx-auto bg-white flex justify-start shadow rounded-lg ">
        <div className="lg:w-[30%] xl:w-[1/3]">
          <div className="w-full">
            <DatePicker />
          </div>
          <Sidebar />
        </div>

        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
