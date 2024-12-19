import React, { useContext } from 'react'
import { AppContext } from '../../pages/context/AppContext';

const Dashboard = () => {

  const activity=[

    {
      count:55,
      title:'Schedule'

    },
    {
      count:'00',
      title:'PCP Done'

    },
    {
      count:'00',
      title:'Detailing'

    },
    {
      count:'00',
      title:'NCA',
      type:'NCA'

    },

  ];

  const follow_ups=[

    {
      top:'00',
      title:'Notifications'

    },
    {
      top:'0',
      title:'My request'

    },
    {
      top:'Approved(May-24)',
      title:'MTP'

    },
    {
      top:'+2/-11',
      title:'Doctor'

    },

  ];

  const {setShowNca}=useContext(AppContext);


  return (
    <div className='w-[100%] flex justify-center pt-5 flex-col gap-11 pl-4'>
   
    <div className='bg-slate-50 w-[93%] pb-7 rounded-sm px-4 py-2'>

        <div className='py-2 px-3 border-solid border-l-[5px] border-cyan-400'>
            <h1 className='text-xl leading-none font-semibold'>Todays call activity</h1>
        </div>

        <div className='flex gap-7'>
        {activity.map((item,index)=>{
          return (
            <div onClick={()=>{item.type==="NCA"?setShowNca(true):""}} className='bg-white w-[130px] h-[100px] rounded mt-2' key={index}>
            
            <h2 className="text-center font-light text-3xl text-[#454545]">{item.count}</h2>
            
            <div>
              <p className='text-[18px] font-[Arial] text-[#454545] text-center pt-[30px]'>{item.title}</p>
            </div>
            </div>
          )
        })}
        </div>
      
    </div>



    <div className='bg-slate-50 w-[93%] pb-7 rounded-sm px-4 py-2'>

    <div className='py-2 px-3 flex justify-between '>

  <div className="border-solid border-l-[5px] border-cyan-400">
    <h1 className='pl-2 text-xl leading-none font-semibold'>Sync</h1>
  </div>

   <div>
   <button className='text-white outline-none px-8 py-2 text-sm bg-cyan-400 rounded-3xl'>Sync</button>
   </div>

</div>

<div className='flex gap-7'>
{activity.map((item,index)=>{
  return (
    <div className='bg-white w-[130px] h-[100px] rounded mt-2' key={index}>
    <h2 className="text-center font-light text-3xl text-[#454545]">{item.count}</h2>
    
    <div>
      <p className='text-[18px] font-[Arial] text-[#454545] text-center pt-[30px]'>{item.title}</p>
    </div>
    </div>
  )
})}
</div>

</div>



<div className='bg-slate-50 w-[93%] pb-7 rounded-sm px-4 py-2'>

    <div className='py-2 px-3 flex justify-between border-solid border-l-[5px] border-cyan-400'>

    <h1 className='pl-2 text-xl leading-none font-semibold'>Follow-ups</h1>

</div>

<div className='flex gap-7'>
{follow_ups.map((item,index)=>{
  return (
    <div className='bg-white w-[210px] pt-3 h-[100px] rounded mt-2' key={index}>
    <h2 className="text-center font-light text-xl text-[#454545]">{item.top}</h2>
    
    <div>
      <p className='text-[18px] font-[Arial] text-[#454545] text-center pt-[27px]'>{item.title}</p>
    </div>
    </div>
  )
})}
</div>

</div>


<div className='bg-slate-50 w-[93%] pb-7 rounded-sm px-4 py-2'>

        <div className='py-2 px-3 border-solid border-l-[5px] border-cyan-400'>
            <h1 className='text-xl leading-none font-semibold'>Special occassions</h1>
        </div>

        <div className='flex gap-7'>
       
        </div>
      
    </div>





    </div>
  )
}

export default Dashboard; 
