import React from "react";
import { useContext } from "react";
import { AppContext } from "../../pages/context/AppContext";
import { FaPlus } from "react-icons/fa6";

const Sidebar = () => {
  const { data } = useContext(AppContext);

  return (
    <div>
      <div className=" w-full">
        <div className=" grid gap-0.5 ">
          {data.dates.map((date, index) => (
            <div
              key={index}
              className="flex justify-between p-2 bg-[#5ac388]  text-white  text-center "
            >
              <div className="flex justify-between gap-5">
                <p>{date.date}</p>
                <p>({date.count})</p>
              </div>
              <div>
                <FaPlus onClick={() => alert("Hello")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
