import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MenuPopup from "../../componets/MenuPopup/MenuPopup";
import { useSelector } from 'react-redux';
import AddUnplanned from '../../componets/AddUnplanned/AddUnplanned';
import { Outlet } from 'react-router-dom';


const RepPage = () => {

    const showMenu:boolean = useSelector((state:any)=>state.uiState.showMenu);

  return (
    <>
    <MenuPopup showMenu={showMenu}/>
    <AddUnplanned/>
    <div className='w-full bg-gray-100'>
    <Navbar/>
    {/* the page contents */}
    <div className="w-full flex">
    <Sidebar/>
    <div className="w-full ml-[380px] p-7">
    {/* all the  pages will be showed here */}
    <Outlet/>
    </div>
    </div>
    </div>
    </>
  )
}

export default RepPage;
