import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import {
  About,
  Contact,
  Games,
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
  ForgotPassword,
  ResetPassword,
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
      { path: "/billing", element: <Billing /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Register /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/friends", element: <Friends /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
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
// TODO shadcn.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
