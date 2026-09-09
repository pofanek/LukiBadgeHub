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

        if (event === "SIGNED_IN" && location.pathname === "/auth/callback") {
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
