import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import {
  App,
  About,
  Contact,
  Games,
  Logout,
  Rankings,
  Settings,
  Terms,
  Profile,
  Billing,
  Login,
  Register,
  ErrorPage,
  Notifications,
  Friends,
} from "./pages";
const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/About", element: <About /> },
  { path: "/Terms", element: <Terms /> },
  { path: "/Contact", element: <Contact /> },
  { path: "/Games", element: <Games /> },
  { path: "/Settings", element: <Settings /> },
  { path: "/Rankings", element: <Rankings /> },
  { path: "/Profile", element: <Profile /> },
  { path: "/Logout", element: <Logout /> },
  { path: "/Billing", element: <Billing /> },
  { path: "/Login", element: <Login /> },
  { path: "/Register", element: <Register /> },
  { path: "/Notifications", element: <Notifications /> },
  { path: "/Friends", element: <Friends /> },
  { path: "*", element: <ErrorPage /> },
]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
