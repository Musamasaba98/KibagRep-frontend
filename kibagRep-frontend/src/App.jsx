import { useContext } from "react";
import MenuPopup from "./componets/MenuPopPup/MenuPopup";
import CRMPage from "./pages/Crmpage";
import Homepage from "./pages/Homepage/Homepage";
import { AppContext } from "./pages/context/AppContext";
import AddUnplanned from "./componets/AddUnplanned/AddUnplanned";
import Ncapopup from "./componets/NcaPoppup/Ncapopup";

function App() {

const {showMenu,showUnplanned,showNca}=useContext(AppContext);

  return (
    <>
    {showMenu?<MenuPopup/>:<></>}
    {showUnplanned?<AddUnplanned/>:<></>}
    {showNca?<Ncapopup/>:<></>}

      <Homepage/>

      {/* <CRMPage/>  */}

    </>
  );
}

export default App;
