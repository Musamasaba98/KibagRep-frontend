import { FaBell, FaLetterboxd, FaList } from "react-icons/fa6";



const Navbar = () => {

  return (
    <div className="w-full z-[100] flex sticky top-0 items-center justify-between h-[60px] px-6 bg-white border-solid border-b-[1px] border-gray-100">

      <div>
      <FaList className="w-6 h-6"/>
      </div>


     {/* This the div-nav right */}
     <div className="flex gap-7 items-center">

      <div>
      <FaBell className="w-6 h-6"/>
      </div>

      <div>
      <FaLetterboxd className="w-6 h-6"/>
      </div>
      
      <div>
      <FaList className="w-6 h-6"/>
      </div>

      <div>
      <img src="src/assets/test.webp"  className="w-[45px] h-[45px] rounded-full object-cover" />
      </div>

     </div>

    </div>
  )
}

export default Navbar;
