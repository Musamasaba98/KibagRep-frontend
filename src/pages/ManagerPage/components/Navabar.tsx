import { BiBell, BiMenu, BiSearch, BiSolidGrid } from "react-icons/bi";
import { icons } from "../../../assets/assets";
import { FaRegComment } from "react-icons/fa6";


const Navabar = () => {
  return (
    <div className="w-full px-6 z-[300] sticky top-0 flex items-center justify-between bg-white h-[60px] border-solid border-b-[1px] border-gray-200">
    {/* nav left */}
    <div className="cursor-pointer">
    <BiMenu className="w-7 h-7 text-[#4c4c5c]"/>
    </div>

    {/* the right nav */}
    <div className="flex items-center gap-8">

    <div className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full p-1">
    <BiSearch className="w-5 h-5 text-[#4c4c5c]"/>
    </div>

    <div className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full p-1">
    <BiBell className="w-5 h-5 text-[#4c4c5c]"/>
    </div>

   <div className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full p-1">
    <FaRegComment className="w-5 h-5 text-[#4c4c5c]"/>
    </div>

    <div className="relative w-[35px] h-[35px] flex items-center justify-center cursor-pointer bg-gray-100 rounded-full p-1">
    <BiSolidGrid className="w-6 h-6 text-[#4c4c5c]"/>
    </div>

    <div>
    <img src={icons.test_img} className="w-[35px] h-[35px] rounded-full object-cover"/>
    </div>
    </div>
    </div>
  )
}

export default Navabar;
