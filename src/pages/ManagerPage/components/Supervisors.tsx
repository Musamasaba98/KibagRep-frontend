import { BiSearch } from "react-icons/bi";

const supervisorsData = [
  { name: "John Doe", teamSize: 5, performance: 80, lastReport: "2 days ago" },
  { name: "Jane Smith", teamSize: 7, performance: 92, lastReport: "1 day ago" },
  { name: "Michael Johnson", teamSize: 4, performance: 65, lastReport: "3 days ago" },
  { name: "Emily Davis", teamSize: 6, performance: 75, lastReport: "Today" },
];

const Supervisors = () => {
  return (
    <div className="w-full bg-white h-[400px] mt-7 rounded-md shadow-md p-4 overflow-y-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="font-bold text-xl">Supervisors</h1>
          <p className="text-sm text-[#454545] leading-none">{supervisorsData.length} supervisors</p>
        </div>

        <div className="flex items-center px-3 py-2 rounded-md bg-[#efefef] gap-2">
          <input
            type="text"
            className="outline-none px-2 bg-transparent w-[90%]"
            placeholder="Find supervisors"
          />
          <BiSearch className="w-5 h-5 text-[#454545]" />
        </div>
      </div>

      <hr className="mt-3" />

      {/* Supervisors List */}
      <div className="mt-4 space-y-3">
        {supervisorsData.map((sup, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100"
          >
            <div>
              <h2 className="font-semibold">{sup.name}</h2>
              <p className="text-sm text-gray-500">
                Team: {sup.teamSize} | Last Report: {sup.lastReport}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${
                    sup.performance > 85
                      ? "bg-green-500"
                      : sup.performance > 70
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${sup.performance}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{sup.performance}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Supervisors;
