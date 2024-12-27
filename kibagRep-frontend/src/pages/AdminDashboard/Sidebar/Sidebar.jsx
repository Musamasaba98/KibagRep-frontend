import {FaBell, FaCalendar, FaChartPie, FaComment, FaGear, FaHouse, FaHouseMedical, FaInbox, FaTable, FaUsers} from "react-icons/fa6";

const Sidebar = () => {
  return (
    <div className='bg-white w-[23%] 2xl:w-[18%] h-screen border-solid border-r-[1px] border-grey-200'>

    <div className="h-[60px] bg-[#fff] w-full flex items-center">

     <div className="pl-6">
     <h2 className="font-black text-2xl leading-none text-blue-600">KIBAGREP</h2>
     <p className="text-xs font-[#454545] leading-none pt-[1px]">ADMIN DASHBOARD</p>
     </div>

    </div>
    <hr />
    

   {/* Div for the links */}
    <div className="flex flex-col gap-[2px] 2xl:gap-3">

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaHouse className="w-7 h-7"/>
        <p className="font-[Arial] text-[18px] pt-3">Dashboard</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaTable className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Reports</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaInbox className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Inbox</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaChartPie className="w-7 h-7"/>
        <p className="font-[Arial] text-[18px] pt-3">Charts</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaCalendar className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Calendar</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaUsers className="w-7 h-7"/>
        <p className="font-[Arial] text-[18px] pt-3">Workers</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaComment className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Chat</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaHouseMedical className="w-7 h-7"/>
        <p className="font-[Arial] text-[18px] pt-3">Store</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaBell className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Notifications</p>
    </div>

    <div className="flex items-center gap-3 pl-6 py-2 hover:bg-[#efefef]">
         <FaGear className="w-6 h-6"/>
        <p className="font-[Arial] text-[18px] pt-3">Settings</p>
    </div>

    </div>

    </div>
  )
}

export default Sidebar;