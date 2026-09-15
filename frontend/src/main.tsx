import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { MainLayout, EmptyLayout } from "./layouts/";

const About = lazy(() => import("./pages/About/About"));
const AuthCallback = lazy(() => import("./pages/AuthCallback/AuthCallback"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const ErrorPage = lazy(() => import("./pages/ErrorPage/ErrorPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const GamePlayers = lazy(() => import("./pages/GamePlayers/GamePlayers"));
const Games = lazy(() => import("./pages/Games/Games"));
const Goodbye = lazy(() => import("./pages/Goodbye/Goodbye"));
const Homepage = lazy(() => import("./pages/Homepage/Homepage"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Notifications = lazy(() => import("./pages/Notifications/Notifications"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Rankings = lazy(() => import("./pages/Rankings/Rankings"));
const Register = lazy(() => import("./pages/Auth/SignUp"));
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword"));
const Search = lazy(() => import("./pages/Search/Search"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const Support = lazy(() => import("./pages/Billing/Billing"));
const Terms = lazy(() => import("./pages/Terms/Terms"));
const Updates = lazy(() => import("./pages/Updates/Updates"));
const AdminGames = lazy(() => import("./pages/AdminGames/AdminGames"));

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
      { path: "/games/:id/players", element: <GamePlayers /> },
      { path: "/admin", element: <AdminGames /> },
      { path: "/admin/games/:id", element: <AdminGames /> },
      { path: "/settings", element: <Settings /> },
      { path: "/leaderboard", element: <Rankings /> },
      { path: "/profile", element: <Profile /> },
      { path: "/profile/:username", element: <Profile /> },
      { path: "/support", element: <Support /> },
      { path: "/updates", element: <Updates /> },
      { path: "/search", element: <Search /> },
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
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<main className="text-font-secondary flex min-h-screen items-center justify-center">Loading page...</main>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
);
