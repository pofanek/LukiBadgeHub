import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./components/pages/App.tsx";
import Contact from "./components/pages/Contact.tsx";
const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/Contact", element: <Contact /> },
]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
