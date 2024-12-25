import { FaRegFlag, FaPhone } from "react-icons/fa6";
export default function EventsCard() {
  const newDate = new Date();
  return (
    <div className="flex mx-2 xl:mx-4 items-center gap-2">
      <div className="flex flex-col">
        <div className="">
          <FaRegFlag fill="#ea2727" />
        </div>
        <p className="text-xs ">09:00am</p>
      </div>
      <div className="flex flex-col">
        <div className="flex gap-3 items-center">
          <h3 className="text-md">Breakfast meeting</h3>
          <span className="text-sm">In about 5 mins</span>
        </div>
        <div className="flex gap-1 justify-between ">
          <div className="flex gap-1">
            <p className="font-bold text-blue-900 phone">
              <FaPhone />
              {/* PHONE CALL */}
            </p>
            <span className="text-xs">with Doctors...</span>
          </div>
          <div className="flex gap-2">
            <p className="text-xs">{newDate.toLocaleDateString()}</p>
            <span className="text-xs">40 mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
