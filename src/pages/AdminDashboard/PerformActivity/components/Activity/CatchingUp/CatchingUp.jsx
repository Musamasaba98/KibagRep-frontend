import React from 'react'
import { FaRegFlag } from 'react-icons/fa6';

const CatchingUp = () => {
  return (
    <div className='border-solid border-r-[1px] border-gray-200 h-full overflow-hidden'>

    <div className='px-3 pt-2'>
       <h2 className='text-[18px] font-[Arial]'>Catching Up</h2>
    </div>

    {/* The container that holds the catchinh up activities */}
    <div className="w-full">
    
   {/* This is the catching up item */}
<div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag/>
     </div>
     <div>
        <p>This  Oprn leah has no avtivity for 32 days</p>
        <h2 className='leading-none'><span className="text-blue-600 font-black text-md">NAME</span> <span className="text-sm">Davimed Pharmacy</span></h2>
        <button className="outline-none border-solid border-2 p-1 rounded-md mt-2 border-blue-600 text-sm">Create task</button>
     </div>
     <div>
        3 days ago
     </div>
    </div>
    {/* End of the catching up item */}


{/* This is the catching up item */}
<div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag/>
     </div>
     <div>
        <p>This  Oprn leah has no avtivity for 32 days</p>
        <h2 className='leading-none'><span className="text-blue-600 font-black text-md">NAME</span> <span className="text-sm">Davimed Pharmacy</span></h2>
        <button className="outline-none border-solid border-2 p-1 rounded-md mt-2 border-blue-600 text-sm">Create task</button>
     </div>
     <div>
        3 days ago
     </div>
    </div>
    {/* End of the catching up item */}


    </div>

   </div>
  )
}

export default CatchingUp;
