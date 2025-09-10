

const Footer = () => {
  return (
    <div className='w-full relative bg-[#212121]'>
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
  {/* the links */}
  <div className="flex justify-between 2xl:w-[70%] pt-24 pb-16 w-[90%] mx-auto">

  <div className="">
  <h1 className="text-white font-black text-3xl">KibagRep</h1>
  <p className="text-white pt-1">© 2025 KibagRep. All rights reserved</p>
  </div>

  <div>
 <h1 className="text-white font-black text-xl py-1">Quick links</h1>
 <div className="flex flex-col gap-3">
 <p className="text-white text-lg">Home</p>
 <p className="text-white text-lg">Features</p>
 <p className="text-white text-lg">Pricing</p>
 <p className="text-white text-lg">About</p>
 <p className="text-white text-lg">Contact us</p>
 </div>
  </div>

  <div>
 <h1 className="text-white font-black text-xl py-1">Social media</h1>
 <div className="flex flex-col gap-3">
 <p className="text-white text-lg">Facebook</p>
 <p className="text-white text-lg">Instagram</p>
 <p className="text-white text-lg">Facebook</p>
 <p className="text-white text-lg">LinkedIn</p>
 <p className="text-white text-lg">YouTube</p>
 </div>
  </div>

  <div>
 <h1 className="text-white font-black text-xl py-1">Support</h1>
 <div className="flex flex-col gap-3">
 <p className="text-white text-lg">FAQ</p>
 <p className="text-white text-lg">Help</p>
 <p className="text-white text-lg">Blog</p>
 <p className="text-white text-lg">Docs</p>
 <p className="text-white text-lg">Center</p>
 </div>
  </div>

  <div>
 <h1 className="text-white font-black text-xl py-1">Contact info</h1>
 <div className="flex flex-col gap-3">
 <p className="text-white text-lg">Email: support@kibagrep.com</p>
 <p className="text-white text-lg">Phone: 256 775 345 245 1</p>
 <p className="text-white text-lg">Address: Kampala,Uganda</p>
 <p className="text-white text-lg">Toll free: 0800 0898 453</p>
 </div>
  </div>

  </div>
    </div>
  )
}

export default Footer
