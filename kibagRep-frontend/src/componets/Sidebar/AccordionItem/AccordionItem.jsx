import { useState, useEffect } from "react";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import { FaPlus } from "react-icons/fa6";

export default function AccordionItem({ date, count, profiles }) {
  const [isActive, setIsActive] = useState(false);
  console.log(profiles);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      setIsActive(true);
    }
  }, [date]);

  return (
    <div>
      <div
        className={`flex justify-between p-3 text-white ${
          isActive ? "bg-[#45a172]" : "bg-[#5ac388]"
        } cursor-pointer`}
        onClick={() => setIsActive(!isActive)}
      >
        <div className="flex items-center gap-5">
          <p className="font-medium">{date}</p>
          <p className="text-sm text-gray-200">({count})</p>
        </div>
        <FaPlus
          className="text-lg"
          onClick={(e) => {
            e.stopPropagation();
            setIsActive(!isActive);
          }}
        />
      </div>

      {/* Content */}
      {isActive && (
        <div className="p-1 bg-gray-100 max-h-[60vh] overflow-y-auto duration-500">
          {profiles?.map((profile, index) => (
            <div
              key={index}
              className="mb-1 p-1 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <UserProfileCard profile={profile} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
