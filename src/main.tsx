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

// Role dashboards
import RepPage from "./pages/RepPage/RepPage";
import Home from "./pages/RepPage/Children/Home";
import Tasks from "./pages/RepPage/Children/Tasks";
import Visits from "./pages/RepPage/Children/Visits";
import Doctors from "./pages/RepPage/Children/Doctors";
import CallCycle from "./pages/RepPage/Children/CallCycle";
import Reports from "./pages/RepPage/Children/Reports";
import Expenses from "./pages/RepPage/Children/Expenses";
import Calendar from "./pages/RepPage/Children/Calendar";
import Settings from "./pages/RepPage/Children/Settings";
import ManagerPage from "./pages/ManagerPage/ManagerPage";
import Dashboard from "./pages/ManagerPage/children/Dashboard";
import Messaging from "./pages/ManagerPage/children/Messaging";
import AdminPage from "./pages/AdminPage/AdminPage";
import SupervisorPage from "./pages/SupervisorPage/SupervisorPage";
import SupervisorDashboard from "./pages/SupervisorPage/children/Dashboard";
import CountryPage from "./pages/CountryPage/CountryPage";
import CountryDashboard from "./pages/CountryPage/children/Dashboard";
import SalesAdminPage from "./pages/SalesAdminPage/SalesAdminPage";
import SalesAdminDashboard from "./pages/SalesAdminPage/children/Dashboard";

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";

let persistor = persistStore(store);

const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────
  { path: "/", element: <Homepage /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // ── Protected: Medical Rep ───────────────────────────────────────
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
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },

  // ── Protected: Manager ───────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["Manager", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/manager",
        element: <ManagerPage />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "messaging", element: <Messaging /> },
        ],
      },
    ],
  },

  // ── Protected: Supervisor ────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["Supervisor", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/supervisor",
        element: <SupervisorPage />,
        children: [
          { index: true, element: <SupervisorDashboard /> },
        ],
      },
    ],
  },

  // ── Protected: Admin (HR) ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["Supervisor", "SUPER_ADMIN"]} />,
    children: [
      { path: "/admin", element: <AdminPage /> },
    ],
  },

  // ── Protected: Country Manager ───────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["COUNTRY_MGR", "SUPER_ADMIN"]} />,
    children: [
      {
        path: "/country",
        element: <CountryPage />,
        children: [
          { index: true, element: <CountryDashboard /> },
        ],
      },
    ],
  },

  // ── Protected: Sales Admin ───────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
    children: [
      {
        path: "/sales-admin",
        element: <SalesAdminPage />,
        children: [
          { index: true, element: <SalesAdminDashboard /> },
        ],
      },
    ],
  },

  // ── Unauthorized fallback ─────────────────────────────────────────
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
