import { BiCalendar, BiFileBlank, BiHome, BiLock } from "react-icons/bi";
import { IoSettingsOutline } from "react-icons/io5";
import { BsCardChecklist } from "react-icons/bs";
import DatePicker from "../../../componets/DatePicker/DatePicker";


const Sidebar = () => {
  return (
    <div className="w-[380px] flex bg-white h-screen fixed shadow">
    {/* left conatiner with links for navigation */}
    <div className="w-[90px] py-6 flex flex-col gap-10 items-center h-full border-solid border-r-[1px] border-gray-200">
    
    {/* link */}
    <div className="cursor-pointer flex flex-col gap-1 items-center">
    <BiHome className=" text-[#454545] w-7 h-7"/>
    <p className="text-[14px] text-[#454545]">HOME</p>
    </div>

    {/* link */}
    <div className="cursor-pointer flex flex-col gap-1 items-center">
    <BsCardChecklist className=" text-[#454545] w-7 h-7"/>
    <p className="text-[14px] text-[#454545]">TASKS</p>
    </div>

    {/* link */}
    <div className="cursor-pointer flex flex-col gap-1 items-center">
    <BiFileBlank className=" text-[#454545] w-7 h-7"/>
    <p className="text-[14px] text-[#454545]">REPORTS</p>
    </div>

    {/* link */}
    <div className="cursor-pointer flex flex-col gap-1 items-center">
    <BiCalendar className=" text-[#454545] w-7 h-7"/>
    <p className="text-[14px] text-[#454545]">CALENDAR</p>
    </div>

    {/* link */}
    <div className="cursor-pointer flex flex-col gap-1 items-center">
    <IoSettingsOutline className=" text-[#454545] w-7 h-7"/>
    <p className="text-[14px] text-[#454545]">SETTINGS</p>
    </div>

    </div>
    {/* the right container with doctors */}
    <div className="w-full h-full">
    {/* the date picker*/}
    <DatePicker/>
    <hr />
    {/* the visits container */}
    <div className="w-full">

    <div className="w-full px-2 flex items-center justify-between h-[50px] bg-[#f8f6f6] border-solid border-b-[1px] border-gray-200">
    <h1 className="font-semibold">31 May-Thursday (4)</h1>
    <BiLock className="w-6 h-6 text-[#454545] cursor-pointer"/>
    </div>
    <div className="w-full px-2 flex items-center justify-between h-[50px] bg-[#f8f6f6] border-solid border-b-[1px] border-gray-200">
    <h1 className="font-semibold">01 June-Friday (12)</h1>
    <BiLock className="w-6 h-6 text-[#454545] cursor-pointer"/>
    </div>
    <div className="w-full px-2 flex items-center justify-between h-[50px] bg-[#f8f6f6] border-solid border-b-[1px] border-gray-200">
    <h1 className="font-semibold">02 June-Saturday (13)</h1>
    <BiLock className="w-6 h-6 text-[#454545] cursor-pointer"/>
    </div>
    
    </div>
    </div>
    </div>
  )
}

export default Sidebar;
