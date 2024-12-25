import { useContext } from "react";
import { AppContext } from "../../pages/context/AppContext";
import AccordionItem from "./AccordionItem/AccordionItem";

const Sidebar = () => {
  const { data } = useContext(AppContext);
  console.log(data);
  return (
    <div>
      <div className=" w-full max-h-[70vh] overflow-y-auto bg-gray-100">
        <div className=" grid gap-0.5 ">
          {data.dates.map((date, index) => (
            <AccordionItem
              key={index}
              date={date.date}
              count={date.count}
              profiles={date.profiles || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
