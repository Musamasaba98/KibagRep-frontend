import { FaCheckCircle, FaTasks } from "react-icons/fa";
import { FaClipboardList, FaUserGroup } from "react-icons/fa6";


const IndicatorCards = () => {
  return (
    <div className="w-full grid gap-4 grid-cols-4">

    {/* the card */}
    <div className="w-full p-5 hover:shadow-lg cursor-pointer bg-white shadow-md rounded-md">
    {/* header */}
    <div className="w-full flex justify-between">
    <p className="text-lg text-[#222f36]">Total reps</p>
    <div className="flex rounded-full items-center justify-center w-11 h-11 bg-blue-500">
    <FaUserGroup className="w-6 h-6 text-white"/>
    </div>
    </div>
    <h1 className="font-black text-[#222f36] text-4xl">68</h1>
    <p className="pt-1 underline text-blue-500">View all reps</p>
    </div>

    {/* the card */}
    <div className="w-full p-5 hover:shadow-lg cursor-pointer bg-white shadow-md rounded-md">
    {/* header */}
    <div className="w-full flex justify-between">
    <p className="text-lg text-[#222f36]">Missed tasks</p>
    <div className="flex rounded-full items-center justify-center w-11 h-11 bg-green-500">
    <FaClipboardList className="w-6 h-6 text-white"/>
    </div>
    </div>
    <h1 className="font-black text-[#222f36] text-4xl">72</h1>
    <p className="pt-1 underline text-green-500">View missed tasks</p>
    </div>

    {/* the card */}
    <div className="w-full p-5 hover:shadow-lg cursor-pointer bg-white shadow-md rounded-md">
    {/* header */}
    <div className="w-full flex justify-between">
    <p className="text-lg text-[#222f36]">Total tasks</p>
    <div className="flex rounded-full items-center justify-center w-11 h-11 bg-[#f5554a]">
    <FaTasks className="w-6 h-6 text-white"/>
    </div>
    </div>
    <h1 className="font-black text-[#222f36] text-4xl">34</h1>
    <p className="pt-1 underline text-[#f5554a]">View all tasks</p>
    </div>


    {/* the card */}
    <div className="w-full p-5 hover:shadow-lg cursor-pointer bg-white shadow-md rounded-md">
    {/* header */}
    <div className="w-full flex justify-between">
    <p className="text-lg text-[#222f36]">Total supervisors</p>
    <div className="flex rounded-full items-center justify-center w-11 h-11 bg-blue-500">
    <FaUserGroup className="w-6 h-6 text-white"/>
    </div>
    </div>
    <h1 className="font-black text-[#222f36] text-4xl">68</h1>
    <p className="pt-1 underline text-blue-500">View all supervisors</p>
    </div>
    
    </div>
  )
}

export default IndicatorCards;
