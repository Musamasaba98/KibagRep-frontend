import React from "react";
import ReactDOM from "react-dom/client";
import CRMPage from "./pages/Crmpage";
import "./index.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import Homepage from "./pages/Homepage/Homepage";
import Activity from "./componets/Dashboard/DashboardComponents/Activity/Activity";
import Revenue from "./componets/Dashboard/DashboardComponents/Revenue/Revenue";
import Performance from "./componets/Dashboard/DashboardComponents/Performance/Performance";
import OutsideSales from "./componets/Dashboard/DashboardComponents/OutsideSales/OutsideSales";
import Events from "./componets/Dashboard/DashboardComponents/Events/Events";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import { Provider } from "react-redux";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./store/store";

let persistor = persistStore(store);

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

const root:any = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
