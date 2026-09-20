import { Outlet, useLocation } from "react-router-dom";
import { Footer, Navbar } from "../components";
import { useAuthListener } from "../hooks/useAuthListener";
import { usePageTitle } from "../hooks/usePageTitle";
import { NotificationProvider } from "../hooks/useNotifications";
import { SHORT_NAVBAR_PAGES } from "../constants";
function MainLayout() {
  useAuthListener();
  usePageTitle();
  const location = useLocation();
  const titleOnly = SHORT_NAVBAR_PAGES.includes(location.pathname);
  const hasOpaqueFooter =
    /^\/profile\/[^/]+$/.test(location.pathname) ||
    /^\/games\/[^/]+$/.test(location.pathname);
  return (
    <NotificationProvider>
      <div
        className="bg-primary flex min-h-screen flex-col bg-cover bg-fixed bg-center bg-no-repeat"
        style={{ backgroundImage: "var(--bg-image)" }}
      >
        <Navbar activeTab={location.pathname} titleOnly={titleOnly} />
        <main className="flex flex-1">
          <Outlet />
        </main>
        <Footer className={hasOpaqueFooter ? "bg-primary" : undefined} />
      </div>
    </NotificationProvider>
  );
}

export default MainLayout;
