import CatchupCard from "./CatchupCard";
import EventsCard from "./EventsCard";
import TaskCard from "./TaskCard";

export default function Activity() {
  return (
    <div className="grid grid-cols-3 mx-2">
      <div className="border-solid border-r-[3px] border-black-900">
        <TaskCard />
      </div>
      <div className="border-solid border-r-[3px] border-black-900">
        <CatchupCard />
      </div>
      <div>
        <EventsCard />
      </div>
    </div>
  );
}
