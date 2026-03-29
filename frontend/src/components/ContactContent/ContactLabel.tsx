type ContactLabelProps = {
  text: string;
  smallText?: boolean;
  htmlFor?: string;
  setisDropdownOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const ContactLabel = ({
  text,
  smallText = false,
  htmlFor,
  setisDropdownOpen,
}: ContactLabelProps) => {
  if (smallText) {
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
        onClick={
          setisDropdownOpen
            ? () => {
                setisDropdownOpen(true);
              }
            : undefined
        }
      >
        {text}
      </label>
    );
  }
};

export default ContactLabel;
