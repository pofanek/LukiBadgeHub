type DropdownItemProps = {
  text: string;
  className?: string;
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
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
      className={`${className} hover:bg-brand-secondary active:bg-brand-secondary hover:text-font-secondary flex w-full cursor-pointer items-center justify-center p-2 transition-all duration-200`}
    >
      {text}
    </button>
  );
};

export default DropdownItem;
