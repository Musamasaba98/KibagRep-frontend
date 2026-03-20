import TopSelling from "../../TopSelling/TopSelling";
import DetailingCont from "../DetailingCont/DetailingCont";
import PerformActivity from "../PerformActivity/PerformActivity";
import TopCards from "../TopCards/TopCards";

const Dashboard = () => {
  return (
    <div className='w-full'>
       <TopCards/>
      <DetailingCont/>
      <PerformActivity/>
      <TopSelling/>
    </div>
  )
}

export default Dashboard;
