import AdminPage from "./AdminPage/AdminPage";
import Navbar from "./Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar"


const AdminDashboard = () => {
  return (
    <div className="w-full bg-slate-100">

    <Navbar/>

    <div className="w-full flex">
    <Sidebar/>
    <AdminPage/>
    </div>

    </div>
  );
}

export default AdminDashboard;