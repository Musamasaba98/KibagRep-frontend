import DatePicker from "../componets/DatePicker/DatePicker";
import Navbar from "../componets/Navbar/Navbar";
import Sidebar from "../componets/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import MenuPopup from "../componets/MenuPopup/MenuPopup";
import { useSelector } from "react-redux";
import AddUnplanned from "../componets/AddUnplanned/AddUnplanned";
import Ncapopup from "../componets/NcaPoppup/Ncapopup";

const CRMPage = () => {
  const { showMenu } = useSelector((state) => state.uiState);
  return (
    <>
      <MenuPopup showMenu={showMenu} />
      <AddUnplanned />
      <Ncapopup />
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
    </>
  );
};

export default CRMPage;
