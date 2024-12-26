import { FaList } from "react-icons/fa6";


const Navbar = () => {
  return (
    <div className="w-full z-[100] flex sticky top-0 items-center justify-between px-6 h-[60px] bg-white border-solid border-b-[1px] border-gray-200">

      <div className="flex gap-2">
      <img src="src/assets/test.webp" className="w-[45px] h-[45px] rounded-full object-cover" />
      
      <div>
        <h1 className="font-bold text-lg">Masaba Musa</h1>
        <p className="leading-none text-[#454545] text-xs">ROLE: ADMIN</p>
      </div>
      </div>

      <div>
        <FaList className="w-7 h-7"/>
      </div>

    </div>
  )
}

export default Navbar;
