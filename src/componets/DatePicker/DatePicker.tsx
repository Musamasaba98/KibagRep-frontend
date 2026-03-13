import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const WEEK_START = { weekStartsOn: 1 as const };

function DatePicker() {
  const [anchorDate,   setAnchorDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(anchorDate, WEEK_START);
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(anchorDate, WEEK_START) });
  const isCurrentWeek = isSameDay(startOfWeek(new Date(), WEEK_START), weekStart);

  return (
    <div className="px-3 py-2 bg-pink-50 select-none">
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => setAnchorDate(subWeeks(anchorDate, 1))}
          className="w-5 h-5 flex items-center justify-center rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-100 shrink-0 focus-visible:outline-none"
        >
          <FaChevronLeft className="w-2 h-2" />
        </button>

        {/* Days */}
        <div className="flex flex-1 justify-between">
          {days.map((day) => {
            const todayDay  = isToday(day);
            const selected  = isSameDay(day, selectedDate);
            const past      = isBefore(startOfDay(day), startOfDay(new Date())) && !todayDay;
            const active    = todayDay || selected;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center gap-0.5 focus-visible:outline-none"
              >
                <span className={`text-[8px] font-bold leading-none uppercase tracking-widest
                  ${active ? "text-blue-600" : past ? "text-pink-200" : "text-pink-400"}`}>
                  {format(day, "EEE")[0]}
                </span>
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black leading-none
                    ${active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-700/30"
                      : past
                      ? "text-pink-300 hover:bg-pink-100"
                      : "text-pink-500 hover:bg-pink-100"
                    }`}
                >
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => setAnchorDate(addWeeks(anchorDate, 1))}
          className="w-5 h-5 flex items-center justify-center rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-100 shrink-0 focus-visible:outline-none"
        >
          <FaChevronRight className="w-2 h-2" />
        </button>

        {/* Now pill — only when viewing a different week */}
        {!isCurrentWeek && (
          <button
            onClick={() => { setAnchorDate(new Date()); setSelectedDate(new Date()); }}
            className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0 focus-visible:outline-none hover:bg-blue-700"
          >
            Now
          </button>
        )}
      </div>
    </div>
  );
}

export default DatePicker;
