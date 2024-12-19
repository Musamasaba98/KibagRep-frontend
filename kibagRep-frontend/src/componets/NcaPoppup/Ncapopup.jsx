import React, { useContext } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { AppContext } from '../../pages/context/AppContext';

// Building the NCA page popup.

const Ncapopup = () => {

    const {setShowNca}=useContext(AppContext);

  return (
    <div className='w-full h-screen flex items-center bg-[#100000a4] fixed top-[0] z-[100]'>

        <div className="w-[75%] bg-white h-[75vh] 2xl:h-[55vh] mx-auto py-auto relative">

            <div className="w-full items-center bg-cyan-400 h-[60px] flex px-6 justify-between">
            <h2 className='text-white font-bold text-2xl'>NCA</h2>

            <FaXmark fill="#fff" className='w-6 h-6 ms-1.5' onClick={()=>setShowNca(false)}/>

            </div>
            {/* End of the NCA  haeding div */}

            <div>
              <h2 className='font-bold text-xl pt-3 pl-2'>Visit Details</h2>
            </div>

            {/* Building the form */}
            <form method='post' className="w-[100%] px-3 mx-auto mt-6">
             
              {/* This is the biginning of the first form input fields */}
             <div className="flex gap-5 justify-between">

            <input type="date" name="" id="" className='w-[20%] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'/>

            <input type="text" value={'Wellness 3 UG-Task force...'} name="" id="" className='w-[20%] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'/>

            <select name="" id="" className='w-[20%] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'>
            <option value="Select NCA type">Select NCA type</option>
            </select>


            <input type="text" name="" placeholder='Enter NCA name' className='w-[20%] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'/>


            <select name="" id="" className='w-[20%] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'>
              <option value="Select town">Select town</option>
            </select>

             </div>
            {/* This is the end of the first form input fields */}

            <div className="flex pt-6 gap-4 w-full">
            
            <div className="flex gap-2">
            <input type="radio" name="" id="" />
            <p>Half day</p>
            </div>

            <div className="flex gap-2">
            <input type="radio" name="" id="" />
            <p>Full day</p>
            </div>

            <div>
              <select name="" id="" className='w-[170px] outline-0 pb-1 text-[#454545] border-solid border-b-[2px] border-[#454545]'>
                <option value="Select session">Select session</option>
              </select>
            </div>

            </div>
            {/* End of radios and input */}

            <div className="flex gap-9 pt-5">

            <div>
            <p className='font-bold'>Joint work</p>

            </div>

            <div>
            <p className='font-bold'>Add unlisted</p>

            </div>

            <div>
            <p className='font-bold'>Add unlisted</p>
            </div>

            </div>
            {/* End of add options */}

            <div className="flex gap-4 pt-4">

              <input type="text" className='px-2 h-[42px] w-[280px] outline-[0] border-solid rounded-md  border-[2px] border-[#454545]'/>
              
              <input type="text" className='px-2 h-[42px] w-[280px] outline-[0] border-solid rounded-md  border-[2px] border-[#454545]'/>

            </div>

            {/* End of the 2 inputs */}

            <h2 className='font-bold pt-3'>Comments</h2>

            <div className="w-full">
              <input type="text" className="w-full mt-3 font-semibold text-[#454545] outline-none border-solid border-b-2 pb-1 border-[#454545]" placeholder='Add a comment'/>
            </div>

            {/* Beginning of the last container */}

            <div className="pt-4 flex gap-4">
            
            <button type="button" className='bg-cyan-400 text-white outline-0 px-8 h-[42px] rounded-md'>Save</button>

            <button type='submit' className='bg-cyan-400 text-white outline-0 px-8 h-[42px] rounded-md'>Submit</button>

            </div>

    
            </form>

            </div>
      
    </div>
  )
}

export default Ncapopup;
