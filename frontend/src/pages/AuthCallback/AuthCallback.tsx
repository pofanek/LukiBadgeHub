import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FocusContent } from "../../components";
import { supabase } from "../../utils/supabase";

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const errorDescription = params.get("error_description") || new URLSearchParams(window.location.hash.slice()).get("error_description");
  const pendingAccountDeletion = window.localStorage.getItem("luki-pending-account-deletion") === "1";

  useEffect(() => {
    if (errorDescription) return;
    const destination = pendingAccountDeletion ? "/settings?delete-email-verification=1" : "/";
    if (pendingAccountDeletion) window.localStorage.removeItem("luki-pending-account-deletion");
    const redirectIfSignedIn = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate(destination, { replace: true });
    };
    void redirectIfSignedIn();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate(destination, { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [errorDescription, navigate, params, pendingAccountDeletion]);

  return (
    <FocusContent>
      <div className="text-font-secondary text-center text-3xl">{errorDescription ? `Authentication could not complete: ${errorDescription}` : "Logging in..."}</div>
    </FocusContent>
  );
};

export default AuthCallback;
