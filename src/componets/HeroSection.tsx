import { icons } from "../assets/assets"


const HeroSection = () => {
  return (
     <div className="w-full flex justify-between overflow-hidden relative bg-[#09be51] pb-24">
        {/* Hero Content */}
        <div className="w-[90%] 2xl:w-[70%] flex mx-auto">
        {/* the hero left section */}
        <div className="w-full pt-11 md:text-left">
          <h1 className="font-bold text-4xl max-w-5xl md:text-5xl text-white leading-tight">
            The simplest way to manage your medical representatives with ease
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

        {/* the hero right section */}
        <div className="">
        <img src={icons.hero_img} className="" />
        </div>
        </div>


{/* Wave SVG at the bottom */}
  <div className="absolute bottom-0 w-full overflow-hidden leading-none rotate-180">
    <svg
      className="relative block w-full h-20"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      viewBox="0 0 1200 120"
    >
      <path
        d="M0,0 C600,120 600,0 1200,120 L1200,0 L0,0 Z"
        className="fill-white"
      ></path>
    </svg>
  </div>


      </div>
  )
}

export default HeroSection
