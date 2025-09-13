import { FaUserGroup } from "react-icons/fa6"


const StatsCard = (props:any) => {
  return (
    <div className="w-full bg-white p-4 rounded-md shadow-lg">
    <div className="flex justify-between">
    <div className="">
    <h1 className="text-md text-[#212121]">{props.title}</h1>
    <h1 className="font-black text-[#222f36] text-3xl">{props.total_count}</h1>
    </div>
    <div className="w-[40px] flex items-center justify-center h-[40px] rounded-full bg-red-500">
    <FaUserGroup className="w-5 h-5 text-white"/>
    </div>
    </div>
    <div className="pt-3 cursor-pointer text-green-500 flex w-full justify-between">
    <p className="underline">Active reps</p>
    <span className="text-sm py-0.5 px-3 rounded-full text-green-500 bg-green-100">34</span>
    </div>
    </div>
  )
}

export default StatsCard
