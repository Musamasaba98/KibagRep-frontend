import React, { useContext } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { AppContext } from '../../pages/context/AppContext';


const MenuPopup = () => {

    const {setShowMenu,setShowUnplanned}=useContext(AppContext);

  return (
    <div className='w-[100%] flex justify-end h-screen bg-[#100000a4] fixed top-[0] z-[100]'>
      
      <div className="w-[340px] bg-white h-screen">

        <div className="w-full flex items-center justify-end pr-3 h-[60px] bg-cyan-400">
        <FaXmark fill='#fff' className='w-7 h-7 ms-2.5' onClick={()=>{
            setShowMenu(false);
        }}/>
        </div>
        <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

        <div className="links cursor-pointer">

         <div className='w-full py-3 px-3 hover:text-white'>
            <p onClick={()=>{setShowMenu(false);setShowUnplanned(true)}} className='font-light text-[#454545] text-[18px] font-[Arial]'>Add Unplanned</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Competitor Intelligence</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Plan</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Survey</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Stock Capture</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Profiler</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Reporting</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Checkout</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>View Action Point</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

         <div className='w-full py-3 px-3'>
            <p className='font-light text-[#454545] text-[18px] font-[Arial]'>Change password</p>
         </div>
         <hr className='outline-0 border-0 h-[0.3px] bg-[#efefef]'/>

        </div>

      </div>

    </div>
  )
}

export default MenuPopup;
