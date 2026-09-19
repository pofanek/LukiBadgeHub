import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  SocialLogin,
  FormFooter,
  NoAccount,
} from "./components";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit, Turnstile } from "../../components/UI";
import { supabase } from "../../utils/supabase";
import { PasswordRequirements } from "../../components/UI";
import { passwordIsValid } from "../../utils/password";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Complete the security check to continue.");
      return;
    }
    if (!passwordIsValid(password)) {
      setError("Choose a password that meets every requirement below.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
      },
    });
    setCaptchaToken(null); setCaptchaReset((value) => value + 1);
    if (error) {
      setError(error.message.toLowerCase().includes("already") ? "That email address already has an account. Log in instead." : error.message);
      setLoading(false);
    } else if (data.user?.identities?.length === 0) {
      setError("That email address already has an account. Log in instead.");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
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
    if (!error && !success) return;
    const timer = window.setTimeout(() => { setError(null); setSuccess(false); }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, success]);
  return (
    <FocusContent>
      <form
        className="bg-surface-overlay/40 mx-3 my-8 flex min-h-145 max-w-110 min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 py-10 shadow-black outline-none sm:mx-20 sm:my-15 sm:min-w-85"
        onSubmit={handleRegister}
      >
        <h1 className="text-font-primary font-serif text-5xl">Sign Up</h1>
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
        <EmailInput value={email} id="email" setter={setEmail} />
        <PasswordInput
          id="password"
          value={password}
          setter={setPassword}
          autoComplete="new-password"
        />
        <div className="w-[80%] min-w-64"><PasswordRequirements password={password} /></div>
        <FormFooter>
          <Submit
            disabled={loading || !captchaToken}
            label={loading ? "Loading..." : "Register"}
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={false} />
        </FormFooter>
      </form>
      {(success || error) && <AuthToast message={error || "Check your email address to confirm your account."} error={Boolean(error)} onDismiss={() => { setError(null); setSuccess(false); }} />}
    </FocusContent>
  );
};

function AuthToast({ message, error, onDismiss }: { message: string; error: boolean; onDismiss: () => void }) {
  const Icon = error ? FiAlertCircle : FiCheckCircle;
  return <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2" role={error ? "alert" : "status"} aria-live="polite"><div className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-destructive" : "text-accent-cold"}`} /><p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p><button type="button" onClick={onDismiss} className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1" aria-label="Dismiss notification"><FiX className="h-4 w-4" /></button></div></div>;
}

export default Register;
