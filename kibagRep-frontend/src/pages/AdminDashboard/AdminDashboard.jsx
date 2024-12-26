import AdminPage from "./AdminPage/AdminPage";
import Sidebar from "./Sidebar/Sidebar"


const AdminDashboard = () => {
  return (
    <div className="w-full bg-slate-100 flex">
    <Sidebar/>
    <AdminPage/>
    </div>
  );
}

export default AdminDashboard;