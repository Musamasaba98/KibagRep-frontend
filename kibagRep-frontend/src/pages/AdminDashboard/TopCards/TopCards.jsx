

const TopCards = () => {
  return (
    <div className="w-full px-2 flex justify-between pt-6">

        <div className="card bg-white relative w-[23%] h-[140px] pt-2 overflow-hidden rounded-md shadow-md">
         <h1 className="font-black text-6xl text-center">10</h1>
         
         <div className="w-full absolute bottom-0 bg-green-500">
            <p className="text-white font-[Arial] text-center py-2 text-[18px]">Managers</p>
         </div>
        </div>

        <div className="card bg-white relative w-[23%] h-[140px] pt-2 overflow-hidden rounded-md shadow-md">
         <h1 className="font-black text-6xl text-center">12</h1>
         
         <div className="w-full absolute bottom-0 bg-red-500">
            <p className="text-white font-[Arial] text-center py-2 text-[18px]">Supervisors</p>
         </div>
        </div>

        <div className="card bg-white relative w-[23%] h-[140px] pt-2 overflow-hidden rounded-md shadow-md">
         <h1 className="font-black text-6xl text-center">60</h1>
         
         <div className="w-full absolute bottom-0 bg-blue-500">
            <p className="text-white font-[Arial] text-center py-2 text-[18px]">Field Reps</p>
         </div>
        </div>

        <div className="card bg-white relative w-[23%] h-[140px] pt-2 overflow-hidden rounded-md shadow-md">
         <h1 className="font-black text-6xl text-center">120</h1>
         
         <div className="w-full absolute bottom-0 bg-red-500">
            <p className="text-white font-[Arial] text-center py-2 text-[18px]">Workers</p>
         </div>
        </div>
       
    
    </div>
  )
}

export default TopCards;