import { useContext } from "react";
import { AppContext } from "./context/AppContext";

export default function Summarypage() {
  const { data } = useContext(AppContext);
  return (
    <>
      <div className="grid grid-cols-2 gap-20">
        <div className="">
          <h3 className="text-lg ">Backlog Summary</h3>
          <div className="grid grid-cols-2 gap-5 p-2 rounded-lg">
            <div className="bg-cyan-400 text-white flex flex-col justify-center items-center py-2">
              <p className="text-xl">Missed</p>
              <p className="text-md">{data.summary.missed}</p>
            </div>
            <div className="bg-cyan-400 text-white flex flex-col justify-center items-center">
              <p className="text-xl">Draft</p>
              <p className="text-md">{data.summary.draft}</p>
            </div>
          </div>
        </div>
        <div className="">
          <h3 className="text-lg ">Reported Status</h3>
          <div className="grid grid-cols-3 border-2 p-2 rounded-lg">
            <div className="border-r-2">
              <p className="text-sm">Rescheduled</p>
              <p className="text-xl">{data.summary.rescheduled}</p>
            </div>
            <div className="border-r-2 px-2 ">
              <p className="text-sm">Skipped</p>
              <p className="text-xl">{data.summary.skipped}</p>
            </div>
            <div className="px-2">
              <p className="text-sm">Submitted</p>
              <p className="text-xl">{data.summary.submitted}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 ">
        <h3 className="text-lg font-bold mb-16">BACKLOGS</h3>
        <ul className="bg-gray-100 p-2 rounded-lg">
          {data.backlogs.map((backlog, index) => (
            <li key={index} className="grid grid-cols-3 py-2 border-b">
              <span className="">{backlog.name}</span>
              <span>{backlog.location}</span>
              <span>{backlog.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
