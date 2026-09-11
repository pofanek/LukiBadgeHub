import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import {
  About,
  Contact,
  Games,
  GameDetail,
  Rankings,
  Settings,
  Terms,
  Profile,
  Billing,
  Login,
  Register,
  ErrorPage,
  Notifications,
  AuthCallback,
  Homepage,
  ForgotPassword,
  ResetPassword,
  Goodbye,
  AdminGames,
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
      { path: "/games/:id", element: <GameDetail /> },
      { path: "/admin", element: <AdminGames /> },
      { path: "/admin/games/:id", element: <AdminGames /> },
      { path: "/settings", element: <Settings /> },
      { path: "/rankings", element: <Rankings /> },
      { path: "/profile", element: <Profile /> },
      { path: "/profile/:username", element: <Profile /> },
      { path: "/billing", element: <Billing /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Register /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/goodbye", element: <Goodbye /> },
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
