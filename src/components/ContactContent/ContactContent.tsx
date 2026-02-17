import ContactLabel from "./ContactLabel";
import ContactInput from "./ContactInput";
import Textarea from "./Textarea";
import Submit from "./Submit";
import Dropdown from "./Dropdown";
import { useState } from "react";
import type { ContactTopic } from "../../types/Contact";
const ContactContent = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] =
    useState<ContactTopic>("Feedback");
  const [message, setMessage] = useState("");
  const values = [selectedOption, name, email, message];
  const setters = [setName, setEmail, setMessage];
  return (
    <main className="flex flex-1 items-center justify-center">
      <form
        autoComplete="false"
        method="POST"
        className="bg-surface-soft mx-85 mt-10 mb-10 flex h-auto max-w-119.5 flex-1 flex-col gap-4 rounded-xl p-5 shadow-black lg:max-w-200"
      >
        <ContactLabel text="Contact Us" bigText={true} />
        <ContactLabel
          text="Here you can report bugs that you found, give us a feature request or
          just send us a feedback!"
          smallText={true}
        />
        <div className="flex flex-col lg:flex-row">
          <div className="flex w-full flex-col gap-6 lg:gap-3">
            <ContactLabel htmlFor="topic" text="Topic" />
            <Dropdown
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              id="topic"
            />
            <ContactLabel htmlFor="name" text="Name &#10088;Optional&#10089;" />
            <ContactInput
              placeholder="John Doe"
              value={name}
              id="name"
              setter={setName}
            />
            <ContactLabel htmlFor="email" text="E-mail address" />
            <ContactInput
              placeholder="john.doe@example.com"
              value={email}
              id="email"
              setter={setEmail}
            />
          </div>
          <div className="mt-6 flex w-full flex-col gap-6 lg:mt-0 lg:ml-6 lg:justify-evenly lg:gap-3">
            <ContactLabel htmlFor="message" text="Message" />
            <Textarea id="message" message={message} setMessage={setMessage} />
            <Submit
              values={values}
              setters={setters}
              setSelectedOption={setSelectedOption}
            />
          </div>
        </div>
      </form>
    </main>
  );
};

export default ContactContent;
