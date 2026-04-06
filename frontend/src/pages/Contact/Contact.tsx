import { useEffect, useState } from "react";
import { ContactLabel, ContactInput, Textarea, Dropdown } from "./components";
import { TOPIC_COLORS } from "../../constants";
import { sendFeedbackWebhook } from "../../utils/webhook";
import type { ContactTopic } from "../../types/Contact";
import { FocusContent, Submit } from "../../components/UI";

const COOLDOWN_TIME = 60000;

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] =
    useState<ContactTopic>("Feedback");
  const [message, setMessage] = useState("");

  const [cooldown, setCooldown] = useState(0);

  const [isDropdownOpen, setisDropdownOpen] = useState(false);
  useEffect(() => {
    //? lastSubmitTimestamp sie nie updatuje!!! zmienia sie jeden raz
    const saved = sessionStorage.getItem("lastSubmitTimestamp");
    if (!saved) return;
    const now = Date.now();
    const timeLeft = COOLDOWN_TIME - (now - Number(saved));
    const remaining = Math.ceil(timeLeft / 1000);
    setCooldown(remaining);
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const safeName = name || "Name not provided";

    const WEBHOOK_EMBED = {
      title: "CATEGORY: " + selectedOption.toUpperCase(),
      color: TOPIC_COLORS[selectedOption],
      timestamp: new Date().toISOString(),
      description: "─────────────────────────────────────",
      footer: {
        icon_url: "https://i.ibb.co/TMvd0jHX/logo.jpg",
        text: "© Luki Badge Hub",
      },
      thumbnail: {
        url: "https://i.ibb.co/chFRcFPS/NOWAYINGpng.png",
      },
      author: {
        name: safeName,
        url: "https://discordapp.com",
        icon_url: "https://i.ibb.co/GvrzrP4G/USERCHOMIK.webp",
      },
      fields: [
        { name: "Name", value: safeName, inline: true },
        { name: "E-mail", value: email, inline: true },
        { name: "Message", value: message },
      ],
    };

    sendFeedbackWebhook({ type: "embed", embed: WEBHOOK_EMBED });

    setName("");
    setEmail("");
    setMessage("");
    setSelectedOption("Feedback");
    setCooldown(COOLDOWN_TIME / 1000);
    const now = Date.now();
    sessionStorage.setItem("lastSubmitTimestamp", now.toString());
  };

  return (
    <FocusContent>
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-surface-soft mx-85 mt-10 mb-10 flex h-auto max-w-119.5 flex-1 flex-col gap-4 rounded-xl p-5 shadow-black lg:max-w-200"
      >
        <ContactLabel text="Contact Us" />
        <ContactLabel
          text="Here you can report bugs, request features or send feedback!"
          smallText
        />

        <div className="flex flex-col lg:flex-row">
          <div className="flex w-full flex-col gap-6 lg:gap-3">
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

          <div className="mt-6 flex w-full flex-col gap-6 lg:mt-0 lg:ml-6 lg:gap-3">
            <ContactLabel htmlFor="message" text="Message" />
            <Textarea id="message" message={message} setMessage={setMessage} />
            <Submit
              label="Submit"
              cooldown={cooldown}
              disabled={cooldown > 0}
            />
          </div>
        </div>
      </form>
    </FocusContent>
  );
};

export default Contact;
