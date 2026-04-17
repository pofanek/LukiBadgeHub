import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

export function useAuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    let previousUserId: string | undefined;

    supabase.auth.getSession().then(({ data }) => {
      previousUserId = data.session?.user.id;
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") return;

        if (event === "SIGNED_IN") {
          if (session?.user.id !== previousUserId) {
            previousUserId = session?.user.id;
            navigate("/");
          }
          previousUserId = session?.user.id;
        }

        if (event === "SIGNED_OUT") {
          previousUserId = undefined;
          navigate("/login");
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [navigate]);
}
