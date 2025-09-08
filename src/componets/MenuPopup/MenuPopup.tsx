import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { toggleShowMenu, toggleShowUnplanned } from "../../store/uiStateSlice";
// import { AppContext } from '../../pages/context/AppContext';

// eslint-disable-next-line react/prop-types
const MenuPopup = ({ showMenu }:{showMenu:boolean}) => {
  const dispatch = useDispatch();
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    if (showMenu) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showMenu]);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-screen bg-[#100000a4] z-[500] transition-opacity duration-300 ${
        showMenu || isAnimating ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className={`fixed top-0 right-0 w-[340px] h-screen bg-white transition-transform delay duration-300 ease-in-out ${
          showMenu ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full flex cursor-pointer items-center justify-between px-4 h-[55px] bg-[#19c464]">
          <h1 className="text-white font-bold text-xl">Menu</h1>

          <FaXmark
            fill="#fff"
            className="w-7 h-7 ms-2.5"
            onClick={() => {
              dispatch(toggleShowMenu());
            }}
          />
        </div>
        <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

        <div className="links cursor-pointer">
          <div className="w-full py-3 px-3 hover:text-white">
            <p
              onClick={() => {
                dispatch(toggleShowUnplanned());
                dispatch(toggleShowMenu());
              }}
              className="font-light text-[#454545] text-[18px] font-[Arial]"
            >
              Add Unplanned
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Competitor Intelligence
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Plan
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Survey
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Stock Capture
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Profiler
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Reporting
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Checkout
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              View Action Point
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />

          <div className="w-full py-3 px-3">
            <p className="font-light text-[#454545] text-[18px] font-[Arial]">
              Change password
            </p>
          </div>
          <hr className="outline-0 border-0 h-[0.3px] bg-[#efefef]" />
        </div>
      </div>
    </div>
  );
};

export default MenuPopup;
