import CatchupCard from "./CatchupCard";
import TaskCard from "./TaskCard";

export default function Activity() {
  return (
    <div className="grid grid-cols-2 mx-2">
      <div className="border-solid border-r-[3px] border-black-900">
        <h3 className="pl-2">My Tasks</h3>
        <div className="pl-4">
          <TaskCard />
        </div>
      </div>
      <div>
        <h3 className="pl-2">Catching Up</h3>
        <div className="pl-4">
          <CatchupCard />
        </div>
      </div>
    </div>
  );
}
