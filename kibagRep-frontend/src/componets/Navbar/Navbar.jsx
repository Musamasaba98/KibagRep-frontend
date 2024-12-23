import { useContext } from 'react'
import SearchBar from '../SearchBar/SearchBar';
import { AppContext } from '../../pages/context/AppContext';
import { TbRubberStamp } from 'react-icons/tb';
import { FaList } from 'react-icons/fa';


const Navbar = () => {

  const {setShowMenu}=useContext(AppContext);

  return (
    <div className='flex items-center px-2 w-full h-[60px] sticky top-[0] bg-white shadow-sm justify-between'>
      
      <SearchBar/>

      <div className="pr-9 flex items-center gap-7">
       
        <FaList fill="#5ac388" className='w-7 h-7 ms-1.2' onClick={()=>setShowMenu(TbRubberStamp)}/>
       

      </div>

    </div>
  );
}

export default Navbar;
