import { Outlet, useLocation } from "react-router-dom";
import { Footer, Navbar } from "../components";
import { useAuthListener } from "../hooks/useAuthListener";
import { SHORT_NAVBAR_PAGES } from "../constants";
function MainLayout() {
  useAuthListener();
  const location = useLocation();
  const titleOnly = SHORT_NAVBAR_PAGES.includes(location.pathname);
  return (
    <div className="flex h-screen flex-col">
      <Navbar activeTab={location.pathname} titleOnly={titleOnly} />
      <Outlet />
      <Footer />
    </div>
  );
}

export default MainLayout;
