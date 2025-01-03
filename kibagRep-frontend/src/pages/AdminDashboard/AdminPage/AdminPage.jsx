
import DetailingCont from "../DetailingCont/DetailingCont";
import PerformActivity from "../PerformActivity/PerformActivity";
import TopCards from "../TopCards/TopCards";


const AdminPage = () => {


  return (
    <div className="w-[78%] 2xl:w-[85%] ml-[22%] v">
      <TopCards/>
      <DetailingCont/>
      <PerformActivity/>
    </div>
  )
}

export default AdminPage;
