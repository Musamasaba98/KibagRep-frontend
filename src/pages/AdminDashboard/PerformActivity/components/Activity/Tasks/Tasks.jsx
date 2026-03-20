import React from 'react'
import { FaRegFlag } from 'react-icons/fa6';

const Tasks = () => {
  return (
    <div className='border-solid border-r-[1px] border-gray-100'>

     <div className='px-3 pt-2'>
        <h2 className='text-[18px] font-[Arial]'>My tasks</h2>
     </div>
      {/* This the tasks container */}
     <div className="w-full px">

     {/* This div below is the task item and if you wish you can turn it into a component */}
     <div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag fill='#ff0000'/>
        <p>High</p>
     </div>

     <div>
        <p>No activity on Opportunity for 22 days</p>
        <h2 className='leading-none'><span className="font-black text-blue-700">STATUS </span><span className='text-sm'>Not started</span></h2>
     </div>

     <div>
        <p>2024-6-5</p>
     </div>

     </div>
    {/*End of task div container*/}

     {/* This div below is the task item and if you wish you can turn it into a component */}
     <div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag fill='#ff0000'/>
        <p>High</p>
     </div>

     <div>
        <p>No activity on Opportunity for 22 days</p>
        <h2 className='leading-none'><span className="font-black text-blue-700">STATUS </span><span className='text-sm'>Not started</span></h2>
     </div>

     <div>
        <p>2024-6-5</p>
     </div>

     </div>
    {/*End of task div container*/}

     {/* This div below is the task item and if you wish you can turn it into a component */}
     <div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag fill='#ff0000'/>
        <p>High</p>
     </div>

     <div>
        <p>No activity on Opportunity for 22 days</p>
        <h2 className='leading-none'><span className="font-black text-blue-700">STATUS </span><span className='text-sm'>Not started</span></h2>
     </div>

     <div>
        <p>2024-6-5</p>
     </div>

     </div>
    {/*End of task div container*/}

 {/* This div below is the task item and if you wish you can turn it into a component */}
 <div className="w-full flex justify-between items-center px-3 mt-6">
     <div>
        <FaRegFlag fill='#ff0000'/>
        <p>High</p>
     </div>

     <div>
        <p>No activity on Opportunity for 22 days</p>
        <h2 className='leading-none'><span className="font-black text-blue-700">STATUS </span><span className='text-sm'>Not started</span></h2>
     </div>

     <div>
        <p>2024-6-5</p>
     </div>

     </div>
    {/*End of task div container*/}


     </div>
     {/* End of the tasks container */}


    </div>
  )
}

export default Tasks;
