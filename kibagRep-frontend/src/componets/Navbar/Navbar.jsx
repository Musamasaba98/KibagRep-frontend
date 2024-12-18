import React, { useContext } from 'react'
import SearchBar from '../SearchBar/SearchBar';
import { FaPowerOff} from 'react-icons/fa6';
import { AppContext } from '../../pages/context/AppContext';
import { TbRubberStamp } from 'react-icons/tb';


const Navbar = () => {

  const {setShowMenu}=useContext(AppContext);

  return (
    <div className='flex items-center px-2 w-full h-[60px] sticky top-[0] bg-white shadow-sm justify-between'>
      
      <SearchBar/>

      <div className="pr-9 flex items-center gap-7">
       
        <FaPowerOff fill="#22d3ee" className='w-5 h-5 ms-1.2' onClick={()=>setShowMenu(TbRubberStamp)}/>
       

      </div>

    </div>
  );
}

export default Navbar;
