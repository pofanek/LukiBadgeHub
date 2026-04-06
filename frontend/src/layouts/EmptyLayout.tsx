import { Outlet } from "react-router-dom";
import { useAuthListener } from "../hooks/useAuthListener";
function MainLayout() {
  useAuthListener();
  return (
    <div className="flex h-screen flex-col">
      <Outlet />
    </div>
  );
}

export default MainLayout;
