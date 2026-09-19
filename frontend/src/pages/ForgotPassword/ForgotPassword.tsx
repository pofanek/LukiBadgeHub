import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import { supabase } from "../../utils/supabase";
import { Turnstile } from "../../components/UI";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const navigate = useNavigate();

  const dismissFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!captchaToken) return;
    dismissFeedback();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });
    setCaptchaToken(null); setCaptchaReset((value) => value + 1);
    if (error) setError(error.message);
    else setMessage("Password reset email sent. Check your inbox.");
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 flex w-full max-w-120 min-w-85 flex-col items-center justify-center gap-6 rounded-xl px-5 py-10 shadow-black">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-font-primary font-serif text-3xl">
            Reset your password
          </h2>
          <p className="text-font-muted text-md mt-2 text-center font-sans">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="border-surface-soft w-[80%] border-t" />

        <div className="flex w-[80%] min-w-64 flex-col gap-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email address"
            className="bg-surface text-font-primary border-surface-soft focus:border-accent-cold w-full rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 outline-none"
          />
          <Turnstile key={captchaReset} onTokenChange={setCaptchaToken} />

          <button
            onClick={handleSubmit}
            disabled={!captchaToken}
            className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full cursor-pointer rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%]"
          >
            Send reset link
          </button>
          <button
            onClick={() => navigate("/login")}
            className="border-surface-soft hover:ring-surface-raised text-font-secondary w-full cursor-pointer rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 hover:ring-2"
          >
            Back to login
          </button>
        </div>
      </div>
      {(message || error) && (
        <div
          className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          <div className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}>
            {error ? (
              <FiAlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <FiCheckCircle className="text-accent-cold mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="min-w-0 flex-1 text-sm leading-relaxed">
              {error || message}
            </p>
            <button
              type="button"
              onClick={dismissFeedback}
              className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1"
              aria-label="Dismiss notification"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;
