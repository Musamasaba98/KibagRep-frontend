
import { FaUserGroup } from "react-icons/fa6"
import { icons } from "../assets/assets"
import { BiBarChart } from "react-icons/bi"


const AboutBanner = () => {
  return (
    <div className="w-full relative">

    <div className="absolute top-0 w-full overflow-hidden leading-none rotate-[-180]">
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

    <div className="w-full bg-[#09be51] pt-24 pb-24 mt-8 flex">
    <div className="w-[90%] 2xl:w-[70%] flex justify-between mx-auto">
    {/* the left container */}
    <div className="w-[50%]">
    <div>
    <h1 className="font-black text-white text-4xl">Built specifically for Africa's healthcare challenges</h1>
    <p className="pt-3 leading-relaxed text-white md:text-xl text-lg">Tackle Africa’s unique healthcare needs with tools that help medical teams stay organized, reach more clinics, and make smarter decisions—fast and easily</p>
    </div>
    {/* the lists */}
    <div className="flex flex-col gap-5 py-7">

    <div className="flex gap-3">
    <div className="bg-white w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full">
    <FaUserGroup className="w-6 h-6 text-[#09be51]"/>
    </div>
    <div>
    <h1 className="text-white font-black text-xl">Managing medical reps easily</h1>
    <p className="text-white leading-[20px]">Assign tasks, track visits, and stay updated in real-time—anywhere, anytime</p>
    </div>
    </div>

    <div className="flex gap-3">
    <div className="bg-white w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full">
    <BiBarChart className="w-8 h-8 text-[#09be51]"/>
    </div>
    <div>
    <h1 className="text-white font-black text-xl">Boost Team Performance</h1>
    <p className="text-white leading-[20px]">Monitor progress, get instant insights, and make decisions that drive results</p>
    </div>
    </div>

    </div>
    </div>
    {/* the left container */}
    <div className="w-[45%]">
    <img src={icons.hero_2_img} className=""/>
    </div>
    </div>

    </div>

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

export default AboutBanner
