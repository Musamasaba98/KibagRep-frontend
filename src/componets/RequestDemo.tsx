import { icons } from "../assets/assets";

const RequestDemo = () => {
  return (
    <div className='w-full py-9 bg-white mt-12'>
    {/* the title and desc */}
    <div className="w-full">
    <h1 className="text-center font-black text-3xl">Ready to boost your field operations ?</h1>
    <p className="text-center text-lg text-[#454545]">Experience how KibagRep can streamline your team’s operations. Fill out the form and get a personalized demo today</p>
    </div>
    <div className="w-[90%] 2xl:w-[70%] flex justify-around py-12 mx-auto">
   
   {/* the left image */}
   <div className="w-[30%]">
   <img src={icons.hero_3_img} className="w-full" />
   </div>

   {/* the request demo form */}
    <div className="w-[360px] p-4 rounded-md h-[380px] bg-white">
    <div>
    <h1 className="font-black text-2xl">Request demo</h1>
    </div>
    {/* the form fields */}
    <div className="flex flex-col pt-5 gap-5">
    
    <div className="">
    <input type="text" className="w-full text-lg p-2 border-solid border-[1px] border-gray-300 rounded-md outline-none" placeholder="Your full name" autoComplete="off"/>
    </div>

    <div className="">
    <input type="email" className="w-full text-lg p-2 border-solid border-[1px] border-gray-300 rounded-md outline-none" placeholder="Your email" autoComplete="off"/>
    </div>

    <div className="">
    <input type="text" className="w-full text-lg p-2 border-solid border-[1px] border-gray-300 rounded-md outline-none" placeholder="Company name" autoComplete="off"/>
    </div>

    <div className="">
    <textarea className="w-full text-lg p-2 border-solid border-[1px] border-gray-300 rounded-md outline-none" placeholder="Question/comment">
    </textarea>
    </div>

    <div className="">
    <button className="w-full bg-[#09be51] shadow-lg text-lg p-2 text-white rounded-md outline-none">
    Request demo
    </button>
    </div>

    </div>
    </div>

    </div>
    </div>
  )
}

export default RequestDemo;
