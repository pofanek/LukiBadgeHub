type ContactInputProps = {
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  id: string;
  placeholder: string;
  required?: boolean;
  type?: string;
};

const ContactInput = ({
  value,
  setter,
  id,
  placeholder,
  required = true,
  type = "text",
}: ContactInputProps) => {
  return (
    <input
      id={id}
      onChange={(e) => setter(e.target.value)}
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      className={`text-font-primary bg-surface hover:ring-brand-secondary focus:ring-brand-secondary max-w-full flex-1 rounded-2xl bg-linear-to-r p-1.5 px-4 transition-all duration-200 outline-none hover:ring-2 focus:ring-2 lg:max-w-[80%]`}
    />
  );
};

export default ContactInput;
