import React, { useState } from 'react';
import { generateCalendarDays } from '../../../utils/utils';
import { format,isSameMonth,addMonths,subMonths } from 'date-fns';


const Calendar = () => {

  const [currentDate,setCurrentDate] = useState(new Date());

  const days = generateCalendarDays(currentDate);


  return (
    <div className='w-full pb-3 px-8 mt-4'>
        
        {/* This is the exact calendar container */}
        <div className="calendar w-full h-full bg-white rounded-sm">
         
         <div className="headern w-full py-4 bg-green-500 flex justify-between">
          <h1 className='px-4 font-black text-3xl text-white'>January</h1>
          <h1 className='px-4 font-black text-3xl text-white'>2025</h1>
         </div> 

         <div className='text-[18px] font-[Arial] w-full grid grid-cols-7 pt-2'>
            <p className='text-center'>SUN</p>
            <p className='text-center'>MON</p>
            <p className='text-center'>TUE</p>
            <p className='text-center'>WED</p>
            <p className='text-center'>THUR</p>
            <p className='text-center'>FRI</p>
            <p className='text-center'>SAT</p>
         </div>

         <div className="w-full grid grid-cols-7 mt-2">
          {days.map((item,index)=>{
            return(
            <li className={`border-solid border-[1px] border-gray-100 ${isSameMonth(item,currentDate)?`text-black`:`text-gray-400`} list-none text-[18px] font-[Arial] w-full text-center py-8 px-8`}>
              {format(item,"d")}
              </li>
            );
          })}
         </div>

        </div>
        {/* End of calendar container */}

    </div>
  )
}

export default Calendar;