import React from "react";
import ReactDOM from "react-dom/client";
import CRMPage from "./pages/Crmpage";
import "./index.css";
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
import { Provider } from "react-redux";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./store/store.js";
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
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
