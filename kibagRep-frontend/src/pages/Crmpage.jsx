import { FaPlus } from "react-icons/fa6";
import DatePicker from "../componets/DatePicker";
import SearchBar from "../componets/SearchBar";

const CRMPage = () => {
  const data = {
    user: "Dr. Beninah",
    role: "Dispenser",
    dates: [
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      { date: "31-May Friday", count: 55 },
      { date: "30-May Thursday", count: 14 },
      { date: "29-May Wednesday", count: 100 },
      // Add more dates as required
    ],
    backlogs: [
      { name: "Dr. ALEX KUMBURA", location: "KIBUYE", status: "Missed" },
      { name: "Dr. ALES", location: "KIBUYE", status: "Missed" },
      // Add more backlogs as required
    ],
    summary: {
      missed: 292,
      draft: 0,
      rescheduled: 0,
      skipped: 0,
      submitted: 1285,
    },
  };

  return (
    <div className="min-h-screen  bg-gray-50">
      <div className="bg-white flex justify-start  shadow rounded-lg ">
        <div className="w-1/2">
          <div>
            <SearchBar />
          </div>
          <div>
            <DatePicker />
          </div>
          <div className=" w-full">
            <div className=" grid gap-0.5 ">
              {data.dates.map((date, index) => (
                <div
                  key={index}
                  className="flex justify-between p-2 bg-cyan-400 text-white  text-center"
                >
                  <div className="flex justify-between gap-5">
                    <p>{date.date}</p>
                    <p>({date.count})</p>
                  </div>
                  <div>
                    <FaPlus />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full mx-10 mt-24">
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
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
