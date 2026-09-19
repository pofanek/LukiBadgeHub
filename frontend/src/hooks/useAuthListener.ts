import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthUser } from "./useAuthUser";

export function useAuthListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuthUser();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (isLoading) return;
    const isDeletionVerification = new URLSearchParams(location.search).get("delete-email-verification") === "1" || window.localStorage.getItem("luki-pending-account-deletion") === "1";
    if (user && location.pathname === "/auth/callback" && !isDeletionVerification) {
      navigate("/", { replace: true });
    }
    if (previousUserId.current && !user) {
      navigate("/login");
    }
    previousUserId.current = user?.id ?? null;
  }, [isLoading, location.pathname, location.search, navigate, user]);
}
