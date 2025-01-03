import React from 'react'

const PerformActivity = () => {
  return (
    <div className='w-ful mt-6 mx-8'>

        {/* The conatiner to hold the : activities,revenue & more */}
        <div className="w-full bg-white rounded-md h-[400px]">

          <div className='p-4 px-5 border-solid border-b-[1px] border-gray-100'>
            <ul>
              <li className="cursor-pointer inline-block font-light font-[Arial] text-[18px]">Activity</li>
              <li className="cursor-pointer inline-block font-light font-[Arial] text-[18px] px-6">Revenue</li>
              <li className="cursor-pointer inline-block font-light font-[Arial] text-[18px] px-6">Performance</li>
              <li className="cursor-pointer inline-block font-light font-[Arial] text-[18px] px-6">Events</li>
            </ul>
          </div>

        </div>
      
    </div>
  )
}

export default PerformActivity;
