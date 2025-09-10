import { Link } from "react-router-dom";


const Signup = () => {
  return (
    <div className="w-full overflow-y-auto pb-6 bg-gray-50 h-screen flex justify-center items-center">
    {/* the signup form */}
    <form method="post" className="w-[420px] px-5 bg-white shadow-lg py-5 rounded-md">
   {/* form header */}
   <div className="w-full">
   <h1 className="text-center font-bold text-2xl">Create admin account</h1>
   </div>
   {/* the form fields */}
   <div className="flex w-full flex-col gap-6 mt-7">
  
  <div className="w-full">
  <input type="text" placeholder="Your full name" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

  <div className="w-full">
  <input type="email" placeholder="Your email" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

   {/* the phone field */}
  <div className="flex flex-row gap-3">
  <select name="country_code" className="p-3 outline-green-400 rounded border-solid border-[1px] border-[#cacaca]">
  <option value="256">+256</option>
  </select>
   <input type="number" placeholder="Your phone number" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  </div>

  <div className="w-full">
  <input type="password" placeholder="Your password" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

  <div className="w-full">
  <input type="password" placeholder="Confirm password" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

  <div className="w-full">
  <input type="submit" value={'Signup now'} className="w-full text-white text-lg rounded-md p-3 cursor-pointer bg-[#09be51]"/>
  <p className=""></p>
  </div>

   </div>
   <div>
   <p className="text-[#454545] pt-2">Already have an account?<Link to="/login">Login</Link></p>
   </div>
    </form>
    </div>
  );
};

export default Signup;
