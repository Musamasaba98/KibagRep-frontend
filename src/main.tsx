import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./store/store";

// Public pages
import Homepage from "./pages/Homepage/Homepage";
import Login from "./pages/Authentication/Login";
import Signup from "./pages/Authentication/Signup";

// Rep
import RepPage from "./pages/RepPage/RepPage";
import Home from "./pages/RepPage/Children/Home";
import Tasks from "./pages/RepPage/Children/Tasks";
import Visits from "./pages/RepPage/Children/Visits";
import Doctors from "./pages/RepPage/Children/Doctors";
import CallCycle from "./pages/RepPage/Children/CallCycle";
import Reports from "./pages/RepPage/Children/Reports";
import Expenses from "./pages/RepPage/Children/Expenses";
import Calendar from "./pages/RepPage/Children/Calendar";
import TourPlan from "./pages/RepPage/Children/TourPlan";
import NearMe from "./pages/RepPage/Children/NearMe";
import Library from "./pages/RepPage/Children/Library";
import Settings from "./pages/RepPage/Children/Settings";

// Manager
import ManagerPage from "./pages/ManagerPage/ManagerPage";
import ManagerDashboard from "./pages/ManagerPage/children/Dashboard";
import Messaging from "./pages/ManagerPage/children/Messaging";
import ManagerTeams from "./pages/ManagerPage/children/Teams";
import ManagerTasks from "./pages/ManagerPage/children/Tasks";
import ManagerDoctors from "./pages/ManagerPage/children/Doctors";
import ManagerReports from "./pages/ManagerPage/children/ManagerReports";
import ManagerAnalytics from "./pages/ManagerPage/children/Analytics";
import ManagerCalendar from "./pages/ManagerPage/children/ManagerCalendar";
import TerritoryManagement from "./pages/shared/TerritoryManagement";

// Supervisor
import SupervisorPage from "./pages/SupervisorPage/SupervisorPage";
import SupervisorDashboard from "./pages/SupervisorPage/children/Dashboard";
import SupervisorReps from "./pages/SupervisorPage/children/Reps";
import SupervisorApprovals from "./pages/SupervisorPage/children/Approvals";
import SupervisorCycles from "./pages/SupervisorPage/children/Cycles";
import SupervisorJfw from "./pages/SupervisorPage/children/Jfw";
import SupervisorReports from "./pages/SupervisorPage/children/SupervisorReports";
import SupervisorDoctors from "./pages/SupervisorPage/children/Doctors";
import SupervisorTeamMap from "./pages/SupervisorPage/children/TeamMap";
import SupervisorAnalysis from "./pages/SupervisorPage/children/Analysis";

// Admin
import AdminPage from "./pages/AdminPage/AdminPage";
import AdminDashboard from "./pages/AdminPage/children/Dashboard";
import AdminDoctors from "./pages/AdminPage/children/Doctors";

// Country Manager
import CountryPage from "./pages/CountryPage/CountryPage";
import CountryDashboard from "./pages/CountryPage/children/Dashboard";
import CountryManagers from "./pages/CountryPage/children/Managers";
import CountryCoverage from "./pages/CountryPage/children/Coverage";
import CountryCampaigns from "./pages/CountryPage/children/Campaigns";
import CountryDoctors from "./pages/CountryPage/children/Doctors";
import CountryAnalytics from "./pages/CountryPage/children/CountryAnalytics";
import CountryReports from "./pages/CountryPage/children/CountryReports";
import CountryProducts from "./pages/CountryPage/children/Products";

// Sales Admin
import SalesAdminPage from "./pages/SalesAdminPage/SalesAdminPage";
import SalesAdminDashboard from "./pages/SalesAdminPage/children/Dashboard";
import SalesAdminUsers from "./pages/SalesAdminPage/children/Users";
import SalesAdminProducts from "./pages/SalesAdminPage/children/Products";
import SalesAdminSamples from "./pages/SalesAdminPage/children/Samples";
import SalesAdminDoctors from "./pages/SalesAdminPage/children/Doctors";
import SalesAdminFacilities from "./pages/SalesAdminPage/children/Facilities";
import SalesAdminBulkUpload from "./pages/SalesAdminPage/children/BulkUpload";
import SalesAdminCycles from "./pages/SalesAdminPage/children/Cycles";
import SalesAdminReports from "./pages/SalesAdminPage/children/Reports";

// Auth extras
import ForgotPassword from "./pages/Authentication/ForgotPassword";
import ResetPassword from "./pages/Authentication/ResetPassword";

// Super Admin
import SuperAdminPage from "./pages/SuperAdminPage/SuperAdminPage";
import SuperAdminDashboard from "./pages/SuperAdminPage/children/SuperAdminDashboard";
import SuperAdminCompanies from "./pages/SuperAdminPage/children/Companies";
import SuperAdminAllUsers from "./pages/SuperAdminPage/children/AllUsers";

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";

let persistor = persistStore(store);

const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/signup", element: <Signup /> },

  // Medical Rep
  {
    element: <ProtectedRoute allowedRoles={["MedicalRep", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/rep-page",
        element: <RepPage />,
        children: [
          { index: true, element: <Home /> },
          { path: "tasks", element: <Tasks /> },
          { path: "visits", element: <Visits /> },
          { path: "doctors", element: <Doctors /> },
          { path: "call-cycle", element: <CallCycle /> },
          { path: "reports", element: <Reports /> },
          { path: "expenses", element: <Expenses /> },
          { path: "calendar", element: <Calendar /> },
          { path: "tour-plan", element: <TourPlan /> },
          { path: "near-me", element: <NearMe /> },
          { path: "library", element: <Library /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },

  // Manager
  {
    element: <ProtectedRoute allowedRoles={["Manager", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/manager",
        element: <ManagerPage />,
        children: [
          { index: true, element: <ManagerDashboard /> },
          { path: "teams", element: <ManagerTeams /> },
          { path: "tasks", element: <ManagerTasks /> },
          { path: "doctors", element: <ManagerDoctors /> },
          { path: "reports", element: <ManagerReports /> },
          { path: "analytics", element: <ManagerAnalytics /> },
          { path: "messaging", element: <Messaging /> },
          { path: "calendar", element: <ManagerCalendar /> },
          { path: "territories", element: <TerritoryManagement /> },
        ],
      },
    ],
  },

  // Supervisor
  {
    element: <ProtectedRoute allowedRoles={["Supervisor", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/supervisor",
        element: <SupervisorPage />,
        children: [
          { index: true, element: <SupervisorDashboard /> },
          { path: "reps", element: <SupervisorReps /> },
          { path: "approvals", element: <SupervisorApprovals /> },
          { path: "cycles", element: <SupervisorCycles /> },
          { path: "map", element: <SupervisorTeamMap /> },
          { path: "analysis", element: <SupervisorAnalysis /> },
          { path: "doctors", element: <SupervisorDoctors /> },
          { path: "jfw", element: <SupervisorJfw /> },
          { path: "reports", element: <SupervisorReports /> },
        ],
      },
    ],
  },

  // Admin (HR)
  {
    element: <ProtectedRoute allowedRoles={["Supervisor", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/admin",
        element: <AdminPage />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "doctors", element: <AdminDoctors /> },
        ],
      },
    ],
  },

  // Country Manager
  {
    element: <ProtectedRoute allowedRoles={["COUNTRY_MGR", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/country",
        element: <CountryPage />,
        children: [
          { index: true, element: <CountryDashboard /> },
          { path: "managers", element: <CountryManagers /> },
          { path: "coverage", element: <CountryCoverage /> },
          { path: "campaigns", element: <CountryCampaigns /> },
          { path: "doctors", element: <CountryDoctors /> },
          { path: "analytics", element: <CountryAnalytics /> },
          { path: "reports", element: <CountryReports /> },
          { path: "products", element: <CountryProducts /> },
        ],
      },
    ],
  },

  // Sales Admin (Company Admin)
  {
    element: <ProtectedRoute allowedRoles={["SALES_ADMIN", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/sales-admin",
        element: <SalesAdminPage />,
        children: [
          { index: true, element: <SalesAdminDashboard /> },
          { path: "users", element: <SalesAdminUsers /> },
          { path: "products", element: <SalesAdminProducts /> },
          { path: "samples", element: <SalesAdminSamples /> },
          { path: "doctors", element: <SalesAdminDoctors /> },
          { path: "facilities", element: <SalesAdminFacilities /> },
          { path: "upload", element: <SalesAdminBulkUpload /> },
          { path: "cycles", element: <SalesAdminCycles /> },
          { path: "reports", element: <SalesAdminReports /> },
        ],
      },
    ],
  },

  // Super Admin (platform-level)
  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
    children: [
      {
        path: "/super-admin",
        element: <SuperAdminPage />,
        children: [
          { index: true, element: <SuperAdminDashboard /> },
          { path: "companies", element: <SuperAdminCompanies /> },
          { path: "users", element: <SuperAdminAllUsers /> },
        ],
      },
    ],
  },

  {
    path: "/unauthorized",
    element: (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">You don't have access to this page.</p>
      </div>
    ),
  },
]);

const root: any = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
