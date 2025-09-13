import { BiDotsVerticalRounded, BiSearch } from "react-icons/bi";
import { conversations, dummyMessages } from "../../../data"
import { icons } from "../../../assets/assets";
import { GoPaperclip } from "react-icons/go";
import { CiFaceSmile } from "react-icons/ci";
import { FaRegPaperPlane, FaUser } from "react-icons/fa6";
import { IoPaperPlaneOutline } from "react-icons/io5";

const Messaging = () => {
  return (
    <div className="w-full flex h-[calc(100vh-60px)]">
    {/* chats container */}
    <div className="w-[350px] p-5 h-[calc(100vh-60px)] border-solid border-r-[1px] border-gray-200 bg-white">
    <div className="w-full">
    <div className="flex px-2 rounded-md items-center gap-2 h-[37px] bg-[#efefef] w-full">
    <input type="text" className="w-[90%] outline-none bg-transparent" placeholder="search conversations..."/>
    <BiSearch className="w-5 h-4 text-[#454545]"/>
    </div>
    </div>
    {/* the conversations heading */}
    <div className="w-full mt-5">
    <h2 className="font-semibold text-lg text-[#222f36]">All conversations</h2>
    </div>
    <hr className="mt-2"/>
    {/* conversations container */}
    <div className="w-full flex flex-col gap-7 py-5">
    {conversations.map((item,index)=>{
    return(
    <div key={index} className="w-full flex justify-between cursor-pointer">
    <div className="flex gap-2">
    <div className="flex-shrink-0">
    <img src={item.avatar} className="w-[40px] h-[40px] rounded-full object-cover"/>
    </div>
    <div className="">
    <h2 className="font-semibold text-md text-[#222f36]">{item.name}</h2>
    <p className="text-sm text-[#222f36] leading-none">{item.lastMessage.slice(0,22)}...</p>
    </div>
    </div>
    <p className="text-sm text-[#222f36]">{item.time}</p>
    </div>
     )
    })}
    </div>

    {/* the new conversation creation button */}
    <div>

    </div>

    </div>
    {/* THIS IS THE CHAT AREA */}
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] bg-white">
    {/* the header */}
    <div className="w-full px-4 flex items-center justify-between h-[55px] bg-white border-solid border-b-[1px] border-gray-200">
    <div className="flex gap-2">
    <div>
    <img src={icons.member_4} className="w-10 h-10 rounded-full object-cover"/>
    </div>
    <div className="">
    <h2 className="font-semibold text-[#222f36]">Twesigye Fahad</h2>
    <p className="text-sm leading-none text-[#20f120]">online</p>
    </div>
    </div>

    <div className="">
    <div className="p-1 cursor-pointer rounded-full bg-[#efefef]">
    <BiDotsVerticalRounded className="w-7 h-7 text-[#222f36]"/>
    </div>
    </div>
    </div>
    {/* THE MESSAGES CONTAINER */}
    <div className="flex-1 p-7 flex flex-col gap-6 overflow-y-auto">
    {dummyMessages.map((item,index)=>{
        if(item.user === "You"){
        return(
            <div key={index} className="flex w-full justify-end">
            <div className="max-w-[45%]">
            <div className="flex gap-4">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500">
            <FaUser className="w-4 h-4 text-white"/>
            </div>
            <div className="p-2 bg-green-500 rounded-xl">
            <p className="text-sm text-white">{item.message}</p>
            </div>
            </div>
            <p className="text-xs w-full flex justify-end pt-2 text-[#222f36]">{item.timestamp}</p>
            </div>
            </div>  
        )
    }else{
       return(
            <div key={index} className="flex w-full justify-start">
            <div className="max-w-[45%]">
            <div className="flex gap-4">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500">
            <FaUser className="w-4 h-4 text-white"/>
            </div>
            <div className="p-2 bg-gray-200 rounded-xl">
            <p className="text-sm">{item.message}</p>
            </div>
            </div>
            <p className="text-xs w-full flex justify-end pt-2 text-[#222f36]">{item.timestamp}</p>
            </div>
            </div> 
        ) 
    }
    })}
    </div>
    {/* END OF THE MESSAGES CONTAINER*/}

    {/* the bottom message input container */}
    <div className="w-full flex gap-11 items-center px-5 h-[55px] bg-white border-solid border-t-[1px] border-gray-200">
    {/*the left icons*/}
    <div className="flex gap-4 items-center">
    <CiFaceSmile className="w-6 h-6 cursor-pointer text-[#454545]"/>
    <GoPaperclip className="w-6 h-6 text-[#454545] cursor-pointer"/>
    </div>

    {/* the message input container */}
    <div className="flex flex-1 items-center">
    <input type="text" className="w-full outline-none" placeholder="type your message here..."/>
    </div>

    <IoPaperPlaneOutline className="w-7 h-7 cursor-pointer text-[#454545]"/>
    </div>
    </div>
    </div>
  )
}

export default Messaging
