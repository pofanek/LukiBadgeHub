type ContactInputProps = {
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  id: string;
  placeholder: string;
};

const ContactInput = ({
  value,
  setter,
  id,
  placeholder,
}: ContactInputProps) => {
  return (
    <input
      id={id}
      onChange={(e) => setter(e.target.value)}
      type="text"
      value={value}
      placeholder={placeholder}
      className={`text-font-primary bg-surface hover:ring-brand-secondary focus-within:ring-brand-secondary text-md max-w-full flex-1 rounded-2xl bg-linear-to-r p-1.5 px-4 transition-all duration-200 outline-none focus-within:ring-2 hover:ring-2 lg:max-w-[80%]`}
    />
  );
};

export default ContactInput;
