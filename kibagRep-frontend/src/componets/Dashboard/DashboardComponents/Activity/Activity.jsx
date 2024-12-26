import CatchupCard from "./CatchupCard";
import TaskCard from "./TaskCard";

export default function Activity() {
  return (
    <div className="grid grid-cols-2 mx-2">
      <div className="border-solid border-r-[3px] border-black-900">
        <h3 className="pl-2">My Tasks</h3>
        <div className="pl-4">
          <TaskCard />
          <TaskCard />
          <TaskCard />
        </div>
      </div>
      <div className="w-full">
        <h3 className="pl-2">Catching Up</h3>
        <div className="pl-4 mx-auto">
          <CatchupCard />
          <CatchupCard />
          <CatchupCard />
        </div>
      </div>
    </div>
  );
}
