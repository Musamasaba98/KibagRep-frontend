import Bargraph from "../../../componets/Bargraph/Bargraph";
import Dognutpie from "../../../componets/Dognutpie/Dognutpie";


const DetailingPerformance = () => {
  return (
    <div className="w-full mt-7">
    <div className="py-3">
    <h1 className="font-bold text-xl">Detailing performance</h1>
    </div>
    {/* the graphs */}
    <div className="w-full flex gap-11">
    <div className="w-[50%] flex shadow items-center py-5 rounded-md bg-white h-[250px]">
    <Dognutpie/>
    </div>

    <div className="w-[50%] flex shadow items-center py-5 rounded-md bg-white h-[250px]">
    <Bargraph/>
    </div>
    </div>
    </div>
  )
}

export default DetailingPerformance;
