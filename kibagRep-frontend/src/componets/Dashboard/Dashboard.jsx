import { useContext } from "react";
import { AppContext } from "../../pages/context/AppContext";
import Bargraph from "../Bargraph/Bargraph";
import Dognutpie from "../Dognutpie/Dognutpie";
import { NavLink, Outlet } from "react-router-dom";

const Dashboard = () => {
  const activity = [
    {
      count: 55,
      title: "Schedule",
    },
    {
      count: "00",
      title: "PCP Done",
    },
    {
      count: "00",
      title: "Detailing",
    },
    {
      count: "00",
      title: "NCA",
      type: "NCA",
    },
  ];

  const { setShowNca } = useContext(AppContext);

  return (
    <div className="w-[100%] flex justify-center pt-5 flex-col gap-11  ">
      <div className="bg-slate-50 w-[93%] pb-7 rounded-sm mx-auto py-2">
        <div className="py-2 px-3  flex justify-between border-cyan-400">
          <h1 className="text-xl pl-2 pt-2 border-solid border-l-[5px] border-cyan-400 leading-none font-semibold">
            Todays call activity
          </h1>
          <div>
            <button className="text-white outline-none px-8 py-2 text-sm bg-[#5ac388] rounded-3xl">
              Sync
            </button>
          </div>
        </div>

        <div className="flex gap-7">
          {activity.map((item, index) => {
            return (
              <div
                onClick={() => {
                  item.type === "NCA" ? setShowNca(true) : "";
                }}
                className="bg-white w-[130px] h-[100px] rounded mt-2 border-b-4 border-[#f87c86]"
                key={index}
              >
                <div className="flex flex-col justify-center ">
                  <h2 className="text-center font-bold text-6xl text-[#454545]">
                    {item.count}
                  </h2>
                  <p className="text-[18px] font-light font-[Arial] text-[#454545] text-center pt-[4px]">
                    {item.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <div className="bg-slate-50 w-[93%] pb-7 rounded-sm mx-auto py-2">
        <div className="py-2 px-3 flex justify-between ">
          <div className="border-solid border-l-[5px] border-cyan-400">
            <h1 className="pl-2 text-xl leading-none font-semibold">Sync</h1>
          </div>

          <div>
            <button className="text-white outline-none px-8 py-2 text-sm bg-[#5ac388] rounded-3xl">
              Sync
            </button>
          </div>
        </div>

        <div className="flex gap-7">
          {activity.map((item, index) => {
            return (
              <div
                className="bg-white w-[130px] h-[100px] rounded mt-2"
                key={index}
              >
                <h2 className="text-center font-light text-3xl text-[#454545]">
                  {item.count}
                </h2>

                <div>
                  <p className="text-[18px] font-[Arial] text-[#454545] text-center pt-[30px]">
                    {item.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}

      <div className="bg-slate-50 w-[93%] h-[300px] pb-7 rounded-sm mx-auto py-2">
        <div className="py-2 px-3 flex justify-between border-solid border-l-[5px] border-cyan-400">
          <h1 className="pl-2 text-xl leading-none font-semibold">
            Detailing Performance
          </h1>
        </div>

        <div className="grid grid-cols-2 mx-4">
          <div className="bg-white  pt-3 h-[220px] rounded mt-2 mx-4">
            <Dognutpie />
          </div>
          <div className="bg-white  pt-3 h-[220px] rounded mt-2 mx-4">
            <Bargraph />
          </div>
        </div>
      </div>
      <div className="w-[93%] mx-auto">
        <ul>
          <li className="inline-block px-4 text-xl leading-none font-semibold">
            <NavLink
              to="/dashboard/activity"
              className={({ isActive }) =>
                isActive
                  ? "border-solid border-l-[5px] border-cyan-400"
                  : undefined
              }
              end
            >
              Activity
            </NavLink>
          </li>
          <li className="inline-block px-4 text-xl leading-none font-semibold">
            <NavLink
              to="/dashboard/revenue"
              className={({ isActive }) =>
                isActive
                  ? "border-solid border-l-[5px] border-cyan-400"
                  : undefined
              }
            >
              Revenue
            </NavLink>
          </li>
          <li className="inline-block px-4 text-xl leading-none font-semibold">
            <NavLink
              to="/dashboard/performance"
              className={({ isActive }) =>
                isActive
                  ? "border-solid border-l-[5px] border-cyan-400"
                  : undefined
              }
            >
              Performance
            </NavLink>
          </li>
          <li className="inline-block px-4 text-xl leading-none font-semibold">
            <NavLink
              to="/dashboard/outsidesales"
              className={({ isActive }) =>
                isActive
                  ? "border-solid border-l-[5px] border-cyan-400"
                  : undefined
              }
            >
              Outside Sales
            </NavLink>
          </li>
        </ul>
        <div className="bg-slate-50 w-full pb-7 rounded-sm mx-auto py-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
