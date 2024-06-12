import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function DatePicker() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const startDate = startOfWeek(currentMonth);
  const endDate = endOfWeek(currentMonth);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };
  return (
    <div className="w-full  flex justify-around items-center gap-2 md:gap-4 xl:gap-8 py-1 bg-white">
      <div className="flex justify-between items-center  mb-0.5">
        <button onClick={handlePrevMonth} className="focus:outline-none">
          <FaChevronLeft />
        </button>
        <h2 className="text-lg px-2 font-semibold">
          {format(currentMonth, "MMMM")}
        </h2>
        <button onClick={handleNextMonth} className="focus:outline-none">
          <FaChevronRight />
        </button>
      </div>
      <div className="flex justify-between items-center">
        {days.map((day) => (
          <div
            key={day}
            className={` p-1 cursor-pointer rounded-full ${
              selectedDate &&
              format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => handleDateClick(day)}
          >
            {/* <div>{format(day, "E")}</div> */}
            <div className="text-md font-bold ">{format(day, "dd")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DatePicker;
