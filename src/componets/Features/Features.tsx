import { BiBarChart, BiSolidDashboard, BiWorld } from "react-icons/bi";
import { FaCommentDots } from "react-icons/fa";
import { FaBell, FaCalendar, FaChartBar, FaLocationDot } from "react-icons/fa6";
import FeatureCard from "./FeatureCard";

const FEATURES = [
  {
    title: "Admin Dashboard",
    icon: <BiSolidDashboard className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Task Assignment", "Performance Insights", "Team Oversight"],
    description:
      "Manage tasks, monitor field reps, and analyse performance from a single pane of glass — no spreadsheets needed.",
  },
  {
    title: "Manager Dashboard",
    icon: <BiBarChart className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Team Monitoring", "Performance Reports", "Task Coordination"],
    description:
      "Full visibility into your team's daily activities. Track call cycle adherence, spot underperformers, and act fast.",
  },
  {
    title: "Real-time Alerts",
    icon: <FaBell className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Instant Notifications", "Custom Alert Rules", "Actionable Flags"],
    description:
      "GPS anomalies, missed visits, NCA streaks — the system flags them the moment they happen. Not at month-end.",
  },
  {
    title: "Rep GPS Tracking",
    icon: <FaLocationDot className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Live Location Verify", "Visit Timestamps", "Route History"],
    description:
      "Every visit is GPS-stamped and cross-checked against the doctor's facility location. No more faked field visits.",
  },
  {
    title: "In-app Messaging",
    icon: <FaCommentDots className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Direct Rep Messaging", "Broadcast Announcements", "Campaign Briefs"],
    description:
      "Send campaign briefs, approve reports, and coordinate with reps without leaving the platform.",
  },
  {
    title: "Offline Mode",
    icon: <BiWorld className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Log Visits Offline", "Auto-sync on Reconnect", "3G Optimised"],
    description:
      "Built for Uganda's connectivity reality. Reps log visits on 2G or no signal — data syncs automatically when back online.",
  },
  {
    title: "Automated Analytics",
    icon: <FaChartBar className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Live KPI Dashboards", "Trend Detection", "Export-ready Reports"],
    description:
      "Your managers see visit trends, product detailing rates, and cycle coverage the moment they log in — zero manual reporting.",
  },
  {
    title: "Smart Call Cycles",
    icon: <FaCalendar className="w-6 h-6 text-[#16a34a]" />,
    card_features: ["Monthly Doctor Plans", "Supervisor Approval", "Tier A/B/C Routing"],
    description:
      "Reps plan their monthly doctor list, supervisors approve it. The system tracks adherence and flags deviations automatically.",
  },
];

const Features = () => {
  return (
    <section id="features" className="w-full bg-gray-50 py-20">
      <div className="w-[90%] 2xl:w-[70%] mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#16a34a] font-bold text-sm tracking-widest uppercase mb-3">
            Platform capabilities
          </p>
          <h2 className="font-black text-3xl md:text-4xl text-[#1a1a1a] tracking-tight leading-tight">
            Powerful features built for Africa's healthcare field teams
          </h2>
          <p className="text-gray-500 text-lg mt-4 leading-relaxed">
            Everything your reps, supervisors, and country managers need — in one platform that actually enforces accountability.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              title={f.title}
              major_icon={f.icon}
              card_features={f.card_features}
              description={f.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
