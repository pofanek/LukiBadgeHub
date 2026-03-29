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
} from "./components/pages";
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
]);
// TODO - add error page
// TODO bedzie trzeba dodać loading
// TODO - kolory ikon na białe
// TODO moze custom scroll
// TODO w contact dodac opcje balance suggestion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
