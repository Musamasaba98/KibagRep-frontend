import DatePicker from "../componets/DatePicker/DatePicker";
import Navbar from "../componets/Navbar/Navbar";
import Sidebar from "../componets/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

const CRMPage = () => {
  return (
    <div className="min-h-screen  bg-gray-50">
      <Navbar />
      <div className=" lg:w-[96%] xl:w-[93%] w-11/12 mx-auto bg-white flex justify-start shadow rounded-b-lg ">
        <div className="fixed top-13 left-13 w-[15%] md:w-[30%] lg:w-[23%]  2xl:w-[1/3]">
          <div className="w-full">
            <DatePicker />
          </div>
          <div className="h-[70vh]">
            <Sidebar />
          </div>
        </div>

        <div className="w-full h-[93vh] ml-[23%]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
// Ok, according to our medical representative system in Uganda, we usually have a country manager,
// below the country manager their can be either a single field manager or no field manager
// then below their can be supervisors and supervisors lead teams with medical representatives/sales representative.
// I am developing this dashboard for a country manager, and maybe supervisors with limited access to super features.
// First leave the licensing bit, I have developed a vertical menu that can be toggled,
