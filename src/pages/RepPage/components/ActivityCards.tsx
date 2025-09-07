

const ActivityCards = () => {
  return (
    <div className="w-full">
    <div className="w-full">
    <h1 className="font-bold text-xl">Todays call activity</h1>
    </div>
    {/* the cards */}
    <div className="w-full flex gap-7 pt-3">

    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer justify-center flex flex-col items-center w-[210px] shadow bg-gradient-to-tr from-blue-100 to-white rounded-md">
    <h1 className="font-black text-5xl text-blue-500">450</h1>
    <p className="font-semibold pt-6 text-lg">PCB done</p>
    </div>

    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer justify-center flex flex-col items-center w-[210px] shadow bg-gradient-to-tr from-green-100 to-white rounded-md">
    <h1 className="font-black text-5xl text-green-500">18</h1>
    <p className="font-semibold pt-6 text-lg">Schedule</p>
    </div>

    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer justify-center flex flex-col items-center w-[210px] shadow bg-gradient-to-tr from-red-100 to-white rounded-md">
    <h1 className="font-black text-5xl text-red-500">00</h1>
    <p className="font-semibold pt-6 text-lg">Detailing</p>
    </div>

    <div className="h-[140px] duration-500 hover:shadow-md cursor-pointer justify-center flex flex-col items-center w-[210px] shadow bg-gradient-to-tr from-purple-100 to-white rounded-md">
    <h1 className="font-black text-5xl text-purple-500">00</h1>
    <p className="font-semibold pt-6 text-lg">NCA</p>
    </div>
    
    </div>


    </div>
  )
}

export default ActivityCards;
