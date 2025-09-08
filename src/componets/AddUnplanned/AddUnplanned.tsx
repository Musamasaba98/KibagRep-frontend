import {
  FaCheck,
  FaLocationDot,
  FaMagnifyingGlass,
  FaRegRectangleList,
  FaSquarePollVertical,
} from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toggleShowUnplanned } from "../../store/uiStateSlice";
import { useEffect, useState } from "react";

const AddUnplanned = () => {
  const { showUnplanned } = useSelector((state:any) => state.uiState);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showUnplanned) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [showUnplanned]);
  const dispatch = useDispatch();
  const todos = [
    {
      place: "Hp. Nakavule",
      type: "GENERAL, C",
      location: "IGANGA IGANGA",
      last_met: "28-05-2024",
    },
    {
      place: "Hp. Islamic",
      type: "GENERAL, C",
      location: "IGANGA IGANGA",
      last_met: "28-05-2024",
    },
    {
      place: "Hp. Islamic",
      type: "GENERAL, C",
      location: "IGANGA IGANGA",
      last_met: "28-05-2024",
    },
  ];

  return (
    <div
      className={`overflow-hidden w-full h-screen bg-[#100000a4] flex items-center fixed top-[0] z-[100] transition-opacity duration-300 ${
        showUnplanned || isAnimating
          ? "opacity-100 visible"
          : "opacity-0 invisible"
      }`}
    >
      <div
        className={`overflow-hidden w-[65%] 2xl:w-[50%] relative 2xl:h-[640px] h-[540px] bg-white mx-auto rounded-md  transition-transform delay duration-300 ease-in-out ${
          showUnplanned ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="full bg-[#19c464] onClick={()=>dispatch(toggleShowMenu())}]">
          <h2 className="py-3 px-4 font-bold text-white text-xl">
            Add Unplanned
          </h2>
        </div>

        <div className="full pt-6 px-4">
          <div className="flex gap-5">
            <input
              type="date"
              className="text-[#454545] w-56 border-solid border-b-[2px] border-[#454545] outline-0 text-md font-semibold"
            />

            <p className="font-semibold text-[#454545]">
              Wilson Street - 33, William Street - 20, William Street - 2
            </p>
          </div>

          <div className="flex justify-between mt-7">
            <select
              name="patch"
              className="text-[#454545] font-semibold w-56 outline-none border-solid border-b-[2px] border-[#454545]"
            >
              <option value="Select patch">Select patch</option>
            </select>

            <div className="rounded-md h-[41px] w-[50%] bg-[#efefef] flex items-center">
              <input
                type="text"
                placeholder="type your search term..."
                className="w-[92%] text-md bg-transparent outline-0 px-4 "
              />
              <FaMagnifyingGlass fill="#454545" />
            </div>
          </div>

          {/* This is the beginning of the customer list header */}
          <div className="flex justify-between pt-6">
            <h2 className="font-bold text-xl">Customer List</h2>

            <div className="flex gap-11">
              <div className="flex gap-2 items-center">
                <FaCheck className="w-6 h-6 ms-1.3" />
                <p className="text-xl font-semibold">0</p>
              </div>

              <div className="flex gap-2 items-center">
                <FaSquarePollVertical className="w-5 h-5 ms-1.5" />
                <p className="text-xl font-semibold">244</p>
              </div>

              <div className="flex gap-2 items-center">
                <FaRegRectangleList className="w-6 h-6 ms-1.5" />
                <p className="text-xl font-semibold">553</p>
              </div>
            </div>
          </div>

          {/* End of customer list header */}

          {/* This the beginning of the customer list */}

          <div className="w-full pt-4">
            {todos.map((item, index) => {
              return (
                <div
                  className="w-[100%] border-solid border-[1px] p-2 mt-3 border-[#cacaca] mx-auto flex justify-between"
                  key={index}
                >
                  <div>
                    <h2>{item.place}</h2>
                    <h2>{item.type}</h2>

                    <div className="flex gap-5">
                      <h2 className="font-semibold text-md flex gap-1 items-center">
                        <FaLocationDot />
                        {item.location}
                      </h2>

                      <h2 className="flex items-center gap-2">
                        <FaCalendarAlt /> M T W T F S S
                      </h2>
                    </div>

                    {/* Below is the beginning of another div*/}
                  </div>

                  <div>
                    <h2 className="font-bold">Last Met : {item.last_met}</h2>
                    <input type="checkbox" name="" id="" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="font-[Arial] items-center flex justify-center gap-24 absolute bottom-[0] w-full bg-[#808080] h-[50px]">
          <h2
            onClick={() => dispatch(toggleShowUnplanned())}
            className="text-white font-bold text-lg cursor-pointer"
          >
            CANCEL
          </h2>

          <h2 className="text-white font-bold text-lg cursor-pointer">
            ADD TO LIST
          </h2>

          <h2 className="text-white font-bold text-lg cursor-pointer">
            REPORT
          </h2>
        </div>
      </div>
    </div>
  );
};

export default AddUnplanned;
