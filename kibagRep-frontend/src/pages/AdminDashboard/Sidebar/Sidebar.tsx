
import { FaCalendar, FaChartPie, FaChevronDown, FaCirclePlus, FaComment, FaFileCirclePlus, FaGear, FaHouse, FaHouseMedical, FaInbox, FaMessage, FaProductHunt, FaTable, FaTableList, FaUsers} from "react-icons/fa6";


const Sidebar = () => {

  return (

    <div className='fixed bg-white transition-width duration-[1s] w-[22%] 2xl:w-[15%] h-screen border-solid border-r-[1px] border-grey-200 overflow-y-scroll [&::-webkit-scrollbar]:w-0'>
    
   {/* Div for the icons and text */}
    <div className="flex flex-col gap-6 2xl:gap-7 pt-3">
    


    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaHouse className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Dashboard</p>
    </div>
    </div>

    </div>
    {/* End of the menu option div */}

    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaTableList className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Reports</p>
     </div>
    </div>
    </div>
    {/* End of the menu option div */}


    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaCalendar className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Calender</p>
    </div>
    </div>
    </div>
    {/* End of the menu option div */}


    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaProductHunt className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Products</p>
    </div>
    <FaChevronDown/>
    </div>
    {/* The additional links are in the container below */}
    <div className="overflow-hidden h-[6px] hover:h-36 duration-300">
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/> Add a product</p>
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/> Expired products</p>
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/>  Discounts</p>
    </div>
    </div>
    {/* End of the menu option div */}

    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaChartPie className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Charts</p>
    </div>
    </div>

    </div>
    {/* End of the menu option div */}

    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaUsers className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Workers</p>
    </div>
    </div>
    </div>
    {/* End of the menu option div */}


    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaMessage className="w-5 h-5"/>
     <p className="text-[18px] font-[Arial] pt-2">Chat</p>
    </div>
    </div>
    </div>
    {/* End of the menu option div */}

    
    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaHouseMedical className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Leads</p>
    </div>
    </div>
    </div>
    {/* End of the menu option div */}


    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaHouse className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Dashboard</p>
    </div>
    <FaChevronDown/>
    </div>

    {/* The additional links are in the container below */}
    <div className="overflow-hidden h-[3px] hover:h-44 duration-300">
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/> Add a product</p>
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/> Add a product</p>
    <p className="pl-4 text-[18px] font-[Arial] py-1 flex items-center gap-2"><FaCirclePlus/> Add a product</p>
    </div>

    </div>
    {/* End of the menu option div */}

    {/* This is the container to hold the menu option and its other information */}
    <div className="w-full cursor-pointer px-4">
     <div className="w-full flex items-center justify-between">
    <div className="flex w-full gap-2 items-center">
     <FaGear className="w-6 h-6"/>
     <p className="text-[18px] font-[Arial] pt-2">Settings</p>
    </div>
    </div>

    </div>
    {/* End of the menu option div */}

    </div>
    </div>
  )
}

export default Sidebar;