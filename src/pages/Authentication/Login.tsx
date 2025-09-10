import { Link } from "react-router-dom";


const Login = () => {
  return (
    <div className="w-full overflow-y-auto pb-6 bg-gray-50 h-screen flex justify-center items-center">
    {/* the signup form */}
    <form method="post" className="w-[420px] px-5 bg-white shadow-lg py-5 rounded-md">
   {/* form header */}
   <div className="w-full">
   <h1 className="text-center font-bold text-2xl">Login to your account</h1>
   </div>
   {/* the form fields */}
   <div className="flex w-full flex-col gap-6 mt-7">
  
  <div className="w-full">
  <input type="email" placeholder="Your email" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

  <div className="w-full">
  <input type="password" placeholder="Confirm password" className="w-full outline-green-400 rounded-md p-3 border-solid border-[1px] border-[#cacaca]"/>
  <p className=""></p>
  </div>

  <div className="w-full">
  <input type="submit" value={'Login now'} className="w-full text-white text-lg rounded-md p-3 cursor-pointer bg-[#09be51]"/>
  <p className=""></p>
  </div>

   </div>
   <div>
   <p className="text-[#454545] pt-2">Don't have an account?<Link to="/signup">Signup</Link> <span className="text-sm pl-6 text-blue-500 cursor-pointer">Forgot password?</span></p>
   </div>
    </form>
    </div>
  );
};

export default Login;
