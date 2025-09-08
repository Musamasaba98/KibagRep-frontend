import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function DatePicker() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const startDate = startOfWeek(currentMonth);
  const endDate = endOfWeek(currentMonth);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date:any) => {
    setSelectedDate(date);
  };

  return (
    <div className="w-full flex gap-2 items-center py-4 bg-white">
      <div className="flex justify-between items-center mb-0.5">
        <button onClick={handlePrevMonth} className="focus:outline-none">
          <FaChevronLeft />
        </button>
        <h2 className="lg:text-sm lg:px-1 font-semibold">
          {format(currentMonth, "MMM")}
        </h2>
        <button onClick={handleNextMonth} className="focus:outline-none">
          <FaChevronRight />
        </button>
      </div>
      <div className="flex justify-between items-center">
        {days.map((day:any) => (
          <div
            key={day}
            className={`p-[0.3px] cursor-pointer rounded-full ${
              isSameDay(day, selectedDate)
                ? "bg-[#f84c5a] text-white font-bold"

                : "bg-white text-gray-700"
            }`}
            onClick={() => handleDateClick(day)}
          >
            <div className="lg:text-sm  lg:px-[4px]">{format(day, "dd")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DatePicker;
