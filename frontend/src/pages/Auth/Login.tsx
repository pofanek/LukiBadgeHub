import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  SocialLogin,
  NoAccount,
  LoginLink,
  FormFooter,
} from "./components";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit, Turnstile } from "../../components/UI";
import { supabase } from "../../utils/supabase";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: login,
      password: password,
      options: { captchaToken },
    });
    setCaptchaToken(null); setCaptchaReset((value) => value + 1);
    if (error) {
      setError(error.message);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setShowResend(true);
      }
      setLoading(false);
    } else {
      setLoading(false);
      const returnPath = window.sessionStorage.getItem("luki-post-login-path");
      window.sessionStorage.removeItem("luki-post-login-path");
      navigate(returnPath || "/");
    }
  };
  const handleResendEmail = async () => {
    if (!captchaToken) return;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: login,
      options: { captchaToken },
    });
    setCaptchaToken(null); setCaptchaReset((value) => value + 1);

    if (resendError) {
      setError(resendError.message);
    } else {
      setNotice("Verification email sent. Check your inbox.");
      setShowResend(false);
    }
  };
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  };

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };
  useEffect(() => {
    if (!error && !notice) return;
    const timer = window.setTimeout(() => { setError(null); setNotice(null); }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, notice]);
  const dismiss = () => { setError(null); setNotice(null); };
  return (
    <FocusContent>
      <form
        className="bg-surface-overlay/40 mx-3 my-8 flex min-h-145 max-w-110 min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 py-10 shadow-black outline-none sm:mx-20 sm:my-15 sm:min-w-85"
        onSubmit={handleLogin}
      >
        <h1 className="text-font-primary font-serif text-5xl">Log In</h1>
        <SocialLogin
          icon={<FcGoogle size={24} />}
          label="Continue with Google"
          onClick={handleGoogleLogin}
        />
        <SocialLogin
          icon={<FaDiscord size={24} />}
          label="Continue with Discord"
          onClick={handleDiscordLogin}
        />
        <Splitter />
        <Turnstile key={captchaReset} onTokenChange={setCaptchaToken} />
        <EmailInput value={login} id="name" setter={setLogin} />
        <FormFooter>
          <PasswordInput id="password" value={password} setter={setPassword} />
          <div className="flex w-[80%] justify-center">
            <LoginLink pathTo="/forgot-password">Forgot password?</LoginLink>
          </div>
        </FormFooter>
        <FormFooter>
          <Submit
            label={loading ? "Loading..." : "Login"}
            disabled={loading || !captchaToken}
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={true} />
        </FormFooter>
      </form>
      {showResend && (
        <button
          type="button"
          onClick={handleResendEmail}
          disabled={!captchaToken}
          className="text-font-secondary hover:text-font-primary text-sm underline transition-colors"
        >
          Didn't get the email? Resend link
        </button>
      )}
      {(error || notice) && <AuthToast message={error || notice || ""} error={Boolean(error)} onDismiss={dismiss} />}
    </FocusContent>
  );
};

function AuthToast({ message, error, onDismiss }: { message: string; error: boolean; onDismiss: () => void }) {
  const Icon = error ? FiAlertCircle : FiCheckCircle;
  return <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2" role={error ? "alert" : "status"} aria-live="polite"><div className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-destructive" : "text-accent-cold"}`} /><p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p><button type="button" onClick={onDismiss} className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1" aria-label="Dismiss notification"><FiX className="h-4 w-4" /></button></div></div>;
}

export default Login;
