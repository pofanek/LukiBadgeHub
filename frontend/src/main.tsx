import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import {
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
  AuthCallback,
  Homepage,
} from "./pages";
import { MainLayout, EmptyLayout } from "./layouts/";
const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      { path: "/about", element: <About /> },
      { path: "/terms", element: <Terms /> },
      { path: "/contact", element: <Contact /> },
      { path: "/games", element: <Games /> },
      { path: "/settings", element: <Settings /> },
      { path: "/rankings", element: <Rankings /> },
      { path: "/profile", element: <Profile /> },
      { path: "/logout", element: <Logout /> },
      { path: "/billing", element: <Billing /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Register /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/friends", element: <Friends /> },
    ],
  },
  {
    element: <EmptyLayout />,
    children: [
      { path: "/auth/callback", element: <AuthCallback /> },
      { path: "*", element: <ErrorPage /> },
    ],
  },
]);
// TODO kolor searchbara jest z pizdy i mnie wkurwia
// TODO ContactContent na md szerszy troche
// TODO dodać do navbara sign up i zmienić login na Log in
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
