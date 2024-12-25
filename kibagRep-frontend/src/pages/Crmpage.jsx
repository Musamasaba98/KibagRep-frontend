import DatePicker from "../componets/DatePicker/DatePicker";
import Navbar from "../componets/Navbar/Navbar";
import Sidebar from "../componets/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

const CRMPage = () => {
  return (
    <div className="min-h-screen relative  bg-gray-50">
      <Navbar />

      <div className=" lg:w-[96%] xl:w-[93%] w-11/12 mx-auto bg-white flex justify-start shadow rounded-lg ">
        <div className="fixed top-13 left-14 w-[15%] lg:w-[20%] xl:w-[1/3]">
          <div className="w-full">
            <DatePicker />
          </div>
          <div className="h-[70vh]">
            <Sidebar />
          </div>
        </div>

        <div className="w-full ml-[21%]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
