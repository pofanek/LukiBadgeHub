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
  { path: "/Login", element: <Login /> },
  { path: "/Register", element: <Register /> },
  { path: "*", element: <ErrorPage /> },
]);
// TODO bedzie trzeba dodać loading przy ładowaniu z API
// TODO menu po kliknięciu profilu na navbarze zimprovować
// TODO logout w hamburgermenu znika w zaleznosci od tego czy user jest zalogowany czy nie
// TODO hamburgermenu wyglada chujowo swoja droga
// TODO przerobić footer aby na MD było na górze Luki badge hub na dole created by pofaneki oraz Join our discord na górze i support us na dole wciąż w tej pozycji lewo prawo po to aby sie tak szybko nie zawijało
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
