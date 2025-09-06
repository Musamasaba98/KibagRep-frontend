// import { useContext } from "react";
import MenuPopup from "./componets/MenuPopPup/MenuPopup";
import CRMPage from "./pages/Crmpage";
// import { AppContext } from "./pages/context/AppContext";
// import AddUnplanned from "./componets/AddUnplanned/AddUnplanned";
// import Ncapopup from "./componets/NcaPoppup/Ncapopup";
import { useSelector } from "react-redux";

function App() {
  // const { showMenu, showUnplanned, showNca } = useContext(AppContext);
  const { showMenu } = useSelector((state) => state.uiState);
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
