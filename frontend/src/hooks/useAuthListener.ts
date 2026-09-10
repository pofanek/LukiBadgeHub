import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

export function useAuthListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") return;

        const isDeletionVerification = new URLSearchParams(location.search).get("delete-email-verification") === "1" || window.localStorage.getItem("luki-pending-account-deletion") === "1";
        if (event === "SIGNED_IN" && location.pathname === "/auth/callback" && !isDeletionVerification) {
          navigate("/", { replace: true });
        }

        if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [location.pathname, navigate]);
}
