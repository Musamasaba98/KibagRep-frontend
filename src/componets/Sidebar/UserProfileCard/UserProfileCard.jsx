import { FaLocationDot } from "react-icons/fa6";

export default function UserProfileCard() {
  return (
    <div className="flex items-center  bg-white rounded-lg ">
      <div className="w-10 h-10 flex-shrink-0">
        <img
          src="https://via.placeholder.com/150"
          alt="user-profile-pic"
          className="w-full h-full rounded-full object-cover"
        />
      </div>
      <div className="ml-4">
        <h2 className="font-bold text-md text-gray-900 leading-tight">
          User Name
        </h2>
        <p className="text-sm text-gray-600">9:45 AM - 10:23 AM</p>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <FaLocationDot className="text-[#5ac388] mr-1" />
          <span>Location Info</span>
        </div>
      </div>
    </div>
  );
}
