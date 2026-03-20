import { startOfMonth,endOfMonth,startOfWeek,addDays,format, endOfWeek } from "date-fns";


export const generateCalendarDays = (currentDate)=>{

    //Find the start and end of the visible calendar grid
    const startDate = startOfWeek(startOfMonth(currentDate),{weekStartsOn:0});
    const endDate = endOfWeek(endOfMonth(currentDate),{weekStartsOn:0});

    const days= [];

    let day=startDate;

    //generate all days from start to end
    while (day <= endDate){
        days.push(day);
        day=addDays(day,1);
    }

    return days;
}