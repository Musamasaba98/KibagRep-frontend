import IndicatorCards from "../components/IndicatorCards";
import RecentReports from "../components/RecentReports";
import Supervisors from "../components/Supervisors";
import VisitsTrendCont from "../components/VisitsTrendCont";

const Dashboard = () => {
  return (
    <div className="w-full p-6 space-y-6">
      <div>
        <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Manager Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Team performance overview and pending approvals</p>
      </div>
      <IndicatorCards />
      <VisitsTrendCont />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Supervisors />
        <RecentReports />
      </div>
    </div>
  );
};

export default Dashboard;
