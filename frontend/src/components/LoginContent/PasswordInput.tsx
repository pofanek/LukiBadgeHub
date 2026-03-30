import { useRef, useState } from "react";
import { LuEye, LuEyeOff, LuLock } from "react-icons/lu";
type PasswordInputProps = {
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
  id: string;
};
const PasswordInput = ({ value, setter, id }: PasswordInputProps) => {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => {
        inputRef.current?.focus();
      }}
      className="text-font-primary border-surface-soft hover:ring-surface-raised focus-within:ring-surface-raised text-md flex max-w-full min-w-64 gap-3 rounded-xl border-2 px-4 py-2 transition-all duration-200 outline-none focus-within:ring-2 hover:ring-2"
    >
      <LuLock size={24} className="shrink-0 text-gray-500" />
      <input
        id={id}
        ref={inputRef}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder="Password"
        className="w-[90%] bg-transparent outline-none"
      />
      {show ? (
        <LuEyeOff
          size={24}
          className="shrink-0 text-gray-500"
          onClick={() => setShow(!show)}
        />
      ) : (
        <LuEye
          size={24}
          onClick={() => setShow(!show)}
          className="shrink-0 text-gray-500"
        />
      )}
    </div>
  );
};

export default PasswordInput;
