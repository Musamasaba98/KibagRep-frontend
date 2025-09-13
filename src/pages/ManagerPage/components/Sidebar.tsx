import { FaHouse } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { BsBell } from "react-icons/bs";
import { IoCalendarOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { TbReport } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className='bg-white border-solid border-r-[1px] flex-none border-gray-200 w-64 h-screen fixed'>
    {/* the header */}
    <div className="w-full h-[60px] flex items-center px-6 border-solid border-b-[1px] border-gray-200">
    <div>
    <h1 className="font-black text-2xl text-[#212121]">KIBAG<span className="text-[#09be51]">REP</span></h1>
    <p className="leading-none text-sm text-[#454545]">Manager dashboard</p>
    </div>
    </div>
    {/* links */}
    <div className="flex flex-col gap-5 pt-6">

    <Link to="/manager">
    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <FaHouse className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Dashboard</p>
    </div>
    </Link>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <GrTask className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Tasks</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <TbReport className="w-6 h-6 text-[#233036]"/>
    <p className="text-lg text-[#222f36]">Reports</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <LuChartNoAxesCombined className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Analytics</p>
    </div>

    <Link to="/manager/messaging">
    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <IoChatbubbleEllipsesOutline className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Messaging</p>
    </div>
    </Link>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <BsBell className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Notifications</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <IoCalendarOutline className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Calender</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <IoDocumentTextOutline className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Documents</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <GoGear className="w-6 h-6 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Settings</p>
    </div>

    <div className="flex cursor-pointer mx-6 py-1 px-2 rounded-md items-center gap-3">
    <SlLogout className="w-5 h-5 text-[#222f36]"/>
    <p className="text-lg text-[#222f36]">Logout</p>
    </div>

    </div>

    </div>
  )
}

export default Sidebar
