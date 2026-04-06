import { LuCheck } from "react-icons/lu";

type RememberMeProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const RememberMe = ({ value, setter }: RememberMeProps) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-center gap-2 sm:gap-3"
      onClick={() => setter(!value)}
    >
      <div
        className={`border-surface-soft flex h-5 min-h-5 w-5 min-w-5 items-center justify-center rounded-md border-2 transition-all ${value ? "bg-brand-secondary border-brand-secondary" : ""}`}
      >
        {value && <LuCheck size={14} className="text-white" />}
      </div>
      <span className="text-font-secondary font-sans select-none">
        Remember me
      </span>
    </div>
  );
};

export default RememberMe;
