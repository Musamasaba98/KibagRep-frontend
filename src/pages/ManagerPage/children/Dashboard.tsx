import IndicatorCards from "../components/IndicatorCards"
import RecentReports from "../components/RecentReports";
import Supervisors from "../components/Supervisors";


const Dashboard = () => {
  return (
    <div className="w-full p-6">
     <IndicatorCards/>
     <Supervisors/>
     <RecentReports/>
    </div>
  )
}

export default Dashboard;
