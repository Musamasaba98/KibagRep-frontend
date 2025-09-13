import { recent_reports } from "../../../data"


const RecentReports = () => {
  return (
     <div className="w-full mt-10 flex gap-5">
    
    {/* THE CONTAINER TO SHOW RECENT REPORTS */}
    <div className="w-full p-4 rounded-md shadow-md bg-white h-full">
    {/* header */}
    <div className="w-full flex items-center justify-between">
    <h1 className="font-semibold text-lg">Recent reports</h1>
    <p className="text-md cursor-pointer text-blue-500">view all</p>
    </div>
    {/* headings */}
    <div className="rounded-lg">
    <div className="w-full p-2 mt-2 bg-gray-200 py-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr]">
    <p className="">Report title</p>
    <p className="">Name</p>
    <p className="">Date</p>
    <p className="">Status</p>
    <p className="">More</p>
    </div>
    <hr />
   
    {/* the actual data */}
    <div className="">
    {recent_reports.map((item,index)=>{
        return(
            <div key={index} className="grid py-4 grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <p className="text-sm">{item.reportTitle}</p>
            <p className="text-sm">{item.repName}</p>
            <p className="text-sm">{item.date}</p>
            <p className="text-sm">{item.status}</p>
            <button className="mr-8 text-white rounded-md text-sm w-[60px] bg-blue-500">view</button>
            </div>
        )
    })}
    </div>
     </div>

    </div>

     </div>
  )
}

export default RecentReports;
