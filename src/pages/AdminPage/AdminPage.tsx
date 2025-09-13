import Navabar from "./components/Navabar";
import Sidebar from "./components/Sidebar";


const AdminPage = () => {
  return (
    <>
    <Navabar/>
    <div className="min-h-screen flex bg-gray-100">
    <Sidebar/>
    </div>
    </>
  );
};

export default AdminPage;