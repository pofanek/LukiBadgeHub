type ContactLabelProps = {
  text: string;
  smallText?: boolean;
  bigText?: boolean;
  htmlFor?: string;
};

const ContactLabel = ({
  text,
  smallText = false,
  bigText = false,
  htmlFor,
}: ContactLabelProps) => {
  if (smallText || bigText) {
    return (
      <p
        className={`${smallText ? "text-font-muted text-md max-w-full lg:max-w-500" : "text-font-secondary text-2xl"} font-sans`}
      >
        {text}
      </p>
    );
  } else {
    return (
      <label
        className={`text-font-secondary font-sans text-xl`}
        htmlFor={htmlFor}
      >
        {text}
      </label>
    );
  }
};

export default ContactLabel;
