import { FaRegFlag } from "react-icons/fa6";
export default function TaskCard() {
  const newDate = new Date();
  return (
    <div className=" px-2 py-1">
      <div className="flex  items-center gap-2">
        <div className="flex flex-col">
          <div className="">
            <FaRegFlag fill="#ea2727" />
          </div>
          <p className="text-sm ">High</p>
        </div>
        <div className="w-[80%]">
          <p className="text-xs ">No activity on Opportunity for 33 days</p>
          <div className="flex justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold text-blue-900">STATUS</span>
              <span className="text-sm">Not Started</span>
            </div>
            <div className="text-xs">
              {newDate.toLocaleDateString().split("/").reverse().join("-")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
