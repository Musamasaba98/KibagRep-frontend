

const Navbar = () => {
  return (
    <div className="w-full z-[200] shadow sticky top-0 bg-white">
    <div className="w-[90%] 2xl:w-[70%] mx-auto h-[65px] flex items-center justify-between">
          {/* Logo */}
          <div>
            <h1 className="font-black text-[#212121] text-3xl">Kibag<span className="text-[#09be51]">Rep</span></h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-11">
            <ul className="flex gap-11 font-[Arial] text-lg">
              <li className="cursor-pointer">Features</li>
              <li className="cursor-pointer">Pricing</li>
              <li className="cursor-pointer">Docs</li>
              <li className="cursor-pointer">About</li>
              <li className="cursor-pointer">Login</li>
            </ul>


            <button className="bg-text bg-[#09be51] text-white px-6 py-3 rounded-full font-semibold hover:bg-green-300 transition">
              Signup for free
            </button>
          </div>
        </div>
    </div>
  )
}

export default Navbar
