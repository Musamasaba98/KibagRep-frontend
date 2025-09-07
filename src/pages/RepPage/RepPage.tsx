import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ActivityCards from './components/ActivityCards';
import DetailingPerformance from './components/DetailingPerformance';
import MenuPopup from "../../componets/MenuPopup/MenuPopup";
import { useSelector } from 'react-redux';
import AddUnplanned from '../../componets/AddUnplanned/AddUnplanned';


const RepPage = () => {

    const showMenu:boolean = useSelector((state:any)=>state.uiState.showMenu);

  return (
    <>
    <MenuPopup showMenu={showMenu}/>
    <AddUnplanned/>
    <div className='w-full'>
    <Navbar/>
    {/* the page contents */}
    <div className="w-full flex">
    <Sidebar/>
    <div className="w-full ml-[380px] p-7">
    <ActivityCards/>
    <DetailingPerformance/>
    </div>
    </div>
    </div>
    </>
  )
}

export default RepPage;
