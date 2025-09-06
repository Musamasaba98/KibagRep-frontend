import EventsCard from "./EventsCard";
import { FaPlus } from "react-icons/fa6";

export default function Events() {
  return (
    <div className=" w-[95%] mx-auto">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-light">Today&apos;s Events</h3>
        <button className="bg-gray-200 rounded-xl p-1 shadow-md">
          <FaPlus />
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-xl ml-4 mb-1">
        <EventsCard />
      </div>
      <div className="bg-white rounded-lg shadow-xl ml-4 mb-1">
        <EventsCard />
      </div>
    </div>
  );
}
