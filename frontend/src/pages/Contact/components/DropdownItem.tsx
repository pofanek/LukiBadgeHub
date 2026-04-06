import type { ContactTopic } from "../../../types/Contact";

type DropdownItemProps = {
  text: ContactTopic;
  className?: string;
  setSelectedOption: React.Dispatch<React.SetStateAction<ContactTopic>>;
  setisDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownItem = ({
  className = "",
  text,
  setSelectedOption,
  setisDropdownOpen,
}: DropdownItemProps) => {
  return (
    <button
      onClick={() => {
        setSelectedOption(text);
        setisDropdownOpen(false);
      }}
      type="button"
      className={`${className} hover:bg-brand-secondary active:bg-brand-secondary hover:text-font-secondary flex w-full cursor-pointer items-center justify-start p-2 pl-5 transition-all duration-200`}
    >
      {text}
    </button>
  );
};

export default DropdownItem;
