import { Outlet } from "react-router-dom";
import { useAuthListener } from "../hooks/useAuthListener";
import { usePageTitle } from "../hooks/usePageTitle";
function MainLayout() {
  useAuthListener();
  usePageTitle();
  return (
    <div className="flex h-screen flex-col">
      <Outlet />
    </div>
  );
}

export default MainLayout;
