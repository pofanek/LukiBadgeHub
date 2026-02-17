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
        className={`${smallText ? "text-font-muted max-w-full text-sm lg:max-w-500" : "text-font-secondary text-xl"} font-sans`}
      >
        {text}
      </p>
    );
  } else {
    return (
      <label
        className={`text-font-secondary font-sans text-lg`}
        htmlFor={htmlFor}
      >
        {text}
      </label>
    );
  }
};

export default ContactLabel;
