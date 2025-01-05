import {FaUsers} from "react-icons/fa6"

const TopCards = () => {
  return (
    <div className="w-ful flex flex-wrap pt-5 px-8 gap-3 lg:gap-3 xl:gap-6 2xl:gap-10">

       {/* This is the top card */}
      <div className="w-[23%] flex items-center px-3 h-[150px] bg-gradient-to-r from-green-100 to-red-100 rounded-md border-solid border-[1px] border-[#cacaca]">
      
      <div className="flex justify-between gap-6 w-full">
      <div>
        <h2 className="text-[18px] font-[Arial] font-light">Total Field Reps</h2>
        <h1 className="font-bold text-3xl">3,000</h1>
      </div>

      <div className="w-[60px] h-[60px] bg-blue-400 rounded-full flex items-center justify-center">
        <FaUsers fill="#fff" className="w-7 h-7"/>
      </div>

      </div>
      </div>
      {/* The end of the top card */}

      {/* This is the top card */}
      <div className="w-[23%] flex items-center px-3 h-[150px] bg-gradient-to-r from-blue-200 to-orange-100 rounded-md border-solid border-[1px] border-[#cacaca]">
      
      <div className="flex justify-between gap-6 w-full">
      <div>
        <h2 className="text-[18px] font-[Arial] font-light">Total Field Reps</h2>
        <h1 className="font-bold text-3xl">3,000</h1>
      </div>

      <div className="w-[60px] h-[60px] bg-blue-400 rounded-full flex items-center justify-center">
        <FaUsers fill="#fff" className="w-7 h-7"/>
      </div>

      </div>
      </div>
      {/* The end of the top card */}

      {/* This is the top card */}
      <div className="w-[23%] flex items-center px-3 h-[150px] bg-gradient-to-r from-blue-100 to-red-100 rounded-md border-solid border-[1px] border-[#cacaca]">
      
      <div className="flex justify-between gap-6 w-full">
      <div>
        <h2 className="text-[18px] font-[Arial] font-light">Total Field Reps</h2>
        <h1 className="font-bold text-3xl">3,000</h1>
      </div>

      <div className="w-[60px] h-[60px] bg-blue-400 rounded-full flex items-center justify-center">
        <FaUsers fill="#fff" className="w-7 h-7"/>
      </div>

      </div>
      </div>
      {/* The end of the top card */}

  
  

      <div className="w-[23%] flex items-center px-3 h-[150px] bg-gradient-to-r from-blue-100 to-red-100 rounded-md border-solid border-[1px] border-[#cacaca]">
      
      <div className="flex justify-between gap-6 w-full">
      <div>
        <h2 className="text-[18px] font-[Arial] font-light">Total Field Reps</h2>
        <h1 className="font-bold text-3xl">3,000</h1>
      </div>

      <div className="w-[60px] h-[60px] bg-blue-400 rounded-full flex items-center justify-center">
        <FaUsers fill="#fff" className="w-7 h-7"/>
      </div>

      </div>
      </div>
      {/* The end of the top card */}

    </div>
  )
}

export default TopCards;