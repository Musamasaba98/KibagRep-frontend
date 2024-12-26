import React from "react";
import ReactDOM from "react-dom/client";
import CRMPage from "./pages/Crmpage";
import App from "./App.jsx";
import "./index.css";
import AppContextProvider from "./pages/context/AppContext.jsx";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import Homepage from "./pages/Homepage/Homepage.jsx";
import Activity from "./componets/Dashboard/DashboardComponents/Activity/Activity.jsx";
import Revenue from "./componets/Dashboard/DashboardComponents/Revenue/Revenue.jsx";
import Performance from "./componets/Dashboard/DashboardComponents/Performance/Performance.jsx";
import OutsideSales from "./componets/Dashboard/DashboardComponents/OutsideSales/OutsideSales.jsx";
import Events from "./componets/Dashboard/DashboardComponents/Events/Events.jsx";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <CRMPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Homepage />,
        children: [
          {
            index: true,
            element: <Navigate to="activity" replace />,
          },
          {
            path: "activity",
            element: <Activity />,
          },

          {
            path: "events",
            element: <Events />,
          },
          {
            path: "revenue",
            element: <Revenue />,
          },
          {
            path: "performance",
            element: <Performance />,
          },
          {
            path: "outsidesales",
            element: <OutsideSales />,
          },
        ],
      },
    ],
  },
  {
    path:"/admin",
    element:<AdminDashboard/>
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppContextProvider>
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    </AppContextProvider>
  </React.StrictMode>
);
