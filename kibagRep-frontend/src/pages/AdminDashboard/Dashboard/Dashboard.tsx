import TopSelling from "../../TopSelling/TopSelling";
import PerformActivity from "../PerformActivity/PerformActivity";
import TopBox from "../TopBox/TopBox";


const Dashboard = () => {
  return (
    <div className='w-full'>
      <TopBox/>
      <PerformActivity/>
      <TopSelling/>
    </div>
  )
}

export default Dashboard;
