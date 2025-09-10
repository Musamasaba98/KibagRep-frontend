import { BiCheck } from "react-icons/bi"

interface CardProps {
    major_icon:any,
    title:string
    description:string,
    card_features:string[]
}

const FeatureCard = (props:CardProps) => {
  return (
     <div className="w-[280px] mt-7 bg-white hover:transform duration-500 min-h-[270px] rounded-md cursor-pointer p-4 shadow-lg">
        <div className="w-full flex">
        <div>
        {props.major_icon}
        <h1 className="font-bold text-lg">{props.title}</h1>
        </div>
        </div>
         {/* description */}
        <p className="text-[#454545] text-sm">{props.description}</p>
        {/* features */}
        <div className="py-2 flex flex-col gap-4">

        {props.card_features.map((item,index)=>{
        return(
        <div key={index} className="flex items-center gap-3">
        <div className="bg-[#09be51] p-0.5 rounded-full">
        <BiCheck className="text-white"/>
        </div>
        <p className="">{item}</p>
        </div>
            )
        })}
    
        </div>
        </div>
  )
}

export default FeatureCard
