import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {createBrowserRouter,RouterProvider,} from "react-router-dom";
import Homepage from "./pages/Homepage/Homepage";
import { Provider } from "react-redux";
import persistStore from "redux-persist/es/persistStore";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./store/store";
import RepPage from "./pages/RepPage/RepPage";
import Home from "./pages/RepPage/Children/Home";
import Tasks from "./pages/RepPage/Children/Tasks";
import Signup from "./pages/Authentication/Signup";
import Login from "./pages/Authentication/Login";

let persistor = persistStore(store);

const router = createBrowserRouter([
  {
  path:"/",
  element:<Homepage/>
  },
  {
    path:"/signup",
    element:<Signup/>
  },{
    path:"/login",
    element:<Login/>
  },
 {
    path:"/rep-page",
    element:<RepPage/>,
    children:[
      {
        path:"/rep-page/",
        index:true,
        element:<Home/>
      },{
        path:"/rep-page/tasks",
        element:<Tasks/>
      }
    ]
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
