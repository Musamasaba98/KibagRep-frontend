import { BiCheck, BiEdit, BiPlus, BiSolidUser, BiTrash, BiX } from "react-icons/bi";
import { FaHourglassHalf } from "react-icons/fa";
import { all_tasks, recentActivities } from "../../../data";

const Tasks = () => {
  return (
    <div>
    {/* top cards */}
    <div className="w-full grid grid-cols-4 gap-5">
      
    {/* the card */}
    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer p-4 w-full shadow bg-gradient-to-tr from-blue-100 to-white rounded-md">
    <div className="w-12 border-solid border-[5px] border-blue-200 h-12 rounded-full flex justify-center items-center bg-blue-400">
    <BiPlus className="text-white w-7 h-7"/>
    </div>
    <p className="pt-1 text-gray-600 text-lg font-semibold">Total tasks</p>
    <div className="w-full flex justify-between">
    <p className="py-1 font-semibold text-sm">25 in total</p>
    <p className="text-blue-500 bg-blue-200 px-2 py-0.5 rounded-full">10%</p>
    </div>
    </div>

    {/* the card */}
    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer p-4 w-full shadow bg-gradient-to-tr from-green-100 to-white rounded-md">
    <div className="w-12 border-solid border-[5px] border-green-200 h-12 rounded-full flex justify-center items-center bg-green-400">
    <BiCheck className="text-white w-7 h-7"/>
    </div>
    <p className="pt-1 text-gray-600 text-lg font-semibold">Completed tasks</p>
    <div className="w-full flex justify-between">
    <p className="py-1 font-semibold text-sm">10 completed</p>
    <p className="text-green-500 bg-green-200 px-2 py-0.5 rounded-full">10%</p>
    </div>
    </div>


    {/* the card */}
    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer p-4 w-full shadow bg-gradient-to-tr from-red-100 to-white rounded-md">
    <div className="w-12 border-solid border-[5px] border-red-200 h-12 rounded-full flex justify-center items-center bg-red-400">
    <BiX className="text-white w-7 h-7"/>
    </div>
    <p className="pt-1 text-gray-600 text-lg font-semibold">Missed tasks</p>
    <div className="w-full flex justify-between">
    <p className="py-1 font-semibold text-sm">3 missed</p>
    <p className="text-red-500 bg-red-200 px-2 py-0.5 rounded-full">10%</p>
    </div>
    </div>

    {/* the card */}
    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer p-4 w-full shadow bg-gradient-to-tr from-purple-100 to-white rounded-md">
    <div className="w-12 border-solid border-[5px] border-purple-200 h-12 rounded-full flex justify-center items-center bg-purple-400">
    <FaHourglassHalf className="text-white w-7 h-7"/>
    </div>
    <p className="pt-1 text-gray-600 text-lg font-semibold">Pending tasks</p>
    <div className="w-full flex justify-between">
    <p className="py-1 font-semibold text-sm">20 pending</p>
    <p className="text-purple-500 bg-purple-200 px-2 py-0.5 rounded-full">30%</p>
    </div>
    </div>

      </div>
      {/* END OF  TASK TOP  CARDS, TASK CONTAINERS*/}
      <div className="w-full grid grid-cols-1 2xl:gap-7 2xl:grid-cols-2 mt-7">

      <div className="bg-white h-[360px] rounded-md mt-6 w-full shadow p-3">
      {/* the header */}
      <div className="w-full flex justify-between">
      <h1 className="font-semibold text-lg p-1">Task list</h1>
      {/* the navigation */}
      <div className="flex gap-5">
      <button className="px-6 py-1.5 hover:text-purple-500 text-purple-500 rounded-md font-semibold bg-gray-100">Today</button>
      <button className="px-6 py-1.5 hover:text-blue-500 rounded-md font-semibold bg-gray-100">Upcomming</button>
      <button className="px-6 py-1.5 hover:text-red-500  rounded-md font-semibold bg-gray-100">Missed</button>
      </div>
      </div>
      {/* THE TASK ITEMS */}
      <div className="w-full pt-4">
      {all_tasks.map((item,index)=>{
        return(
          <div key={index} className="my-5 flex items-center justify-between w-full">
          {/* box left */}
          <div className="flex gap-3">
          <div>
          <div className="flex items-center gap-2">
          <h1 className="text-gray-600 font-semibold">{item.title}</h1>
          <div className="bg-green-100 p-1 rounded-full">
          <BiCheck className="text-green-400"/>
          </div>
          </div>
          <p className="text-sm text-[#454545]">Priority high</p>
          </div>
          </div>
          {/* the box right */}
          <div className="flex items-center gap-4">

          <button className="bg-blue-100 flex items-center justify-center w-8 h-8 rounded-md">
          <BiEdit className="w-5 h-5 text-blue-500"/>
          </button>

          <button className="bg-red-100 flex items-center justify-center w-8 h-8 rounded-md">
          <BiTrash className="w-5 h-5 text-red-500"/>
          </button>
          </div>
          </div>
        )
      })}
      </div>
      </div>

  <div className="bg-white rounded-md mt-6 w-full shadow py-4 px-3">
  {/* the header */}
  <div className="w-full flex justify-between">
  <h1 className="font-semibold text-lg p-1">Recent activities</h1>
  {/* the navigation */}
  <div className="flex gap-5">
  <button className="px-6 py-1.5 hover:text-purple-500 text-purple-500 rounded-md font-semibold bg-gray-100">Calls</button>
  <button className="px-6 py-1.5 hover:text-blue-500 rounded-md font-semibold bg-gray-100">Follow ups</button>
  <button className="px-6 py-1.5 hover:text-green-500 rounded-md font-semibold bg-gray-100">Visit</button>
  </div>
  </div>
  {/* THE TASK ITEMS */}
  <div className="pt-5">
  {recentActivities.map((item,index)=>{
    return(
   <div key={index} className="flex justify-between">
   {/* left contents */}
   <div className="flex gap-3">
   {/* titmeline */}
   <div className="flex flex-col items-center">
   <div className="p-1 rounded-full bg-green-500">
   <BiSolidUser className="text-white"/>
   </div>
   <div className="w-0.5 h-16 bg-gray-600"></div>
   </div>
   <div className="">
    <h1 className="font-semibold text-gray-600">{item.title}</h1>
   <div className="w-[75px] bg-green-100 rounded-full">
   <p className="text-xs text-green-400 text-center">{item.time}</p>
   </div>
    <p className="text-sm text-[#454545]">{item.description}</p>
   </div>
   </div>
   {/* right contents */}
   <div>
   <button className="bg-red-200 p-1 rounded-md">
    <BiTrash className="text-red-500 w-5 h-5"/>
   </button>
   </div>
   </div>
    )
  })}
  </div>
   </div>

      </div>
    </div>
  )
}

export default Tasks;
