type EmailInputProps = {
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  id: string;
};
import { useRef } from "react";
import { LuMail } from "react-icons/lu";
const EmailInput = ({ value, setter, id }: EmailInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => {
        inputRef.current?.focus();
      }}
      className="text-font-primary border-surface-soft hover:ring-surface-raised focus-within:ring-surface-raised flex w-[80%] max-w-full min-w-64 gap-3 rounded-xl border-2 px-4 py-2 transition-all duration-200 outline-none focus-within:ring-2 hover:ring-2"
    >
      <LuMail size={24} className="shrink-0 text-gray-500" />
      <input
        required={true}
        ref={inputRef}
        id={id}
        onChange={(e) => setter(e.target.value)}
        type="email"
        value={value}
        placeholder="Email"
        className={`bg-transparent outline-none`}
      />
    </div>
  );
};

export default EmailInput;
