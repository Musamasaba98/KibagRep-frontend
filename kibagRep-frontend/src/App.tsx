// import { useContext } from "react";
import MenuPopup from "./componets/MenuPopPup/MenuPopup.js";
import CRMPage from "./pages/Crmpage.js";
// import { AppContext } from "./pages/context/AppContext";
// import AddUnplanned from "./componets/AddUnplanned/AddUnplanned";
// import Ncapopup from "./componets/NcaPoppup/Ncapopup";
import { useSelector } from "react-redux";

function App() {
  // const { showMenu, showUnplanned, showNca } = useContext(AppContext);
  const { showMenu } = useSelector((state:any) => state.uiState);
  console.log(showMenu);
  return (
    <>
      <MenuPopup />
      {/* {showUnplanned ? <AddUnplanned /> : <></>} */}
      {/* {showNca ? <Ncapopup /> : <></>} */}
      <CRMPage />
    </>
  );
}

export default App;
