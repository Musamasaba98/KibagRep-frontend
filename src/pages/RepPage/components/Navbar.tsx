import { icons } from '../../../assets/assets';
import { BiMenu, BiSearch, BiSolidBell, BiSolidComment, BiSolidGrid } from "react-icons/bi"
import { FaChartPie } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toggleShowMenu } from '../../../store/uiStateSlice';


const Navbar = () => {

  const dispatch = useDispatch();

  return (
    <div className='w-full sticky top-0 flex flx-row items-center border-solid border-b-[1px] border-gray-200 justify-between px-3 h-[60px] bg-white'>
    {/* nav left */}
    <div className="flex flex-row gap-5">
    <div className="w-10 cursor-pointer flex items-center justify-center bg-[#19c464] h-10 rounded-md">
    <BiMenu className='w-7 h-7 text-white'/>
    </div>
    <div className="flex items-center gap-3 px-3 w-[311px] h-10 rounded-md bg-[#efefef]">
    <input className='w-[90%] bg-transparent outline-none' placeholder='search mockups & more'/>
    <BiSearch className='w-5 h-5 text-[#454545]'/>
    </div>
    </div>

    {/* nav right */}
    <div className="flex items-center flex-row gap-6">

    <div className="w-10 cursor-pointer h-10 flex justify-center items-center bg-[#efefef] rounded-full">
    <FaChartPie className='w-6 h-6'/>
    </div>

    <div className="w-10 cursor-pointer h-10 flex justify-center items-center bg-[#efefef] rounded-full">
    <BiSolidComment className='w-6 h-6'/>
    </div>

    <div className="w-10 cursor-pointer h-10 flex justify-center items-center bg-[#efefef] rounded-full">
    <BiSolidBell className='w-7 h-7'/>
    </div>

    <div 
    onClick={()=>dispatch(toggleShowMenu())}
    className="w-10 cursor-pointer h-10 flex justify-center items-center bg-[#efefef] rounded-full">
    <BiSolidGrid className='w-7 h-7'/>
    </div>

    <div className='cursor-pointer'>
    <img src={icons.test_img} className="w-10 object-cover h-10 bg-[#efefef] rounded-full"/>
    </div>

    </div>
    </div>
  )
}

export default Navbar
