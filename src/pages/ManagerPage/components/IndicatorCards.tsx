import { useEffect, useState } from "react";
import { FaUserGroup } from "react-icons/fa6";
import { LuClipboardCheck, LuTrendingUp } from "react-icons/lu";
import { BsGraphUp } from "react-icons/bs";
import { getCompanyFeedApi, getPendingReportsApi } from "../../../services/api";

interface KpiCard {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  shadow: string;
}

const IndicatorCards = () => {
  const [feedCount, setFeedCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getCompanyFeedApi({ days: 1 }),
      getPendingReportsApi(),
    ]).then(([feedRes, reportsRes]) => {
      if (feedRes.status === "fulfilled") {
        const data = feedRes.value.data?.data;
        setFeedCount(Array.isArray(data) ? data.length : 0);
      }
      if (reportsRes.status === "fulfilled") {
        const data = reportsRes.value.data?.data;
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
      setLoading(false);
    });
  }, []);

  const cards: KpiCard[] = [
    {
      label: "Team Visits Today",
      value: loading ? "—" : feedCount ?? 0,
      sub: "GPS-verified across all reps",
      icon: LuTrendingUp,
      gradient: "from-[#16a34a] to-[#15803d]",
      shadow: "shadow-green-200",
    },
    {
      label: "Pending Reports",
      value: loading ? "—" : pendingCount ?? 0,
      sub: "Awaiting your approval",
      icon: LuClipboardCheck,
      gradient: pendingCount != null && pendingCount > 0
        ? "from-orange-500 to-red-500"
        : "from-gray-400 to-gray-500",
      shadow: pendingCount != null && pendingCount > 0
        ? "shadow-orange-100"
        : "shadow-gray-100",
    },
    {
      label: "Active Supervisors",
      value: "—",
      sub: "Reporting to you",
      icon: FaUserGroup,
      gradient: "from-violet-500 to-violet-600",
      shadow: "shadow-violet-100",
    },
    {
      label: "Cycle Adherence",
      value: "—",
      sub: "Team average this month",
      icon: BsGraphUp,
      gradient: "from-sky-500 to-sky-600",
      shadow: "shadow-sky-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.shadow} cursor-pointer hover:-translate-y-0.5`}
            style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10">
              {loading ? (
                <div className="w-7 h-7 rounded-full border-[3px] border-white/30 border-t-white animate-spin mb-3" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <p className="font-black text-white text-3xl leading-none">{card.value}</p>
              <p className="text-white/90 font-bold text-[13px] mt-2 leading-tight">{card.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IndicatorCards;
