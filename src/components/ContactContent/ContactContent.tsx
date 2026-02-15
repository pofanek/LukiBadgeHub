import ContactLabel from "./ContactLabel";
import ContactInput from "./ContactInput";
import TextArea from "./TextArea";
import Submit from "./Submit";
import Dropdown from "./Dropdown";

const ContactContent = () => {
  return (
    <main className="flex flex-1 items-center justify-center">
      <form
        method="POST"
        className="bg-surface-soft mx-30 mt-10 mb-10 flex h-auto max-w-119.5 flex-1 flex-col gap-4 rounded-xl p-5 shadow-black lg:max-w-200"
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
            <Dropdown />
            <ContactLabel htmlFor="name" text="Name &#10088;Optional&#10089;" />
            <ContactInput />
            <ContactLabel htmlFor="email" text="E-mail address" />
            <ContactInput />
          </div>
          <div className="mt-6 flex w-full flex-col gap-6 lg:mt-0 lg:ml-6 lg:justify-evenly lg:gap-3">
            <ContactLabel text="Message" />
            <TextArea />
            <Submit />
          </div>
        </div>
      </form>
    </main>
  );
};

export default ContactContent;
