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
            element: <Activity />,
          },
        ],
      },
    ],
  },
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
