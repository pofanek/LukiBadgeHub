import { useEffect, useState } from "react";
import { ContactLabel, ContactInput, Textarea, Dropdown } from "./components";
import type { ContactTopic } from "../../types/Contact";
import { FocusContent, Submit, Turnstile } from "../../components/UI";
import { supabase } from "../../utils/supabase";
import { getFunctionErrorMessage } from "../../utils/media";

const COOLDOWN_TIME = 60000;

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] =
    useState<ContactTopic>("Feedback");
  const [message, setMessage] = useState("");

  const [cooldown, setCooldown] = useState(0);
  const [isDropdownOpen, setisDropdownOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const saved = sessionStorage.getItem("lastSubmitTimestamp");
    if (!saved) return;
    const now = Date.now();
    const timeLeft = COOLDOWN_TIME - (now - Number(saved));
    const remaining = Math.max(0, Math.ceil(timeLeft / 1000));
    queueMicrotask(() => setCooldown(remaining));
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) {
      setFeedback("Complete the security check before sending your message.");
      return;
    }

    setFeedback("");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("feedback", {
        body: { captchaToken, email, message, name, topic: selectedOption },
      });
      if (error) {
        setFeedback(await getFunctionErrorMessage(error, "Your message could not be sent."));
        return;
      }

      setName("");
      setEmail("");
      setMessage("");
      setSelectedOption("Feedback");
      setCooldown(COOLDOWN_TIME / 1000);
      sessionStorage.setItem("lastSubmitTimestamp", Date.now().toString());
      setFeedback("Thanks — your message has been sent.");
    } catch {
      setFeedback("Your message could not be sent.");
    } finally {
      setIsSubmitting(false);
      setCaptchaToken(null);
      setCaptchaReset((value) => value + 1);
    }
  };

  return (
    <FocusContent>
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-surface-soft mx-40 mt-10 mb-10 flex h-auto flex-1 flex-col gap-4 rounded-xl p-5 shadow-black md:max-w-200 xl:mx-auto xl:w-full xl:max-w-240"
      >
        <ContactLabel text="Contact Us" />
        <ContactLabel
          text="Here you can report bugs, request features or send feedback!"
          smallText
        />

        <div className="flex flex-col md:flex-row">
          <div className="flex w-full flex-col gap-6 md:gap-3">
            <ContactLabel text="Topic" setisDropdownOpen={setisDropdownOpen} />
            <Dropdown
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              setisDropdownOpen={setisDropdownOpen}
              isDropdownOpen={isDropdownOpen}
              id="topic"
            />

            <ContactLabel htmlFor="name" text="Name (Optional)" />
            <ContactInput
              placeholder="John Doe"
              value={name}
              id="name"
              setter={setName}
              required={false}
            />

            <ContactLabel htmlFor="email" text="E-mail address" />
            <ContactInput
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              id="email"
              setter={setEmail}
              required={true}
            />
          </div>

          <div className="mt-6 flex w-full flex-col gap-6 md:mt-0 md:ml-6 md:gap-3">
            <ContactLabel htmlFor="message" text="Message" />
            <Textarea id="message" message={message} setMessage={setMessage} />
            <Turnstile key={captchaReset} onTokenChange={setCaptchaToken} />
            <Submit
              label={isSubmitting ? "Sending..." : "Submit"}
              cooldown={cooldown}
              disabled={cooldown > 0 || isSubmitting || !captchaToken}
            />
            {feedback && <p role="status" className="text-font-secondary text-sm">{feedback}</p>}
          </div>
        </div>
      </form>
    </FocusContent>
  );
};

export default Contact;
