import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

export function useAuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate("/");
      }
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);
}
