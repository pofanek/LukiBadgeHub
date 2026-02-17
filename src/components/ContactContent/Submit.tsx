import { sendWebhook } from "../../utils/webhook";
import type { ContactTopic } from "../../types/Contact";
import { TOPIC_COLORS } from "../../constants";
type SubmitProps = {
  values: string[];
  setters: React.Dispatch<React.SetStateAction<string>>[];
  setSelectedOption: React.Dispatch<React.SetStateAction<ContactTopic>>;
};

const Submit = ({ values, setters, setSelectedOption }: SubmitProps) => {
  return (
    <button
      onClick={() => {
        const name = values[1] === "" ? "Name not provided" : values[1];
        // const exampleString = `selectedOption = ${values[0]} name = ${values[1]} email = ${values[2]}  message = ${values[3]}`;
        const WEBHOOK_EMBED = {
          title: "CATEGORY: " + values[0].toUpperCase(),
          color: TOPIC_COLORS[values[0]],
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
            name: name,
            url: "https://discordapp.com",
            icon_url: "https://i.ibb.co/GvrzrP4G/USERCHOMIK.webp",
          },
          fields: [
            {
              name: "Name",
              value: name,
              inline: true,
            },
            {
              name: "E-mail",
              value: values[2],
              inline: true,
            },
            {
              name: "Message",
              value: values[3],
            },
          ],
        };
        setters.forEach((setter) => {
          setter("");
        });
        setSelectedOption("Feedback");
        sendWebhook({ type: "embed", embed: WEBHOOK_EMBED });
      }}
      className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim cursor-pointer rounded-xl bg-linear-to-r p-1.5 transition-transform duration-300 hover:scale-[103%]"
      type="button"
    >
      Send
    </button>
  );
};

export default Submit;
