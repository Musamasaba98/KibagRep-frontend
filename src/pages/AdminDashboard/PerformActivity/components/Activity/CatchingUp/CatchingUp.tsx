import React from 'react'
import { FaRegFlag } from 'react-icons/fa6';

const CatchingUp = () => {
  return (
    <div className='border-solid border-r-[1px] border-gray-200 h-full overflow-hidden'>

    <div className='px-3 pt-2'>
       <h2 className='text-[18px] font-[Arial]'>Catching Up</h2>
    </div>

 {/* This is the conatiner fro holding the catching up items */}
 <div className="w-full px-3 overflow-hidden h-[89%]">

<div className="w-full h-[50px] bg-gray-200 rounded-md mt-3"></div>
<div className="w-full h-[50px] bg-gray-200 rounded-md mt-3"></div>
<div className="w-full h-[50px] bg-gray-200 rounded-md mt-3"></div>
<div className="w-full h-[50px] bg-gray-200 rounded-md mt-3"></div>
<div className="w-full h-[50px] bg-gray-200 rounded-md mt-3"></div>

</div>
    
   </div>
  )
}

export default CatchingUp;
