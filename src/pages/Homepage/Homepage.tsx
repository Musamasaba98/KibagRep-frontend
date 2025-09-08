
const Homepage = () => {
  return (
    <div className="w-full">
       {/* Header / Hero Section */}
     <div className="w-full h-[550px] bg-[#09be51]">
        {/* Nav Bar */}
        <div className="w-full h-[70px] flex items-center justify-between px-12">
          {/* Logo */}
          <div>
            <h1 className="font-black text-white text-3xl">KibagRep</h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-5">
            <ul className="flex gap-7 text-white font-[Arial] text-lg">
              <li className="cursor-pointer">Features</li>
              <li className="cursor-pointer">Pricing</li>
              <li className="cursor-pointer">Services</li>
              <li className="cursor-pointer">Login</li>
            </ul>


            <button className="bg-white text-[#09be51] px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
              Signup for free
            </button>
          </div>
        </div>
        {/* End of Nav */}

        {/* Hero Content */}
        <div className="w-full pt-24 px-12 md:text-left mx-auto">
          <h1 className="font-bold text-4xl max-w-5xl md:text-5xl text-white leading-tight">
            The easiest way to manage your medical representatives with ease
          </h1>

          <p className="text-white text-lg md:text-xl pt-4 leading-relaxed max-w-2xl mx-auto md:mx-0">
            Assign tasks effortlessly and track daily activities in real-time.
            Monitor performance and ensure your team meets every target.
            Stay organized, save time, and never miss an important visit.
            Built for organizations looking to streamline field operations efficiently.
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-col md:flex-row gap-6 pt-11 justify-center md:justify-start">
            <button className="bg-white text-[#09be51] px-11 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
              Register Organization
            </button>
            <button className="border border-white text-white px-11 py-3 rounded-full font-semibold hover:bg-white hover:text-[#09be51] transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
