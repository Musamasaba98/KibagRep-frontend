// import { useContext } from "react";
import SearchBar from "../SearchBar/SearchBar";
// import { AppContext } from "../../pages/context/AppContext";
// import { TbRubberStamp } from "react-icons/tb";
import { FaList } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { toggleShowMenu } from "../../store/uiStateSlice";

const Navbar = () => {
  // const { setShowMenu } = useContext(AppContext);
  const dispatch = useDispatch();
  return (
    <div className="flex items-center justify-between  h-[60px] sticky top-[0] bg-white shadow-sm ">
      <SearchBar />

      <div className="pr-9 flex items-center gap-7">
        <FaList
          fill="#5ac388"
          className="w-6 h-6 ms-1.2 cursor-pointer"
          onClick={() => dispatch(toggleShowMenu())}
        />
      </div>
    </div>
  );
};

export default Navbar;
