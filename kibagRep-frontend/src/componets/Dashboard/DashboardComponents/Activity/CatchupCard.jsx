import { FaRegFlag } from "react-icons/fa6";
export default function CatchupCard() {
  return (
    <div className="flex mx-2 xl:mx-4">
      <div className="flex items-center gap-2">
        <FaRegFlag />
        <div>
          <p className="text-xs">
            This Open lead has had no activity for 30 days
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold text-blue-900">NAME</span>
              <span className="text-sm">Rubaga Hospital</span>
            </div>
            <p className="text-xs">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
