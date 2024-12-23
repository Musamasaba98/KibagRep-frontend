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

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="w-full flex justify-around items-center py-4 bg-white">
      <div className="flex justify-between items-center mb-0.5">
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
            className={`p-1 cursor-pointer rounded-full ${
              isSameDay(day, selectedDate)
                ? "bg-[#f87c86] text-white font-bold"
                : "bg-white text-gray-700"
            }`}
            onClick={() => handleDateClick(day)}
          >
            <div className="text-xl  mx-1">{format(day, "dd")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DatePicker;
