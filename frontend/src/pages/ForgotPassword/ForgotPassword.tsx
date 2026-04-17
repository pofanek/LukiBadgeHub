import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Sprawdź maila!");
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

          {error && (
            <p className="text-center font-sans text-sm text-red-400">
              {error}
            </p>
          )}
          {message && (
            <p className="text-center font-sans text-sm text-green-400">
              {message}
            </p>
          )}

          <button
            onClick={handleSubmit}
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
    </div>
  );
}

export default ForgotPassword;
