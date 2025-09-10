import { BiBarChart, BiSolidDashboard,BiWorld } from "react-icons/bi";
import { FaCommentDots } from "react-icons/fa";
import { FaBell, FaCalendar, FaChartBar, FaLocationDot } from "react-icons/fa6";
import FeatureCard from "./FeatureCard";


const Features = () => {
  return (
    <div className="w-full bg-white py-4">
    <div className="w-[90%] 2xl:w-[70%] mx-auto py-6">
    <h1 className="font-black text-3xl text-center">Powerful features built for Africa's healthcare market</h1>
    </div>
    {/* the feature cards container*/}
    <div className="w-[90%] 2xl:w-[70%] mx-auto flex justify-center gap-7  pt-8 flex-wrap">

    <FeatureCard
    title="Admin dashboard"
    major_icon={<BiSolidDashboard className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Task Management","Performance Insights","Team Oversight"]}
    description="Manage tasks, monitor field reps, and analyze performance effortlessly with a powerful admin dashboard"
    />

     <FeatureCard
    title="Manager dashboard"
    major_icon={<BiBarChart className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Team Monitoring","Performance Reports","Task Coordination"]}
    description="Get a complete view of your team’s activities, track progress, and make informed decisions—all from one central dashboard"
    />

     <FeatureCard
    title="Real-time alerts"
    major_icon={<FaBell className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Instant Notifications","Custom Alerts","Actionable Insights"]}
    description="Stay informed the moment something important happens—receive instant alerts for tasks, visits, or team updates."
    />

    <FeatureCard
    title="Rep tracking"
    major_icon={<FaLocationDot className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Live Location Tracking","Visit History","Performance Monitoring"]}
    description="Monitor your field reps in real-time—track visits, locations, and performance effortlessly, anytime, anywhere"
    />

     <FeatureCard
    title="Real-time messaging"
    major_icon={<FaCommentDots className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Task Management","Performance Insights","Team Oversight"]}
    description="Connect instantly with your team—send messages, share updates, and stay coordinated in real-time"
    />

    <FeatureCard
    title="Offline mode"
    major_icon={<BiWorld className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Offline Access","Automatic Sync","Reliable Operation"]}
    description="Work seamlessly even without internet—access tasks, update data, and track progress effortlessly. Everything syncs automatically once online"
    />

    <FeatureCard
    title="Automated analytics"
    major_icon={<FaChartBar className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Instant Reports","Data Trends","Informed Decisions"]}
    description="Get instant insights into your team’s performance—track trends, monitor results, and make informed decisions effortlessly with automated analytics"
    />

    <FeatureCard
    title="Smart Planning"
    major_icon={<FaCalendar className="w-12 h-12 text-[#09be51]"/>}
    card_features={["Daily Planning","Monthly Overview","Task Prioritization"]}
    description="Organize your team’s work effortlessly—create daily and monthly plans, assign tasks, and stay on top of your operations without missing a beat"
    />


    </div>
    </div>
  )
}

export default Features;
