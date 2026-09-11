import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FocusContent } from "../../components";
import { supabase } from "../../utils/supabase";

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const errorDescription = params.get("error_description") || hashParams.get("error_description");
  const pendingAccountDeletion = params.get("delete-email-verification") === "1" || window.localStorage.getItem("luki-pending-account-deletion") === "1";

  useEffect(() => {
    if (errorDescription) return;
    const destination = pendingAccountDeletion ? "/settings?delete-email-verification=1" : "/";
    if (pendingAccountDeletion) window.localStorage.removeItem("luki-pending-account-deletion");
    const completeAuthentication = async () => {
      const code = params.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) navigate(destination, { replace: true });
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) navigate(destination, { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) navigate(destination, { replace: true });
    };
    void completeAuthentication();
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
