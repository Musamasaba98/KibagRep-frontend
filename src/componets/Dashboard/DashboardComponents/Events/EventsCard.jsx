import { FaRegClock } from "react-icons/fa6";
export default function EventsCard() {
  const newDate = new Date();
  return (
    <div className="flex mx-auto 2xl:mx-4 w-[95%] items-center justify-between py-1 px-3 ">
      <div className="flex items-center flex-col">
        <div className="">
          <FaRegClock fill="#ea2727" />
        </div>
        <p className="text-xs ">09:00 am</p>
      </div>
      <div className="flex w-[80%] px-4 justify-between flex-col">
        <div className="flex justify-between items-center ">
          <h3 className="text-md">Breakfast meeting</h3>
          <span className="text-sm">In about 5 mins</span>
        </div>
        <div className="flex gap-1 justify-between ">
          <div className="flex gap-1">
            <p className="font-bold text-blue-900 phone">
              {/* <FaPhone /> */}
              PHONE CALL
            </p>
            <span className="text-xs">with Doctors Hospital, Sseguku</span>
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
