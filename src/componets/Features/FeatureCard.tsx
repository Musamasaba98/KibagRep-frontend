import { BiCheck } from "react-icons/bi";

interface CardProps {
  major_icon: React.ReactNode;
  title: string;
  description: string;
  card_features: string[];
}

const FeatureCard = ({ major_icon, title, description, card_features }: CardProps) => {
  return (
    <div
      className="flex flex-col bg-white rounded-2xl p-6 cursor-pointer border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_0_rgba(22,163,74,0.12)] hover:-translate-y-1"
      style={{ transition: "box-shadow 0.25s ease, transform 0.25s ease" }}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center mb-4 shrink-0">
        {major_icon}
      </div>

      {/* Title */}
      <h3 className="font-bold text-[#1a1a1a] text-[17px] leading-tight mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{description}</p>

      {/* Feature tags */}
      <div className="flex flex-col gap-2.5 mt-auto">
        {card_features.map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
              <BiCheck className="text-[#16a34a] w-3.5 h-3.5" />
            </div>
            <p className="text-sm text-gray-600 font-medium">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCard;
