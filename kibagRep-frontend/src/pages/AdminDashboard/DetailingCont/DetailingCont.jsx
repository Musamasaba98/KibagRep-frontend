import Bargraph from "../../../componets/Bargraph/Bargraph";
import Dognutpie from "../../../componets/Dognutpie/Dognutpie";


const DetailingCont = () => {
  return (
    <div className='w-full flex px-8 gap-11 mt-8'>

        {/* This is the detailing performane container */}
        <div className="w-[50%] bg-white h-[400px] rounded-md">

        <h2 className='font-bold text-[21px] py-2 px-3'>Total detailing performance</h2>

        <div className="w-full h-[90%]">
        <Dognutpie/>
        </div>

        </div>

        {/* This is the brand exposure container */}
        <div className="w-[50%] bg-white h-[400px] rounded-md">

        <h2 className='font-bold text-[21px] py-2 px-3'>Total brand exposure performance</h2>

        <div className="w-full h-[90%]">
        <Bargraph/>
        </div>

        </div>
      
    </div>
  )
}

export default DetailingCont;
